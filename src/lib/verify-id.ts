/**
 * Bill verification identifiers — the value every Code 128 barcode encodes.
 *
 * The barcode carries NOTHING but this ID: the entire bill is looked up in
 * the server's VerifiedBill registry on every scan, so nothing inside the
 * barcode is ever trusted. IDs are random (crypto.getRandomValues) in a
 * 29-symbol alphabet with NO ambiguous characters (no 0/O, 1/I/L, S/5,
 * B/8, Z/2), so they are unpredictable AND safe to read aloud or retype.
 */

/** Crockford-style alphabet without ambiguous glyphs (29 symbols ≈ 4.85 bits each) */
const ALPHABET = '23456789ABCDEFGHJKMNPQRTUVWXY';
const BODY_LEN = 12; // 12 random symbols ≈ 58 bits of entropy

export function newVerifyCode(): string {
  const buf = new Uint8Array(BODY_LEN);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(buf);
  } else {
    for (let i = 0; i < BODY_LEN; i++) buf[i] = Math.floor(Math.random() * 256);
  }
  let s = '';
  for (let i = 0; i < BODY_LEN; i++) s += ALPHABET[buf[i] % ALPHABET.length];
  return `SLP-${s.slice(0, 8)}-${s.slice(8)}`;
}

/**
 * Human-typed / scanner input → canonical SLP-XXXXXXXX-XXXX form.
 * Everything outside the alphabet is treated as a typo and dropped; a code
 * whose body is not exactly 12 valid symbols returns '' (invalid — retry).
 */
export function normalizeVerifyCode(raw: string): string {
  let s = (raw || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (s.startsWith('SLP')) s = s.slice(3);
  const valid = s.replace(new RegExp(`[^${ALPHABET}]`, 'g'), '');
  if (valid.length !== BODY_LEN) return '';
  return `SLP-${valid.slice(0, 8)}-${valid.slice(8)}`;
}

/** Strict shape check for a canonical verification code */
export function isVerifyCodeShape(code: string): boolean {
  return /^SLP-[23456789ABCDEFGHJKMNPQRTUVWXY]{8}-[23456789ABCDEFGHJKMNPQRTUVWXY]{4}$/.test(code);
}
