'use client';

/* ------------------------------------------------------------------ */
/* Cloud sync engine — "update on one mobile → appears on all mobiles". */
/*                                                                     */
/* Local-first: the app always works offline from localStorage. When   */
/* the owner is logged in, every change is encrypted (AES-GCM with the */
/* device DEK) and pushed to the vault; every device polls the vault   */
/* and MERGES what it receives:                                        */
/*   • bills / expenses / incomes / labour / products → union by id     */
/*     (tombstoned deletes stay deleted)                               */
/*   • settings & appearance → newest change wins (nextInvoiceNo       */
/*     takes the max so no two phones ever print the same bill no.)    */
/* Server stores ciphertext only — end-to-end encrypted.               */
/* ------------------------------------------------------------------ */

import { useStore } from './store';
import type { BusinessSettings, ServerConfig, SyncPayload } from './types';
import { decryptJson, encryptJson, importDek } from './crypto';
import { getIdentity } from './role';
import {
  apiConfigGet,
  apiConfigPut,
  apiMpinSetup,
  apiMpinUnlock,
  apiNotificationsGet,
  apiPullVault,
  apiPushVault,
  getDeviceDek,
  getRecoverMaterial,
  isUnlocked,
  setAuth,
} from './cloud';

const PUSH_DEBOUNCE_MS = 1200;
const PULL_INTERVAL_MS = 4000;

let started = false;
let applyingRemote = false;
let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pushing = false;
let pushQueued = false;
let lastVersion = 0;
let lastSyncAt = 0;
let lastError: string | null = null;
let lastPushedSig: string | null = null;
let lastReauthAt = 0;
/** config change saved offline — pushed to the server on the next poll */
let pendingConfig: Partial<ServerConfig> | null = null;
let lastFlushAt = 0;
/** config PUTs run ONE AT A TIME — two quick saves must never race */
let configChain: Promise<unknown> = Promise.resolve();

/** Tell the UI the session needs the owner's MPIN again (server lost it / expired) */
function maybeNotifyReauth(): void {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastReauthAt < 60_000) return; // at most once a minute
  lastReauthAt = now;
  try {
    window.dispatchEvent(new Event('slp-reauth'));
  } catch {
    /* ignore */
  }
}

let healing = false;
let lastHealAt = 0;

type HealResult = 'healed' | 'inflight' | 'failed';

/**
 * Silent self-heal of the encrypted sync. The device keeps its own copy of
 * the credentials (slp-recover-v1), so when the server lost the account
 * (deploy / restart / wiped vault) or the session expired, the SAME account
 * is re-registered with the SAME key — no MPIN prompt, no banner, no data
 * movement. The owner never notices; the MPIN is never created again.
 */
async function silentReauth(): Promise<HealResult> {
  if (healing) return 'inflight'; // a heal is already running — give it a moment
  const mat = getRecoverMaterial();
  if (!mat?.salt || !mat?.verifier || !mat?.wrapped) return 'failed';
  if (Date.now() - lastHealAt < 20_000) return 'inflight'; // just tried recently
  healing = true;
  lastHealAt = Date.now();
  try {
    // 1) session expired? the stored verifier logs straight back in
    const res = await apiMpinUnlock(mat.verifier);
    if (res.ok && res.token) {
      setAuth(res.token);
      return 'healed';
    }
    // 2) server lost the whole account? re-register it with the SAME key
    if (res.error === 'noMpin') {
      const setup = await apiMpinSetup(mat.wrapped, mat.salt, mat.verifier);
      if (setup.ok && setup.token) {
        setAuth(setup.token);
        return 'healed';
      }
      return 'failed';
    }
    // wrongMpin → the vault belongs to a different account; the banner offers
    // a manual re-connect (owner's call — never clobber silently)
    return 'failed';
  } catch {
    return 'failed';
  } finally {
    healing = false;
  }
}

/* ------------------------- payload ------------------------- */

export function buildPayload(state: ReturnType<typeof useStore.getState>): SyncPayload {
  return {
    v: 1,
    settings: state.settings,
    products: state.products,
    invoices: state.invoices,
    expenses: state.expenses,
    incomes: state.incomes,
    labourWorks: state.labourWorks,
    labourWorkers: state.labourWorkers,
    appearance: state.appearance,
    deletedIds: state.deletedIds,
    dataUpdatedAt: state.dataUpdatedAt,
  };
}

function emptyDeleted(): SyncPayload['deletedIds'] {
  return { invoices: [], expenses: [], incomes: [], labours: [], products: [] };
}

/** Union-merge two payloads (a = local, b = remote) into one */
export function mergeSync(a: SyncPayload, b: SyncPayload): SyncPayload {
  const newer = b.dataUpdatedAt > a.dataUpdatedAt; // remote is newer?
  const tomb = {
    invoices: [...new Set([...a.deletedIds.invoices, ...b.deletedIds.invoices])],
    expenses: [...new Set([...a.deletedIds.expenses, ...b.deletedIds.expenses])],
    incomes: [...new Set([...a.deletedIds.incomes, ...b.deletedIds.incomes])],
    labours: [...new Set([...a.deletedIds.labours, ...b.deletedIds.labours])],
    products: [...new Set([...a.deletedIds.products, ...b.deletedIds.products])],
  };
  const first = newer ? b : a; // same-id conflicts resolve to the newer side
  const second = newer ? a : b;

  const union = <T extends { id: string }>(firstArr: T[], secondArr: T[], tombIds: string[]): T[] => {
    const seen = new Set<string>();
    const out: T[] = [];
    for (const item of [...firstArr, ...secondArr]) {
      if (seen.has(item.id) || tombIds.includes(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    return out;
  };

  // settings: newest wins, except the invoice counter which takes the max
  const settings: BusinessSettings = {
    ...(newer ? b.settings : a.settings),
    nextInvoiceNo: Math.max(a.settings.nextInvoiceNo, b.settings.nextInvoiceNo),
  };

  return {
    v: 1,
    settings,
    products: union(first.products, second.products, tomb.products),
    invoices: union(first.invoices, second.invoices, tomb.invoices),
    expenses: union(first.expenses, second.expenses, tomb.expenses),
    incomes: union(first.incomes, second.incomes, tomb.incomes),
    labourWorks: union(first.labourWorks, second.labourWorks, tomb.labours),
    labourWorkers: union(first.labourWorkers, second.labourWorkers, []),
    appearance: newer ? b.appearance : a.appearance,
    deletedIds: tomb,
    dataUpdatedAt: Math.max(a.dataUpdatedAt, b.dataUpdatedAt),
  };
}

function sanitize(raw: unknown): SyncPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Partial<SyncPayload>;
  if (p.v !== 1) return null;
  return {
    v: 1,
    settings: p.settings as SyncPayload['settings'],
    products: Array.isArray(p.products) ? p.products : [],
    invoices: Array.isArray(p.invoices) ? p.invoices : [],
    expenses: Array.isArray(p.expenses) ? p.expenses : [],
    incomes: Array.isArray(p.incomes) ? p.incomes : [],
    labourWorks: Array.isArray(p.labourWorks) ? p.labourWorks : [],
    labourWorkers: Array.isArray(p.labourWorkers) ? p.labourWorkers : [],
    appearance: p.appearance as SyncPayload['appearance'],
    deletedIds: p.deletedIds ?? emptyDeleted(),
    dataUpdatedAt: typeof p.dataUpdatedAt === 'number' ? p.dataUpdatedAt : 0,
  };
}

function applyMerged(remote: SyncPayload): void {
  const local = buildPayload(useStore.getState());
  const merged = mergeSync(local, remote);
  applyingRemote = true;
  useStore.setState({
    settings: merged.settings,
    products: merged.products,
    invoices: merged.invoices,
    expenses: merged.expenses,
    incomes: merged.incomes,
    labourWorks: merged.labourWorks,
    labourWorkers: merged.labourWorkers,
    appearance: merged.appearance,
    deletedIds: merged.deletedIds,
    dataUpdatedAt: merged.dataUpdatedAt,
  });
  applyingRemote = false;
}

/* ------------------------- push / pull ------------------------- */

async function pushNow(): Promise<void> {
  if (!isUnlocked()) return;
  const dekB64 = getDeviceDek();
  if (!dekB64) return;
  // a push already in flight? queue one right after it instead of dropping
  if (pushing) {
    pushQueued = true;
    return;
  }
  pushing = true;
  try {
    const payload = buildPayload(useStore.getState());
    const sig = JSON.stringify(payload);
    if (sig === lastPushedSig) {
      lastSyncAt = Date.now();
      lastError = null;
      return;
    }
    const dek = await importDek(dekB64);
    const { ciphertext, dataIv } = await encryptJson(dek, payload);
    const res = await apiPushVault(ciphertext, dataIv);
    if (res.ok) {
      lastVersion = res.dataVersion ?? lastVersion + 1;
      lastPushedSig = sig;
      lastSyncAt = Date.now();
      lastError = null;
    } else {
      lastError = res.error ?? 'pushFailed';
      if (res.error === 'unauthorized') {
        const h = await silentReauth();
        if (h === 'healed' || h === 'inflight') {
          lastError = null;
          pushQueued = true; // retry with the fresh session right after this unwinds
        } else {
          maybeNotifyReauth();
        }
      }
    }
  } catch (err) {
    lastError = err instanceof Error ? err.message : 'pushFailed';
  } finally {
    pushing = false;
    if (pushQueued) {
      pushQueued = false;
      setTimeout(() => void pushNow(), 250);
    }
  }
}

async function pullOnce(): Promise<void> {
  if (!isUnlocked() || applyingRemote || pushing) return;
  const dekB64 = getDeviceDek();
  if (!dekB64) return;
  try {
    const res = await apiPullVault();
    if (res.kind === 'auth') {
      const h = await silentReauth();
      if (h === 'healed' || h === 'inflight') {
        setTimeout(() => void pullOnce(), 1500); // retry with the fresh session
        return;
      }
      lastError = 'unauthorized';
      maybeNotifyReauth(); // the device keeps working locally — the MPIN re-connects sync
      return;
    }
    if (res.kind === 'offline') {
      lastError = 'offline';
      return;
    }
    if (res.kind === 'empty') {
      // fresh vault — upload whatever this device already has
      await pushNow();
      return;
    }
    if (res.dataVersion > lastVersion) {
      const dek = await importDek(dekB64);
      const raw = await decryptJson<unknown>(dek, res.ciphertext, res.dataIv);
      const remote = sanitize(raw);
      if (remote) applyMerged(remote);
      lastVersion = res.dataVersion;
      lastSyncAt = Date.now();
      lastError = null;
    }
    void pollServerData();
  } catch (err) {
    // wrong key / corrupt blob — surface but never wipe local data
    lastError = err instanceof Error ? err.message : 'pullFailed';
  }
}

function schedulePush(): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(() => {
    pushTimer = null;
    void pushNow();
  }, PUSH_DEBOUNCE_MS);
}


/* ------------------------------------------------------------------ */
/* Server-authoritative config + admin notifications (v35)             */
/*                                                                     */
/* Every poll cycle (~4 s) the device ALSO:                            */
/*   • pushes a config change that was saved while offline,            */
/*   • pulls the server config (UPI ID, GST rate, staff discount       */
/*     limits) and mirrors it into the local settings — the server is  */
/*     the single source of truth, so an admin change reaches every    */
/*     device within seconds,                                          */
/*   • pulls the admin notification unread count (owner devices),      */
/*   • retries bills whose barcode registration was queued offline.    */
/* ------------------------------------------------------------------ */

async function pollServerData(): Promise<void> {
  if (!isUnlocked()) return;
  const st = useStore.getState();
  const now = Date.now();

  // 1) a config change made offline goes to the server first
  if (pendingConfig) {
    const res = await apiConfigPut(pendingConfig);
    if (res.ok) pendingConfig = null;
  }

  // 2) server config → local mirror (server wins when reachable). Before the
  //    owner ever saved config (exists=false), devices SEED the server from
  //    their saved settings instead of mirroring blanks back.
  const cfg = await apiConfigGet();
  if (cfg) {
    const { exists, ...serverConfig } = cfg;
    st.setSrvConfig(serverConfig);
    if (!exists && st.settings.upiId) {
      void saveConfigToServer({
        ...serverConfig,
        upiId: st.settings.upiId,
        gstPercent: st.settings.gstPercent ?? 0,
      });
    } else if (exists) {
      const patch: Partial<BusinessSettings> = {};
      if ((st.settings.upiId || '') !== serverConfig.upiId) patch.upiId = serverConfig.upiId;
      if ((st.settings.gstPercent ?? 0) !== serverConfig.gstPercent) patch.gstPercent = serverConfig.gstPercent;
      if (Object.keys(patch).length > 0) useStore.getState().saveSettings(patch);
    }
  }

  // 3) admin notification unread count — owner devices only
  if (getIdentity().role === 'owner') {
    const res = await apiNotificationsGet();
    if (res) useStore.getState().setUnreadNotifs(res.unread);
  }

  // 4) offline-saved bills join the barcode registry once we are back online
  if (useStore.getState().pendingRegIds.length > 0 && now - lastFlushAt > 15000) {
    lastFlushAt = now;
    void useStore.getState().flushPendingRegistrations();
  }
}

/**
 * Save a config change to the server (OWNER). When offline the change is
 * queued in memory and retried by the poll loop — a lost connection never
 * silently drops an admin change.
 */
export async function saveConfigToServer(config: Partial<ServerConfig>): Promise<boolean> {
  const run = configChain.then(async () => {
    const res = await apiConfigPut(config);
    if (res.ok) {
      pendingConfig = null;
      return true;
    }
    pendingConfig = { ...config };
    return false;
  });
  configChain = run.catch(() => undefined);
  return run;
}

/** Kick off the engine (idempotent) — call once after the app unlocks */
export function startSyncEngine(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  useStore.subscribe((state, prev) => {
    if (applyingRemote || state === prev) return;
    // device-local slices don't need pushing
    const relevant =
      state.settings !== prev.settings ||
      state.products !== prev.products ||
      state.invoices !== prev.invoices ||
      state.expenses !== prev.expenses ||
      state.incomes !== prev.incomes ||
      state.labourWorks !== prev.labourWorks ||
      state.labourWorkers !== prev.labourWorkers ||
      state.appearance !== prev.appearance ||
      state.deletedIds !== prev.deletedIds ||
      state.dataUpdatedAt !== prev.dataUpdatedAt;
    if (relevant) schedulePush();
  });

  setInterval(() => void pullOnce(), PULL_INTERVAL_MS);
  window.addEventListener('online', () => void pullOnce());
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void pullOnce();
  });
  // first pull on start
  void pullOnce();
}

/** Manual "Sync now" — push local changes then pull remote ones */
export async function syncNow(): Promise<boolean> {
  await pushNow();
  await pullOnce();
  return !lastError;
}

/**
 * Decrypt a vault blob with the given DEK and merge it into the store.
 * Used by the unlock flow (PIN → unwrap DEK → open the saved data).
 * Returns false when the blob cannot be opened (wrong PIN / corrupt).
 */
export async function mergeVaultBlob(
  ciphertext: string,
  dataIv: string,
  dek: CryptoKey
): Promise<boolean> {
  try {
    const raw = await decryptJson<unknown>(dek, ciphertext, dataIv);
    const p = sanitize(raw);
    if (!p) return false;
    applyMerged(p);
    lastSyncAt = Date.now();
    lastError = null;
    return true;
  } catch {
    return false;
  }
}

/** Push the current device state to the vault immediately (unlock/setup flow) */
export async function pushVaultNow(): Promise<boolean> {
  lastPushedSig = null; // force a real push
  await pushNow();
  return !lastError;
}

export function getSyncStatus(): { lastSyncAt: number; error: string | null } {
  return { lastSyncAt, error: lastError };
}
