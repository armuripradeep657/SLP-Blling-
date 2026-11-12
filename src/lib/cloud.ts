/* ------------------------------------------------------------------ */
/* Cloud sync client — talks to /api/auth/* and /api/vault.            */
/* Session token + device DEK live in localStorage on THIS device only. */
/* ------------------------------------------------------------------ */

const AUTH_KEY = 'slp-auth-v1'; // { phone, token } — 30-day session
const DEK_KEY = 'slp-dek-v1'; // raw DEK (b64) — device keeps itself unlocked

export interface CloudAuth {
  phone: string;
  token: string;
}

export function getAuth(): CloudAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const a = JSON.parse(raw);
    return a?.phone && a?.token ? a : null;
  } catch {
    return null;
  }
}

export function setAuth(phone: string, token: string): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ phone, token }));
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

async function postJson(url: string, body: unknown, token?: string): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { error: 'network' } };
  }
}

async function authedFetch(url: string, method: 'GET' | 'PUT', body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
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
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { error: 'network' } };
  }
}

export interface OtpRequestResult {
  ok: boolean;
  demo?: boolean;
  otp?: string;
  sentTo?: string;
  gatewayConfigured?: boolean;
  error?: string;
}

export async function apiRequestOtp(phone: string): Promise<OtpRequestResult> {
  const { status, data } = await postJson('/api/auth/request-otp', { phone });
  if (status === 200) return { ok: true, ...data } as OtpRequestResult;
  return { ok: false, error: (data.error as string) ?? 'network' };
}

export interface VerifyResult {
  ok: boolean;
  token?: string;
  phone?: string;
  hasPin?: boolean;
  error?: string;
  attemptsLeft?: number;
}

export async function apiVerifyOtp(phone: string, otp: string): Promise<VerifyResult> {
  const { status, data } = await postJson('/api/auth/verify-otp', { phone, otp });
  if (status === 200) return { ok: true, ...data } as VerifyResult;
  return { ok: false, error: (data.error as string) ?? 'network', attemptsLeft: data.attemptsLeft as number | undefined };
}

export async function apiSavePin(dekWrapped: string, dekSalt: string): Promise<{ ok: boolean; error?: string }> {
  const auth = getAuth();
  if (!auth) return { ok: false, error: 'unauthorized' };
  const { status, data } = await postJson('/api/auth/pin', { dekWrapped, dekSalt }, auth.token);
  return status === 200 ? { ok: true } : { ok: false, error: (data.error as string) ?? 'network' };
}

export type VaultPull =
  | { kind: 'empty' }
  | {
      kind: 'data';
      ciphertext: string;
      dataIv: string;
      dataVersion: number;
      /** wrapped DEK + PBKDF2 salt — a NEW device needs them with the PIN to open the data */
      dekWrapped: string;
      dekSalt: string;
    }
  | { kind: 'auth' }
  | { kind: 'offline' };

export async function apiPullVault(): Promise<VaultPull> {
  const { status, data } = await authedFetch('/api/vault', 'GET');
  if (status === 200) {
    if (data.empty) return { kind: 'empty' };
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
