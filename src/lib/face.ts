/* Face unlock (v40) — a device-local convenience gate.
 *
 * HOW IT WORKS
 *   Enroll (Settings → Security → Face Unlock): the camera captures a few
 *   samples of the owner's face; each sample becomes a normalized landmark
 *   embedding (MediaPipe FaceLandmarker, 478 3-D points, aligned by the
 *   inter-eye distance). The embeddings stay ON THIS DEVICE (localStorage)
 *   — the server never sees a face, and no other device can use them.
 *
 *   Unlock (LockScreen): the camera matches the face against the stored
 *   samples (cosine similarity, 2-of-3 frames). On a match the app opens
 *   WITHOUT the MPIN — exactly like a successful MPIN unlock: the session
 *   token already on the device is reused, the vault DEK is already local.
 *
 * SECURITY MODEL (honest one)
 *   This is convenience, not cryptography: a printed photo could fool a
 *   webcam. The MPIN / owner password remain the root of security — face
 *   unlock only skips the DAILY PIN prompt on a trusted personal device,
 *   and it can only open an app whose session token is already stored
 *   here. Turning it off or re-enrolling wipes the samples instantly.
 */
'use client';

const STORE_KEY = 'slp-face-unlock-v1';

export interface FaceProfile {
  enabled: boolean;
  /** normalized landmark embeddings — one per enrolled sample */
  samples: number[][];
  enrolledAt: number;
}

/** cosine similarity in [-1, 1]; faces above ~0.93 are the same person */
export const FACE_MATCH_THRESHOLD = 0.93;

export function getFaceProfile(): FaceProfile | null {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as FaceProfile;
    if (!p || !Array.isArray(p.samples) || p.samples.length === 0) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveFaceProfile(p: FaceProfile): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(p));
}

export function clearFaceProfile(): void {
  try {
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* storage unavailable */
  }
}

/* ------------------------------------------------------------------ */
/* MediaPipe FaceLandmarker — lazy singleton, wasm + model self-hosted  */
/* ------------------------------------------------------------------ */

type LandmarkerLike = {
  detect: (image: HTMLCanvasElement | HTMLVideoElement) => {
    faceLandmarks: Array<Array<{ x: number; y: number; z: number }>>;
  };
  close?: () => void;
};

let landmarkerPromise: Promise<LandmarkerLike> | null = null;

export function ensureFaceLandmarker(): Promise<LandmarkerLike> {
  if (!landmarkerPromise) {
    landmarkerPromise = (async () => {
      const vision = await import('@mediapipe/tasks-vision');
      const fileset = await vision.FilesetResolver.forVisionTasks('/mediapipe/wasm');
      const make = (delegate: 'GPU' | 'CPU') =>
        vision.FaceLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: '/mediapipe/face_landmarker.task', delegate },
          runningMode: 'IMAGE',
          numFaces: 1,
        });
      try {
        return (await make('GPU')) as unknown as LandmarkerLike;
      } catch {
        return (await make('CPU')) as unknown as LandmarkerLike; // old WebView / no WebGL2
      }
    })();
    landmarkerPromise.catch(() => {
      landmarkerPromise = null; // allow a retry after a failed load
    });
  }
  return landmarkerPromise;
}

/** normalized embedding from one video frame, or null when no face found */
export async function extractEmbedding(video: HTMLVideoElement): Promise<number[] | null> {
  const landmarker = await ensureFaceLandmarker();
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 320;
  canvas.height = video.videoHeight || 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const res = landmarker.detect(canvas);
  const lm = res.faceLandmarks?.[0];
  if (!lm || lm.length < 400) return null;
  // translation: subtract the centroid; scale: inter-eye distance (33 ↔ 263)
  let cx = 0, cy = 0, cz = 0;
  for (const p of lm) { cx += p.x; cy += p.y; cz += p.z; }
  cx /= lm.length; cy /= lm.length; cz /= lm.length;
  const a = lm[33], b = lm[263];
  const eyeDist = Math.hypot(b.x - a.x, b.y - a.y) || 1e-6;
  const out: number[] = [];
  for (const p of lm) {
    out.push((p.x - cx) / eyeDist, (p.y - cy) / eyeDist, (p.z - cz) / eyeDist);
  }
  return out;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) {
    dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/* ------------------------------------------------------------------ */
/* Camera — FRONT camera, hardened for phones + the APK WebView         */
/* ------------------------------------------------------------------ */

export type FaceCameraErrorKind = 'denied' | 'unavailable' | 'failed';

/** thrown by openFaceCamera with a .kind the UI can translate */
export class FaceCameraError extends Error {
  kind: FaceCameraErrorKind;
  constructor(kind: FaceCameraErrorKind, cause?: unknown) {
    super(kind);
    this.kind = kind;
    this.cause = cause;
  }
}

/**
 * Open the FRONT camera ('user' facing) and return a PLAYING video element.
 *
 * v41 hardening — this is why the camera failed on some devices before:
 *   1. the video element is attached to the page BEFORE play() — several
 *      WebViews refuse to play a detached element;
 *   2. front camera is requested as an IDEAL (never an exact) constraint,
 *      with a plain-camera fallback for devices that don't label cameras;
 *   3. permission failures are reported as typed errors so the UI can say
 *      "allow the camera" instead of a generic failure.
 */
export async function openFaceCamera(
  host?: HTMLElement | null
): Promise<{ video: HTMLVideoElement; stop: () => void }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new FaceCameraError('unavailable'); // insecure context / no media stack
  }
  const constraints: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'user' }, width: { ideal: 480 }, height: { ideal: 360 } }, audio: false },
    { video: true, audio: false }, // some devices reject facingMode entirely
  ];
  let stream: MediaStream | null = null;
  let lastErr: unknown = null;
  for (const c of constraints) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(c);
      break;
    } catch (e) {
      lastErr = e;
      const name = (e as DOMException)?.name ?? '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        throw new FaceCameraError('denied', e); // no point trying other constraints
      }
    }
  }
  if (!stream) {
    throw new FaceCameraError('unavailable', lastErr);
  }
  const video = document.createElement('video');
  video.srcObject = stream;
  video.playsInline = true;
  video.muted = true;
  video.setAttribute('playsinline', ''); // iOS Safari legacy attribute
  // mirror + fill — one place, every caller looks the same
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  video.style.transform = 'scaleX(-1)'; // selfie mirror
  if (host) host.replaceChildren(video);
  try {
    await video.play();
  } catch (e) {
    // detached / gesture-restricted play — retry once the frame is live
    await new Promise((r) => setTimeout(r, 250));
    try {
      await video.play();
    } catch (e2) {
      stream.getTracks().forEach((tr) => tr.stop());
      throw new FaceCameraError('failed', e2);
    }
  }
  return {
    video,
    stop: () => stream?.getTracks().forEach((tr) => tr.stop()),
  };
}

/** wait until the stream actually delivers frames (or give up) */
async function waitFrames(video: HTMLVideoElement, timeoutMs = 2500): Promise<boolean> {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    if (video.readyState >= 2 && video.videoWidth > 0) return true;
    await new Promise((r) => setTimeout(r, 80));
  }
  return false;
}

/** best similarity of one frame against every enrolled sample */
function bestScore(emb: number[], samples: number[][]): number {
  let best = 0;
  for (const s of samples) best = Math.max(best, cosine(emb, s));
  return best;
}

/** Enroll: collect `count` good frames (retries — slight head moves help) */
export async function enrollFace(
  video: HTMLVideoElement,
  count: number,
  onProgress?: (done: number, total: number) => void
): Promise<number[][]> {
  if (!(await waitFrames(video))) throw new FaceCameraError('failed');
  const samples: number[][] = [];
  const maxTries = count * 2;
  for (let i = 0; i < maxTries && samples.length < count; i++) {
    const emb = await extractEmbedding(video);
    if (emb) samples.push(emb);
    onProgress?.(samples.length, count);
    await new Promise((r) => setTimeout(r, 450));
  }
  if (samples.length < 2) throw new FaceCameraError('failed'); // no usable face frames
  return samples;
}

/** Match: grab 3 frames — at least 2 must clear the threshold */
export async function matchFace(
  video: HTMLVideoElement,
  profile: FaceProfile
): Promise<{ ok: boolean; score: number }> {
  if (!(await waitFrames(video))) return { ok: false, score: 0 };
  let hits = 0;
  let score = 0;
  for (let i = 0; i < 3; i++) {
    const emb = await extractEmbedding(video);
    if (emb) {
      const s = bestScore(emb, profile.samples);
      score = Math.max(score, s);
      if (s >= FACE_MATCH_THRESHOLD) hits++;
    }
    await new Promise((r) => setTimeout(r, 260));
  }
  return { ok: hits >= 2, score };
}
