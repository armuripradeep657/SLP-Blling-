'use client';

/**
 * Read an image File into a small base64 data-URL — profile photos and the
 * forgot-password identity shots must stay tiny (SQLite rows, sync payloads).
 * Downscaled to fit 480×480 and re-encoded as JPEG q0.72 (~60-90 KB).
 */
export function fileToSmallDataUrl(file: File, max = 480): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('readFailed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('decodeFailed'));
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvasFailed'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.72));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

/* ------------------------------------------------------------------ */
/* Live device camera (v42) — product photos use a real in-app preview  */
/* ------------------------------------------------------------------ */

export type CameraErrorKind = 'denied' | 'unavailable' | 'failed';

/** thrown by openDeviceCamera with a .kind the UI can translate */
export class CameraError extends Error {
  kind: CameraErrorKind;
  constructor(kind: CameraErrorKind, cause?: unknown) {
    super(kind);
    this.kind = kind;
    this.cause = cause;
  }
}

/**
 * Open a LIVE camera preview and return a PLAYING video element attached to
 * `host`. Hardened for phones + the APK WebView:
 *   1. the video element attaches to the page BEFORE play() — several
 *      WebViews refuse to play a detached element;
 *   2. the requested camera is an IDEAL (never exact) constraint, with a
 *      plain-camera fallback for devices that don't label cameras;
 *   3. permission failures come back as typed errors.
 * facing 'environment' = rear camera (product photos), 'user' = front.
 */
export async function openDeviceCamera(
  facing: 'user' | 'environment',
  host?: HTMLElement | null
): Promise<{ video: HTMLVideoElement; stop: () => void }> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('unavailable'); // insecure context / no media stack
  }
  const constraints: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: facing }, width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false },
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
        throw new CameraError('denied', e); // no point trying other constraints
      }
    }
  }
  if (!stream) {
    throw new CameraError('unavailable', lastErr);
  }
  const video = document.createElement('video');
  video.srcObject = stream;
  video.playsInline = true;
  video.muted = true;
  video.setAttribute('playsinline', ''); // iOS Safari legacy attribute
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'cover';
  if (host) host.replaceChildren(video);
  try {
    await video.play();
  } catch {
    // gesture-restricted play — retry once
    await new Promise((r) => setTimeout(r, 250));
    try {
      await video.play();
    } catch (e2) {
      stream.getTracks().forEach((tr) => tr.stop());
      throw new CameraError('failed', e2);
    }
  }
  // wait until the stream actually delivers frames (or give up)
  const t0 = Date.now();
  while (Date.now() - t0 < 2500) {
    if (video.readyState >= 2 && video.videoWidth > 0) break;
    await new Promise((r) => setTimeout(r, 80));
  }
  return {
    video,
    stop: () => stream?.getTracks().forEach((tr) => tr.stop()),
  };
}

/** Grab the current video frame as a resized JPEG data URL (640px, q0.78 —
 *  the same encoding the file-upload path uses so both stay tiny) */
export function grabCameraFrame(video: HTMLVideoElement, max = 640, quality = 0.78): string {
  const scale = Math.min(1, max / Math.max(video.videoWidth, video.videoHeight || 1));
  const w = Math.max(1, Math.round((video.videoWidth || 640) * scale));
  const h = Math.max(1, Math.round((video.videoHeight || 480) * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}
