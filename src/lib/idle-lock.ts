/* Tab-scoped "unlock session" — the glue between the MPIN gate and daily use.
 *
 *  REFRESH  — sessionStorage survives a page reload, so a just-unlocked tab
 *             stays unlocked: refreshing never throws the owner back to the
 *             MPIN screen (the owner asked for exactly this). The tab the
 *             user was on is restored, too.
 *  IDLE     — while the app is open, every touch / keypress / scroll refresh
 *             the marker's timestamp. After 5 minutes WITHOUT any input the
 *             app locks itself and the MPIN gate returns (owner's request).
 *             Credentials are NOT wiped — the MPIN re-opens the app instantly,
 *             even offline.
 *  CLOSED   — sessionStorage dies with the tab, so closing and reopening the
 *             app (or the phone restarting) always asks the MPIN again.
 */

const KEY = 'slp-unlock-session-v1';

/** Idle time before the app locks itself — 5 minutes of not using it.
 *  `slp-idle-ms` in localStorage overrides it (automated tests use a few
 *  seconds so a 5-minute wait does not slow the suite down). */
export function idleLockMs(): number {
  try {
    const n = Number(localStorage.getItem('slp-idle-ms'));
    if (Number.isFinite(n) && n >= 1000) return n;
  } catch {
    /* storage unavailable */
  }
  return 5 * 60 * 1000;
}

/** Is this tab holding an unlock session that is still fresh (inside the idle window)? */
export function hasFreshUnlockSession(): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as { at?: number };
    return typeof s?.at === 'number' && Date.now() - s.at < idleLockMs();
  } catch {
    return false;
  }
}

/** Remember "this tab is unlocked and was just used" — on unlock and on every activity. */
export function markUnlockActive(): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now() }));
  } catch {
    /* storage unavailable */
  }
}

/** Has the tab been idle (or away) longer than the lock timeout? */
export function idleTooLong(): boolean {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return true;
    const s = JSON.parse(raw) as { at?: number };
    return typeof s?.at !== 'number' || Date.now() - s.at >= idleLockMs();
  } catch {
    return true;
  }
}

/** End the session (idle lock / manual lock) — the MPIN gate takes over. */
export function clearUnlockSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* storage unavailable */
  }
}
