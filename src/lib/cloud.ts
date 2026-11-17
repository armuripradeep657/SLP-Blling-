/* ------------------------------------------------------------------ */
/* Central-server client — talks to /api/auth/*, /api/state and the    */
/* Biz CRUD endpoints. ONLINE-ONLY: every business read/write hits the */
/* one centralized server database; nothing business-related is kept   */
/* in localStorage. Only the session token lives on the device.        */
/* ------------------------------------------------------------------ */

import type { BusinessSettings, Appearance, Invoice, Product, LabourWork, LabourWorker, Expense, IncomeEntry } from './types';

const AUTH_KEY = 'slp-auth-v1'; // { token } — long-lived session
const DEK_KEY = 'slp-dek-v1'; // legacy wrapped-key material (unused for data)
const RECOVER_KEY = 'slp-recover-v1'; // { salt, verifier, wrapped } — offline MPIN check

/** The device's OWN copy of its MPIN credentials (public salt + verifier).
 *  With it the MPIN can be checked OFFLINE (instantly) before the server
 *  issues the session — the owner NEVER has to re-create the MPIN. */
export interface RecoverMaterial {
  salt: string;
  verifier: string;
  /** legacy wrapped key in "iv.ciphertext" form (unused for data) */
  wrapped: string;
}

export function getRecoverMaterial(): RecoverMaterial | null {
  try {
    const raw = localStorage.getItem(RECOVER_KEY);
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<RecoverMaterial>;
    if (m?.salt && m?.verifier) {
      return { salt: m.salt, verifier: m.verifier, wrapped: m.wrapped ?? '' };
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

export function getDeviceDek(): string | null {
  return localStorage.getItem(DEK_KEY);
}

export function setDeviceDek(b64: string): void {
  localStorage.setItem(DEK_KEY, b64);
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

/** Device stays unlocked while the session token is present */
export function isUnlocked(): boolean {
  return Boolean(getAuth());
}

/** Lock now — wipes the session from this device (all data stays central) */
export function lockApp(): void {
  localStorage.removeItem(AUTH_KEY);
}

/* ------------------------------ HTTP ------------------------------ */

async function postJson(url: string, body?: unknown): Promise<{ status: number; data: Record<string, unknown> }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(20000),
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
      signal: AbortSignal.timeout(20000),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    return { status: 0, data: { error: 'network' } };
  }
}

/* ------------------------------ AUTH ------------------------------ */

/** Public probe: has the MPIN been created yet? Carries the public salt. */
export async function apiAuthState(): Promise<{
  ok: boolean;
  hasMpin?: boolean;
  dekSalt?: string | null;
  legacy?: boolean;
  dekWrapped?: string | null;
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

/** First-ever use: create the MPIN (server receives only the verifier) */
export async function apiMpinSetup(
  dekWrapped: string,
  dekSalt: string,
  kekProof: string
): Promise<MpinResult> {
  const { status, data } = await postJson('/api/auth/setup', { dekWrapped, dekSalt, kekProof });
  if (status === 200) return { ok: true, token: data.token as string };
  return { ok: false, error: (data.error as string) ?? 'network' };
}

/** Every later login: prove the MPIN → long-lived session */
export async function apiMpinUnlock(kekProof: string): Promise<MpinResult> {
  const { status, data } = await postJson('/api/auth/unlock', { kekProof });
  if (status === 200) return { ok: true, token: data.token as string };
  return { ok: false, error: (data.error as string) ?? 'network' };
}

/* ------------------------------------------------------------------ */
/* Owner (Admin) username + password login                             */
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

/** Admin sign-in with the username + password gate (Pradeep / 2125 until
 *  changed). Also the recovery path when the MPIN is forgotten. */
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

/** Seed (initial credentials) or change (current password proven) the Admin
 *  username + password. DEK material is legacy — sent as empty strings. */
export const apiOwnerPassword = async (payload: {
  username: string;
  password: string;
  currentPassword?: string;
  isDefault?: boolean;
  dekSalt?: string;
  dekIv?: string;
  dekWrapped?: string;
}): Promise<OwnerPasswordResult> => {
  const res = await authedFetch('/api/auth/owner/password', 'POST', {
    ...payload,
    dekSalt: payload.dekSalt ?? '',
    dekIv: payload.dekIv ?? '',
    dekWrapped: payload.dekWrapped ?? '',
  });
  if (res.status === 200) return { ok: true };
  return { ok: false, error: String(res.data.error ?? 'network') };
};

/* ------------------------------------------------------------------ */
/* THE CENTRAL STATE — one snapshot of the whole business database     */
/* ------------------------------------------------------------------ */

export interface CentralState {
  rev: number;
  settings: Partial<BusinessSettings>;
  appearance: Partial<Appearance>;
  products: Product[];
  invoices: Invoice[];
  expenses: Expense[];
  incomes: IncomeEntry[];
  labourWorks: LabourWork[];
  labourWorkers: LabourWorker[];
  config: { upiId: string; gstPercent: number };
}

/** Pull the central snapshot; when the server revision equals `rev`,
 *  { unchanged: true } comes back (nothing has moved — no payload). */
export async function apiStateGet(rev: number): Promise<
  | { kind: 'unchanged'; rev: number }
  | { kind: 'data'; state: CentralState }
  | { kind: 'offline' }
  | { kind: 'auth' }
> {
  const res = await authedFetch(`/api/state?rev=${encodeURIComponent(rev)}`, 'GET');
  if (res.status === 0) return { kind: 'offline' };
  if (res.status === 401) return { kind: 'auth' };
  if (res.status !== 200) return { kind: 'offline' };
  if (res.data.unchanged) return { kind: 'unchanged', rev: Number(res.data.rev ?? rev) };
  return { kind: 'data', state: res.data as unknown as CentralState };
}

/** One-time migration: push this device's pre-online business data into
 *  the central database (upsert-by-id merge — safe from any device). */
export async function apiStateImport(payload: {
  settings?: Partial<BusinessSettings>;
  appearance?: Partial<Appearance>;
  products?: Product[];
  invoices?: Invoice[];
  expenses?: Expense[];
  incomes?: IncomeEntry[];
  labourWorks?: LabourWork[];
  labourWorkers?: LabourWorker[];
  dataUpdatedAt?: number;
}): Promise<{ ok: boolean; rev?: number; error?: string }> {
  const res = await authedFetch('/api/state/import', 'POST', payload);
  if (res.status === 200) return { ok: true, rev: Number(res.data.rev ?? 0) };
  return { ok: false, error: String(res.data.error ?? 'network') };
}

/* ------------------------------ BILLS ------------------------------ */

/**
 * THE bill save — server-confirmed. The server recomputes every total,
 * resolves the bill number, registers the Code 128 verification barcode
 * and stores the bill centrally. The response's invoice is canonical.
 */
export async function apiBillSave(
  draft: Partial<Invoice>,
  reservedNo?: number
): Promise<{ ok: boolean; invoice?: Invoice; rev?: number; error?: string }> {
  const res = await authedFetch('/api/bills', 'POST', { invoice: draft, reservedNo });
  if (res.status === 200 && res.data.invoice) {
    return { ok: true, invoice: res.data.invoice as Invoice, rev: Number(res.data.rev ?? 0) };
  }
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

/** Mutate a confirmed bill: dues payment, cancel, language flip */
export async function apiBillPatch(
  id: string,
  body: { action: 'pay' | 'cancel' | 'language'; amount?: number; mode?: string; language?: string; dateISO?: string }
): Promise<{ ok: boolean; invoice?: Invoice; rev?: number; error?: string }> {
  const res = await authedFetch(`/api/bills/${encodeURIComponent(id)}`, 'PATCH', body);
  if (res.status === 200 && res.data.invoice) {
    return { ok: true, invoice: res.data.invoice as Invoice, rev: Number(res.data.rev ?? 0) };
  }
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

/** Remove a bill from the central database (its barcode then verifies as not found) */
export async function apiBillDelete(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch(`/api/bills/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

/** Atomically reserve the next bill number on the server (race-free) */
export async function apiReserveNo(floor: number): Promise<number | null> {
  const res = await authedFetch('/api/bills/reserve', 'POST', { floor });
  if (res.status === 200 && typeof res.data.no === 'number') return res.data.no;
  return null;
}

/* ----------------------------- PRODUCTS ---------------------------- */

export async function apiProductPut(product: Product): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch('/api/products', 'PUT', { product });
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

export async function apiProductDelete(id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch(`/api/products/${encodeURIComponent(id)}`, 'DELETE');
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

/* ----------------------------- SETTINGS ---------------------------- */

export async function apiSettingsPut(
  settings: Partial<BusinessSettings>,
  appearance?: Partial<Appearance>
): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch('/api/settings', 'PUT', { settings, appearance: appearance ?? {} });
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

/* --------------------------- LABOUR + LEDGER ------------------------ */

export async function apiLabourPut(payload: { work?: LabourWork; worker?: LabourWorker }): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch('/api/labour', 'PUT', payload);
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

export async function apiLabourDelete(id: string, worker = false): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch(`/api/labour?id=${encodeURIComponent(id)}${worker ? '&worker=1' : ''}`, 'DELETE');
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

export async function apiLedgerPut(
  type: 'expense' | 'income',
  entry: Expense | IncomeEntry
): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch('/api/ledger', 'PUT', { type, entry });
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

export async function apiLedgerDelete(type: 'expense' | 'income', id: string): Promise<{ ok: boolean; error?: string }> {
  const res = await authedFetch(`/api/ledger?type=${type}&id=${encodeURIComponent(id)}`, 'DELETE');
  if (res.status === 200) return { ok: true };
  if (res.status === 0) return { ok: false, error: 'offline' };
  return { ok: false, error: String(res.data.error ?? 'saveFailed') };
}

/* ------------------------------------------------------------------ */
/* UPI payments                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/* Barcode bill verification — Code 128 registry on the central server */
/* ------------------------------------------------------------------ */

export interface VerifyItem {
  name: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  origPrice?: number;
  discountType?: 'amount' | 'percent';
  discountValue?: number;
}

export interface VerifyLookupResult {
  status: 'valid' | 'cancelled' | 'not_found' | 'rate_limited' | 'offline';
  invoiceId?: string | null;
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
  } catch {
    // offline / timeout — NEVER claim INVALID BILL without the server's answer
    return { status: 'offline' };
  }
}
