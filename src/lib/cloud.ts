/* ------------------------------------------------------------------ */
/* Cloud sync client — talks to /api/auth/* and /api/vault.            */
/* Login = the owner's MPIN only. The session token (30 days) and the  */
/* device DEK live in localStorage on THIS device only.                */
/* ------------------------------------------------------------------ */

import type { BusinessSettings, Invoice } from './types';

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

async function authedFetch(
  url: string,
  method: 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
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
  staffCount?: number;
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
        staffCount: Number(data.staffCount ?? 0),
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

/* ------------------------------------------------------------------ */
/* Barcode bill verification — Code 128 registry on the server          */
/* ------------------------------------------------------------------ */

export interface VerifyItem {
  name: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
}

export interface VerifyBillPayload {
  code: string;
  billNo: string;
  companyName: string;
  billDateISO: string;
  customerName: string;
  items: VerifyItem[];
  gstPercent: number;
  gstAmount: number;
  discount: number;
  labourCharge: number;
  autoCharge: number;
  subtotal: number;
  total: number;
  paid: number;
  balance: number;
  paymentMode: string;
  paymentStatus: string;
  createdBy: string;
}

/** Register (or refresh) a bill in the barcode verification registry.
 *  Called automatically when a bill is completed / its payment changes.
 *  Returns the code that owns the bill — a 409 race hands back the winner. */
export async function registerVerifiedBill(
  invoice: Invoice,
  settings: BusinessSettings
): Promise<{ ok: boolean; code?: string }> {
  if (!invoice.verifyCode) return { ok: false, code: undefined };
  const payload: VerifyBillPayload = {
    code: invoice.verifyCode,
    billNo: invoice.no,
    companyName: settings.companyName || 'SLP Cement Works',
    billDateISO: invoice.dateISO,
    customerName: invoice.customer.name || '',
    items: invoice.items.map((it) => ({
      name: it.name,
      size: it.size,
      qty: it.qty,
      price: it.price,
      discount: it.discount || 0,
    })),
    gstPercent: invoice.totals.gst ? settings.gstPercent || 0 : 0,
    gstAmount: invoice.totals.gst || 0,
    discount: invoice.totals.discount || 0,
    labourCharge: invoice.labourCharge || 0,
    autoCharge: invoice.autoCharge || 0,
    subtotal: invoice.totals.subtotal,
    total: invoice.totals.total,
    paid: invoice.totals.paid,
    balance: invoice.totals.balance,
    paymentMode: invoice.paymentMode,
    paymentStatus: invoice.status,
    createdBy: invoice.createdBy || 'Owner',
  };
  try {
    const res = await authedFetch('/api/verify/register', 'POST', payload);
    if (res.status === 409 && res.data.error === 'billRegistered' && typeof res.data.code === 'string') {
      // another device registered this bill first — adopt ITS code so the
      // printed barcode matches the registry (self-healing race recovery)
      return { ok: true, code: res.data.code };
    }
    return { ok: res.status === 200, code: undefined };
  } catch {
    return { ok: false, code: undefined };
  }
}

export interface VerifyLookupResult {
  status: 'valid' | 'cancelled' | 'not_found' | 'rate_limited';
  bill?: {
    companyName: string;
    billNo: string;
    billDateISO: string;
    customerName: string;
    items: VerifyItem[];
    gstPercent: number;
    gstAmount: number;
    discount: number;
    labourCharge: number;
    autoCharge: number;
    subtotal: number;
    total: number;
    paid: number;
    balance: number;
    paymentMode: string;
    paymentStatus: string;
    createdBy: string;
    registeredAtISO: string;
  };
  history?: { count: number; recent: Array<{ result: string; at: string }> };
}

/** PUBLIC barcode verification — no session, the printed barcode is the key */
export async function apiVerifyLookup(code: string): Promise<VerifyLookupResult> {
  try {
    const res = await fetch(`/api/verify/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (res.status === 429) return { status: 'rate_limited' };
    return ((await res.json()) as VerifyLookupResult) ?? { status: 'not_found' };
  } catch {
    return { status: 'not_found' }; // offline — no registry, no claim
  }
}

/** OWNER only: cancel (or re-validate) a bill in the registry */
export async function apiVerifyCancel(billNo: string, cancelled: boolean): Promise<boolean> {
  try {
    const res = await authedFetch('/api/verify/cancel', 'POST', { billNo, cancelled });
    return res.status === 200;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Staff accounts — owner-managed, backend-enforced role               */
/* ------------------------------------------------------------------ */

export interface StaffRow {
  id: string;
  username: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export const apiStaffList = async (): Promise<StaffRow[]> => {
  const res = await authedFetch('/api/staff', 'GET');
  if (res.status !== 200) return [];
  return ((res.data.staff ?? []) as StaffRow[]) ?? [];
};

export interface StaffDekMaterial {
  dekSalt: string;
  dekIv: string;
  dekWrapped: string;
}

/** Create a staff account. dekMaterial = the vault key re-wrapped under the
 *  staff password on THIS (owner's) device — end-to-end stays intact. */
export const apiStaffCreate = async (
  username: string,
  password: string,
  name: string,
  dekMaterial?: StaffDekMaterial
): Promise<{ ok: boolean; error?: string }> => {
  const res = await authedFetch('/api/staff', 'POST', { username, password, name, ...dekMaterial });
  if (res.status === 200) return { ok: true };
  return { ok: false, error: String(res.data.error ?? 'network') };
};

/** Secure reset: new password (re-hashed server-side) and/or new wrapped key */
export const apiStaffUpdate = async (
  id: string,
  patch: { password?: string; name?: string; active?: boolean } & Partial<StaffDekMaterial>
): Promise<{ ok: boolean; error?: string }> => {
  const res = await authedFetch(`/api/staff/${id}`, 'PATCH', patch);
  if (res.status === 200) return { ok: true };
  return { ok: false, error: String(res.data.error ?? 'network') };
};

export const apiStaffDelete = async (id: string): Promise<{ ok: boolean }> => {
  const res = await authedFetch(`/api/staff/${id}`, 'DELETE');
  return { ok: res.status === 200 };
};

export interface StaffLoginResult {
  ok: boolean;
  error?: string;
  token?: string;
  name?: string;
  username?: string;
  dekSalt?: string | null;
  dekIv?: string | null;
  dekWrapped?: string | null;
}

/** Staff sign-in — username + password; the backend binds the session to the staff role */
export const apiStaffLogin = async (username: string, password: string): Promise<StaffLoginResult> => {
  try {
    const { status, data } = await postJson('/api/auth/staff/login', { username, password });
    if (status === 200) {
      return {
        ok: true,
        token: data.token as string,
        name: data.name as string,
        username: data.username as string,
        dekSalt: data.dekSalt as string | null,
        dekIv: data.dekIv as string | null,
        dekWrapped: data.dekWrapped as string | null,
      };
    }
    return { ok: false, error: (data.error as string) ?? 'network' };
  } catch {
    return { ok: false, error: 'network' };
  }
};

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
