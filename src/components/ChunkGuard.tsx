'use client';

/**
 * v43 self-heal for deploy updates: after a new build ships, the phone may
 * boot an OLD cached shell whose chunk requests 404 against the new build
 * (or the reverse on a dying network) — React then dies with the white
 * "Application error" screen. A chunk-load failure is ALWAYS fixed by one
 * reload once the new assets are fetched, so: catch it, reload ONCE (a
 * sessionStorage guard stops reload loops), and let the SW's stale-while-
 * revalidate shell serve the fresh consistent pair next boot.
 */
export function ChunkGuard() {
  if (typeof window !== 'undefined') {
    const GUARD = 'slp-chunk-reload';
    const maybeReload = () => {
      try {
        if (sessionStorage.getItem(GUARD)) return;
        sessionStorage.setItem(GUARD, String(Date.now()));
      } catch {
        /* storage unavailable — still reload once via in-memory flag */
        if ((window as unknown as { __slpChunkReloaded?: boolean }).__slpChunkReloaded) return;
        (window as unknown as { __slpChunkReloaded?: boolean }).__slpChunkReloaded = true;
      }
      setTimeout(() => location.reload(), 400);
    };
    const isChunkError = (m: string) =>
      /ChunkLoadError|Loading chunk|Loading CSS chunk|dynamically imported module|Importing a module script failed/i.test(
        m
      );
    window.addEventListener(
      'error',
      (e) => {
        const tgt = e.target as HTMLElement | null;
        if (tgt && (tgt.tagName === 'SCRIPT' || tgt.tagName === 'LINK')) maybeReload();
        else if (e.message && isChunkError(e.message)) maybeReload();
      },
      true
    );
    window.addEventListener('unhandledrejection', (e) => {
      const m = String((e.reason as Error)?.message ?? e.reason ?? '');
      if (isChunkError(m)) maybeReload();
    });
  }
  return null;
}
