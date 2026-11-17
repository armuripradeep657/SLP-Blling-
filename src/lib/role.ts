/**
 * Per-device session role — 'owner' (MPIN) or 'staff' (username + password).
 * NOT part of the encrypted vault (it never syncs): each device knows who is
 * signed in on it. The backend binds the role to the session token and
 * enforces it on owner-only APIs.
 */
import { useSyncExternalStore } from 'react';

export type Role = 'owner' | 'staff';

const KEY = 'slp-session-role';
const NAME_KEY = 'slp-session-name';

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export interface SessionIdentity {
  role: Role;
  /** staff display name — null for the owner */
  name: string | null;
}

/** CACHED snapshot — useSyncExternalStore requires a stable reference */
let snapshot: SessionIdentity = { role: 'owner', name: null };

function rebuild(): void {
  try {
    const role = localStorage.getItem(KEY) === 'staff' ? 'staff' : 'owner';
    const name = role === 'staff' ? localStorage.getItem(NAME_KEY) : null;
    snapshot = { role, name: name || null };
  } catch {
    snapshot = { role: 'owner', name: null };
  }
}
rebuild();

export function getIdentity(): SessionIdentity {
  return snapshot;
}

export function setIdentity(role: Role, name?: string | null): void {
  try {
    if (role === 'staff') {
      localStorage.setItem(KEY, 'staff');
      if (name) localStorage.setItem(NAME_KEY, name);
    } else {
      localStorage.removeItem(KEY);
      localStorage.removeItem(NAME_KEY);
    }
  } catch {
    /* storage unavailable */
  }
  rebuild();
  notify();
}

/** Clear the role when the session ends (manual lock / re-login) */
export function clearIdentity(): void {
  setIdentity('owner', null);
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  // react to role changes made in OTHER tabs too
  window.addEventListener('storage', cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', cb);
  };
}

const SERVER_SNAPSHOT: SessionIdentity = { role: 'owner', name: null };

/** React hook — { role, name } for the signed-in identity on this device */
export function useIdentity(): SessionIdentity {
  return useSyncExternalStore(subscribe, () => snapshot, () => SERVER_SNAPSHOT);
}

/** Tabs only staff may NOT open — the backend rejects the matching APIs too */
export const OWNER_ONLY_TABS = ['dashboard', 'products', 'ledger', 'labour', 'settings'] as const;

/**
 * Owner (Admin) INITIAL credentials (v35) — seeded server-side (scrypt
 * hash + DEK wrapped under a password-derived key; the plain text is never
 * stored) the first time the owner unlocks with the MPIN. The app nags in
 * Settings → Security until the password is changed.
 */
export const OWNER_DEFAULT_USERNAME = 'Pradeep';
export const OWNER_DEFAULT_PASSWORD = '2125';
