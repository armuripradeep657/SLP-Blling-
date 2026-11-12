/* ------------------------------------------------------------------ */
/* End-to-end encryption for cloud sync (WebCrypto, browser only).     */
/*                                                                     */
/*  DEK  — random AES-256-GCM key that encrypts the business data.     */
/*  KEK  — derived from phone + PIN (PBKDF2-SHA256, 210k rounds) and   */
/*         used only to wrap/unwrap the DEK.                           */
/*                                                                     */
/*  The PIN and the raw DEK never leave the device: the server only    */
/*  ever receives (a) the wrapped DEK + public salt, and (b) the       */
/*  AES-GCM ciphertext of the data. Wrong PIN → unwrap fails.          */
/* ------------------------------------------------------------------ */

const PBKDF2_ITERATIONS = 210_000;
const enc = new TextEncoder();

export function bufToB64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

export function b64ToBuf(b64: string): Uint8Array<ArrayBuffer> {
  const s = atob(b64);
  const out = new Uint8Array(new ArrayBuffer(s.length));
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function randomB64(bytes: number): string {
  const b = new Uint8Array(new ArrayBuffer(bytes));
  crypto.getRandomValues(b);
  return bufToB64(b);
}

/** Fresh random data-encryption key (AES-GCM 256, extractable so it can be wrapped) */
export async function generateDek(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/** raw DEK → base64 (stored on THIS device only, for quick unlock) */
export async function exportDek(dek: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', dek);
  return bufToB64(raw);
}

/** base64 → DEK */
export async function importDek(b64: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', b64ToBuf(b64), { name: 'AES-GCM' }, true, [
    'encrypt',
    'decrypt',
  ]);
}

/** KEK from phone + PIN + stored salt (PBKDF2-SHA256) */
export async function deriveKek(phone: string, pin: string, saltB64: string): Promise<CryptoKey> {
  const base = await crypto.subtle.importKey(
    'raw',
    enc.encode(`slp-cement|${phone}|${pin}`),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: b64ToBuf(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Wrap the DEK with the KEK → { wrapped, iv } (both base64, sent to server) */
export async function wrapDek(
  dek: CryptoKey,
  kek: CryptoKey
): Promise<{ wrapped: string; iv: string }> {
  const raw = await crypto.subtle.exportKey('raw', dek);
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, kek, raw);
  return { wrapped: bufToB64(ct), iv: bufToB64(iv) };
}

/** Unwrap the DEK with the KEK — throws when the PIN is wrong (GCM auth fails) */
export async function unwrapDek(wrappedB64: string, ivB64: string, kek: CryptoKey): Promise<CryptoKey> {
  const raw = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(ivB64) },
    kek,
    b64ToBuf(wrappedB64)
  );
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

/** Encrypt any JSON-able state with the DEK → { ciphertext, dataIv } (base64) */
export async function encryptJson(
  dek: CryptoKey,
  data: unknown
): Promise<{ ciphertext: string; dataIv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)));
  const msg = new TextEncoder().encode(JSON.stringify(data));
  const pt = new Uint8Array(new ArrayBuffer(msg.length));
  pt.set(msg);
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, dek, pt);
  return { ciphertext: bufToB64(ct), dataIv: bufToB64(iv) };
}

/** Decrypt the vault blob with the DEK — throws when it cannot be opened */
export async function decryptJson<T>(dek: CryptoKey, ciphertextB64: string, ivB64: string): Promise<T> {
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64ToBuf(ivB64) },
    dek,
    b64ToBuf(ciphertextB64)
  );
  return JSON.parse(new TextDecoder().decode(pt)) as T;
}
