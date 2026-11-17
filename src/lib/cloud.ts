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

export async function authedFetch(
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
  hasOwnerPassword?: boolean;
  ownerUsername?: string | null;
  ownerPasswordIsDefault?: boolean;
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
        hasOwnerPassword: Boolean(data.hasOwnerPassword),
        ownerUsername: (data.ownerUsername as string) ?? null,
        ownerPasswordIsDefault: Boolean(data.ownerPasswordIsDefault),
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
  /** v35 — price-edit + discount oversight (recorded verbatim on the server) */
  origPrice?: number;
  discountType?: 'amount' | 'percent';
  discountValue?: number;
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
  /** bill-level discount kind + value (₹ or %) — the server recomputes it */
  discountType?: 'amount' | 'percent';
  discountValue?: number;
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

export interface RegisterResult {
  ok: boolean;
  code?: string;
  /** network failed — the bill must be queued and retried when back online */
  offline?: boolean;
  /** over-limit staff discount — flagged pending approval by the server */
  needsApproval?: boolean;
}

/** Register (or refresh) a bill in the barcode verification registry.
 *  Called automatically when a bill is completed / its payment changes.
 *  Returns the code that owns the bill — a 409 race hands back the winner. */
export async function registerVerifiedBill(
  invoice: Invoice,
  settings: BusinessSettings
): Promise<RegisterResult> {
  if (!invoice.verifyCode) return { ok: false };
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
      ...(it.origPrice !== undefined ? { origPrice: it.origPrice } : {}),
      ...(it.discountType ? { discountType: it.discountType, discountValue: it.discountValue || 0 } : {}),
    })),
    gstPercent: invoice.totals.gst ? settings.gstPercent || 0 : 0,
    gstAmount: invoice.totals.gst || 0,
    discount: invoice.totals.discount || 0,
    discountType: invoice.discountType,
    discountValue: invoice.discountValue,
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
    if (res.status === 200) {
      return {
        ok: true,
        needsApproval: Boolean(res.data.needsApproval),
      };
    }
    if (res.status === 409 && res.data.error === 'billRegistered' && typeof res.data.code === 'string') {
      // another device registered this bill first — adopt ITS code so the
      // printed barcode matches the registry (self-healing race recovery)
      return { ok: true, code: res.data.code };
    }
    return { ok: false };
  } catch {
    return { ok: false, offline: true };
  }
}

export interface VerifyLookupResult {
  status: 'valid' | 'cancelled' | 'not_found' | 'rate_limited' | 'offline';
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
    // 404 carries {status:'not_found'}; anything that is not well-formed JSON
    // (5xx page, gateway junk) is NOT a verdict — offline, retryable
    try {
      const body = (await res.json()) as VerifyLookupResult;
      if (body && typeof body.status === 'string') return body;
    } catch {
      /* non-JSON body — offline below */
    }
    return { status: 'offline' };
  } catch (e) {
    // offline / timeout — NEVER claim INVALID BILL without the server's answer
    return { status: 'offline' };
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

/* ------------------------------------------------------------------ */
/* Owner (Admin) username + password login — v35                       */
/* ------------------------------------------------------------------ */

export interface OwnerLoginResult {
  ok: boolean;
  error?: string;
  token?: string;
  username?: string;
  passwordIsDefault?: boolean;
  dekSalt?: string | null;
  dekIv?: string | null;
  dekWrapped?: string | null;
}

/** Owner/Admin sign-in with the username + password gate (Pradeep / 2125
 *  until changed). The session is bound to the OWNER role and the vault DEK
 *  wrapped under THIS password comes back so the device opens the vault. */
export const apiOwnerLogin = async (username: string, password: string): Promise<OwnerLoginResult> => {
  try {
    const { status, data } = await postJson('/api/auth/owner/login', { username, password });
    if (status === 200) {
      return {
        ok: true,
        token: data.token as string,
        username: data.username as string,
        passwordIsDefault: Boolean(data.passwordIsDefault),
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

export interface OwnerPasswordResult {
  ok: boolean;
  error?: string;
}

/**
 * Seed (no owner password yet — the documented initial credentials) or
 * change (current password proven) the Owner username + password. The DEK
 * material is re-wrapped under the new password ON THIS DEVICE.
 */
export const apiOwnerPassword = async (payload: {
  username: string;
  password: string;
  currentPassword?: string;
  isDefault?: boolean;
  dekSalt: string;
  dekIv: string;
  dekWrapped: string;
}): Promise<OwnerPasswordResult> => {
  const res = await authedFetch('/api/auth/owner/password', 'POST', payload);
  if (res.status === 200) return { ok: true };
  return { ok: false, error: String(res.data.error ?? 'network') };
};

/** STAFF changes their OWN password (current one proven, DEK re-wrapped here) */
export const apiStaffMePassword = async (payload: {
  currentPassword: string;
  password: string;
  dekSalt: string;
  dekIv: string;
  dekWrapped: string;
}): Promise<OwnerPasswordResult> => {
  const res = await authedFetch('/api/staff/me/password', 'POST', payload);
  if (res.status === 200) return { ok: true };
  return { ok: false, error: String(res.data.error ?? 'network') };
};

/* ------------------------------------------------------------------ */
/* Server-authoritative billing configuration — v35                    */
/* ------------------------------------------------------------------ */

export interface RemoteConfig {
  upiId: string;
  gstPercent: number;
  discountMaxPercent: number;
  discountMaxAmount: number;
  discountApprovalRequired: boolean;
}

const DEFAULT_CONFIG: RemoteConfig = {
  upiId: '',
  gstPercent: 0,
  discountMaxPercent: 100,
  discountMaxAmount: 999999,
  discountApprovalRequired: false,
};

/** Every authed device reads the config (staff billing needs the limits).
 *  `exists=false` = the owner has never saved config — devices then SEED the
 *  server from their own saved settings instead of mirroring blanks. */
export const apiConfigGet = async (): Promise<(RemoteConfig & { exists: boolean }) | null> => {
  try {
    const res = await authedFetch('/api/config', 'GET');
    if (res.status !== 200) return null;
    const c = res.data.config as Partial<RemoteConfig> | undefined;
    if (!c) return null;
    return { ...DEFAULT_CONFIG, ...c, exists: Boolean(res.data.exists) };
  } catch {
    return null;
  }
};

/** OWNER ONLY — save config changes (the server audits every change).
 *  PATCH semantics: absent fields keep their current server value. */
export const apiConfigPut = async (
  config: Partial<RemoteConfig>
): Promise<{ ok: boolean; error?: string }> => {
  const res = await authedFetch('/api/config', 'PUT', config);
  if (res.status === 200) return { ok: true };
  return { ok: false, error: String(res.data.error ?? 'network') };
};

/* ------------------------------------------------------------------ */
/* Admin notifications — one per successful staff bill — v35           */
/* ------------------------------------------------------------------ */

export interface NotificationRow {
  id: string;
  type: string;
  billNo: string;
  staffName: string;
  staffUsername: string;
  customerName: string;
  total: number;
  discount: number;
  paymentStatus: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}

export const apiNotificationsGet = async (
  since?: string
): Promise<{ unread: number; notifications: NotificationRow[] } | null> => {
  try {
    const qs = since ? `?since=${encodeURIComponent(since)}` : '';
    const res = await authedFetch(`/api/notifications${qs}`, 'GET');
    if (res.status !== 200) return null;
    return {
      unread: Number(res.data.unread ?? 0),
      notifications: (res.data.notifications ?? []) as NotificationRow[],
    };
  } catch {
    return null;
  }
};

/** mark notifications read — {ids} or {all:true} */
export const apiNotificationsRead = async (
  ids?: string[]
): Promise<{ ok: boolean; unread?: number }> => {
  const res = await authedFetch('/api/notifications', 'POST', ids ? { ids } : { all: true });
  if (res.status === 200) return { ok: true, unread: Number(res.data.unread ?? 0) };
  return { ok: false };
};

/* ------------------------------------------------------------------ */
/* Staff Billing Activity — the owner's monitor over the registry — v35 */
/* ------------------------------------------------------------------ */

export interface BillRecordItem {
  name: string;
  size: string;
  qty: number;
  price: number;
  origPrice?: number;
  discountType?: string;
  discountValue?: number;
  discount: number;
}

export interface BillRecord {
  code: string;
  billNo: string;
  companyName: string;
  billDateISO: string;
  customerName: string;
  items: BillRecordItem[];
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
  createdById: string;
  cancelled: boolean;
  highDiscount: boolean;
}

export interface StaffTotals {
  staff: string;
  bills: number;
  sales: number;
  discounts: number;
}

export const apiBillsGet = async (params: {
  q?: string;
  staff?: string;
  from?: string;
  to?: string;
}): Promise<{ bills: BillRecord[]; staffTotals: StaffTotals[] } | null> => {
  try {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.staff) qs.set('staff', params.staff);
    if (params.from) qs.set('from', params.from);
    if (params.to) qs.set('to', params.to);
    const res = await authedFetch(`/api/bills?${qs.toString()}`, 'GET');
    if (res.status !== 200) return null;
    return {
      bills: (res.data.bills ?? []) as BillRecord[],
      staffTotals: (res.data.staffTotals ?? []) as StaffTotals[],
    };
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Audit log — price edits, discounts, cancellations, config — v35     */
/* ------------------------------------------------------------------ */

export interface AuditRow {
  id: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export const apiAuditGet = async (limit = 200): Promise<AuditRow[]> => {
  try {
    const res = await authedFetch(`/api/audit?limit=${limit}`, 'GET');
    if (res.status !== 200) return [];
    return (res.data.events ?? []) as AuditRow[];
  } catch {
    return [];
  }
};

/** record a client-side action (product price change, etc.) — the server
 *  stamps the ACTOR from the session, so the role is always trustworthy */
export const apiAuditPost = async (
  action: string,
  target: string,
  details: Record<string, unknown>
): Promise<boolean> => {
  try {
    const res = await authedFetch('/api/audit', 'POST', { action, target, details });
    return res.status === 200;
  } catch {
    return false;
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
