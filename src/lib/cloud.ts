/* ------------------------------------------------------------------ */
/* Cloud sync client — talks to /api/auth/* and /api/vault.            */
/* Login = the owner's MPIN only. The session token (30 days) and the  */
/* device DEK live in localStorage on THIS device only.                */
/* ------------------------------------------------------------------ */

const AUTH_KEY = 'slp-auth-v1'; // { token } — 30-day session
const DEK_KEY = 'slp-dek-v1'; // raw DEK (b64) — device keeps itself unlocked
const RECOVER_KEY = 'slp-recover-v1'; // { salt, verifier, wrapped } — unlock material

/**
 * The device's OWN copy of its credentials (public salt, the login verifier
 * and the wrapped data key). Written the moment the MPIN is created or a
 * login succeeds. With it the MPIN can be checked OFFLINE and the server
 * account can be silently re-registered if the server ever loses it —
 * the owner NEVER has to create the MPIN a second time.
 */
export interface RecoverMaterial {
  salt: string;
  verifier: string;
  /** wrapped DEK in "iv.ciphertext" form */
  wrapped: string;
}

export function getRecoverMaterial(): RecoverMaterial | null {
  try {
    const raw = localStorage.getItem(RECOVER_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<RecoverMaterial>;
    if (m?.salt && m?.verifier && m?.wrapped) {
      return { salt: m.salt, verifier: m.verifier, wrapped: m.wrapped };
    }
    return null;
  } catch {
    return null;
  }
}

export function setRecoverMaterial(m: RecoverMaterial): void {
  try {
    localStorage.setItem(RECOVER_KEY, JSON.stringify(m));
  } catch {
    /* storage unavailable */
  }
}

export function clearRecoverMaterial(): void {
  localStorage.removeItem(RECOVER_KEY);
}

export function getAuth(): { token: string } | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    return a?.token ? { token: a.token } : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token }));
}

export function getDeviceDek(): string | null {
  return localStorage.getItem(DEK_KEY);
}

export function setDeviceDek(b64: string): void {
  localStorage.setItem(DEK_KEY, b64);
}

/** Device stays unlocked only when BOTH the session and the DEK are present */
export function isUnlocked(): boolean {
  return Boolean(getAuth() && getDeviceDek());
}

/** Lock now — wipes the session + key from this device (data stays encrypted on the server) */
export function lockApp(): void {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(DEK_KEY);
}

/* ------------------------------ API ------------------------------ */

async function postJson(url: string, body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { error: 'network' } };
  }
}

async function authedFetch(url: string, method: 'GET' | 'PUT' | 'POST', body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  const auth = getAuth();
  if (!auth) return { status: 401, data: { error: 'unauthorized' } };
  try {
    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({})) ) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { error: 'network' } };
  }
}

/** Public probe: has the MPIN been created yet? Carries the public salt.
 *  Legacy accounts (created before the verifier fix) also carry the wrapped
 *  key so the device can verify the MPIN locally and repair the account. */
export async function apiAuthState(): Promise<{
  ok: boolean;
  hasMpin?: boolean;
  dekSalt?: string | null;
  legacy?: boolean;
  dekWrapped?: string | null;
  error?: string;
}> {
  try {
    const res = await fetch('/api/auth/state', { signal: AbortSignal.timeout(15000) });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (res.status === 200) {
      return {
        ok: true,
        hasMpin: Boolean(data.hasMpin),
        dekSalt: (data.dekSalt as string) ?? null,
        legacy: Boolean(data.legacy),
        dekWrapped: (data.dekWrapped as string) ?? null,
      };
    }
    return { ok: false, error: (data.error as string) ?? 'network' };
  } catch {
    return { ok: false, error: 'network' };
  }
}

export interface MpinResult {
  ok: boolean;
  token?: string;
  error?: string;
}

/** First-ever use: create the MPIN (server receives the wrapped key + verifier only) */
export async function apiMpinSetup(
  dekWrapped: string,
  dekSalt: string,
  kekProof: string
): Promise<MpinResult> {
  const { status, data } = await postJson('/api/auth/setup', { dekWrapped, dekSalt, kekProof });
  if (status === 200) return { ok: true, token: data.token as string };
  return { ok: false, error: (data.error as string) ?? 'network' };
}

/** Every later login: prove the MPIN → 30-day session */
export async function apiMpinUnlock(kekProof: string): Promise<MpinResult> {
  const { status, data } = await postJson('/api/auth/unlock', { kekProof });
  if (status === 200) return { ok: true, token: data.token as string };
  return { ok: false, error: (data.error as string) ?? 'network' };
}

/** One-time repair of a legacy (pre-fix, all-zero verifier) account: the
 *  device proved the MPIN by unwrapping the stored key; store the real
 *  verifier and hand back a session — the owner keeps the SAME MPIN. */
export async function apiMpinRepair(
  kekProof: string,
  dekSalt: string,
  dekWrapped: string
): Promise<MpinResult> {
  const { status, data } = await postJson('/api/auth/repair', { kekProof, dekSalt, dekWrapped });
  if (status === 200) return { ok: true, token: data.token as string };
  return { ok: false, error: (data.error as string) ?? 'network' };
}

/** "Forgot MPIN": the device re-wraps its own data key under a NEW MPIN and
 *  replaces the account's credential chain. The encrypted vault is untouched. */
export async function apiMpinReset(
  dekWrapped: string,
  dekSalt: string,
  kekProof: string
): Promise<MpinResult> {
  const { status, data } = await postJson('/api/auth/reset', { dekWrapped, dekSalt, kekProof });
  if (status === 200) return { ok: true, token: data.token as string };
  return { ok: false, error: (data.error as string) ?? 'network' };
}

/** Poll the payment events for pending UPI bill refs — a match means the
 *  money arrived and the bill completes itself (no button pressed). */
export async function apiPaymentsStatus(refs: string[]): Promise<
  Array<{ billRef: string; amount: number; method: string; waStatus: string; smsStatus: string }>
> {
  try {
    const res = await authedFetch(`/api/payments/status?refs=${encodeURIComponent(refs.join(','))}`, 'GET');
    if (res.status !== 200) return [];
    const evs = (res.data.events ?? []) as Array<Record<string, unknown>>;
    return evs.map((e) => ({
      billRef: String(e.billRef ?? ''),
      amount: Number(e.amount ?? 0),
      method: String(e.method ?? 'UPI'),
      waStatus: String(e.waStatus ?? 'pending'),
      smsStatus: String(e.smsStatus ?? 'pending'),
    }));
  } catch {
    return [];
  }
}

/** Report a payment from THIS device — the owner tapped "Money received" on
 *  the QR screen (the money landed in the personal UPI ID directly, so no
 *  gateway webhook fired). The event is recorded server-side and the bill
 *  completes itself here immediately. */
export async function apiPaymentsWebhook(payload: { billRef: string; amount: number }): Promise<boolean> {
  try {
    const res = await authedFetch('/api/payments/webhook', 'POST', payload);
    return res.status === 200;
  } catch {
    return false;
  }
}

export interface NotifyResult {
  ok: boolean;
  whatsapp: string;
  sms: string;
  detail?: string;
}

/** Auto-send the bill slip to the customer (WhatsApp + SMS) after a payment
 *  is detected — zero taps. Falls back to the on-slip share links when no
 *  provider is configured (result: 'skipped'). */
export async function apiNotifySend(payload: {
  billRef?: string;
  phone: string;
  whatsappText?: string;
  smsText?: string;
}): Promise<NotifyResult> {
  try {
    const { status, data } = await authedFetch('/api/notify/send', 'POST', payload);
    if (status === 200) {
      return {
        ok: true,
        whatsapp: String(data.whatsapp ?? 'skipped'),
        sms: String(data.sms ?? 'skipped'),
        detail: String(data.detail ?? ''),
      };
    }
    return { ok: false, whatsapp: 'failed', sms: 'failed' };
  } catch {
    return { ok: false, whatsapp: 'failed', sms: 'failed' };
  }
}

export type VaultPull =
  | { kind: 'empty'; dekWrapped?: string; dekSalt?: string }
  | {
      kind: 'data';
      ciphertext: string;
      dataIv: string;
      dataVersion: number;
      /** wrapped DEK + PBKDF2 salt — a NEW device needs them with the MPIN to open the data */
      dekWrapped: string;
      dekSalt: string;
    }
  | { kind: 'auth' }
  | { kind: 'offline' };

export async function apiPullVault(): Promise<VaultPull> {
  const { status, data } = await authedFetch('/api/vault', 'GET');
  if (status === 200) {
    if (data.empty) {
      return {
        kind: 'empty',
        dekWrapped: (data.dekWrapped as string) ?? '',
        dekSalt: (data.dekSalt as string) ?? '',
      };
    }
    return {
      kind: 'data',
      ciphertext: data.ciphertext as string,
      dataIv: data.dataIv as string,
      dataVersion: (data.dataVersion as number) ?? 0,
      dekWrapped: (data.dekWrapped as string) ?? '',
      dekSalt: (data.dekSalt as string) ?? '',
    };
  }
  return status === 0 ? { kind: 'offline' } : { kind: 'auth' };
}

export interface VaultPushResult {
  ok: boolean;
  dataVersion?: number;
  error?: string;
}

export async function apiPushVault(ciphertext: string, dataIv: string): Promise<VaultPushResult> {
  const { status, data } = await authedFetch('/api/vault', 'PUT', { ciphertext, dataIv });
  if (status === 200) return { ok: true, dataVersion: data.dataVersion as number };
  return { ok: false, error: (data.error as string) ?? 'network' };
}
