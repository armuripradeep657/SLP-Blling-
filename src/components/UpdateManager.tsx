'use client';

import { useCallback, useEffect, useState } from 'react';
import { APP_VERSION } from '@/lib/version';
import { useT } from '@/hooks/use-app-lang';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

/**
 * v45 — consent-based app updates.
 *
 * When a newer version is deployed, release.json (fetched fresh, never
 * cached) says so and the app ASKS the user: the dialog lists what's new
 * (Telugu + English), and "Update now" downloads the new build through the
 * service worker with a progress bar, then reloads. "Continue with old
 * version" records the declined version and the app keeps running exactly
 * as it is — the shell is cache-first, so nothing changes behind their
 * back. Re-asking happens on next open / focus / 30 minutes, and Settings
 * → App updates can force a check (window event 'slp-check-update').
 */

interface Release {
  version: number;
  notes: { en: string[]; te: string[] };
}

const DECLINED_KEY = 'slp-update-declined';

export function UpdateManager() {
  const t = useT();
  const [update, setUpdate] = useState<Release | null>(null);
  const [phase, setPhase] = useState<'ask' | 'downloading' | 'ready' | 'failed'>('ask');
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const check = useCallback((force = false) => {
    void (async () => {
      try {
        const res = await fetch('/release.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
        const rel = (await res.json()) as Release;
        if (!rel || typeof rel.version !== 'number') return;
        if (rel.version <= Number(APP_VERSION)) return;
        const declined = Number(localStorage.getItem(DECLINED_KEY) || 0);
        if (!force && declined === rel.version) return; // user chose the old version
        setUpdate(rel);
        setPhase('ask');
        setProgress({ done: 0, total: 0 });
      } catch {
        /* offline or same version — stay quiet */
      }
    })();
  }, []);

  useEffect(() => {
    // first check after boot settles (don't compete with the app's own calls)
    const t0 = setTimeout(() => check(false), 2500);
    const iv = setInterval(() => {
      if (document.visibilityState === 'visible') check(false);
    }, 30 * 60 * 1000);
    const vis = () => {
      if (document.visibilityState === 'visible') check(false);
    };
    document.addEventListener('visibilitychange', vis);
    const force = () => check(true);
    window.addEventListener('slp-check-update', force);
    const onMsg = (e: MessageEvent) => {
      const m = e.data as { type?: string; done?: number; total?: number };
      if (m?.type === 'UPDATE_PROGRESS') setProgress({ done: m.done ?? 0, total: m.total ?? 0 });
      if (m?.type === 'UPDATE_READY') {
        setPhase('ready');
        setTimeout(() => location.reload(), 900);
      }
      if (m?.type === 'UPDATE_FAILED') setPhase('failed');
    };
    navigator.serviceWorker?.addEventListener('message', onMsg);
    return () => {
      clearTimeout(t0);
      clearInterval(iv);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('slp-check-update', force);
      navigator.serviceWorker?.removeEventListener('message', onMsg);
    };
  }, [check]);

  const applyUpdate = () => {
    setPhase('downloading');
    setProgress({ done: 0, total: 0 });
    const sw = navigator.serviceWorker;
    // v46: prefer the ACTIVE worker (reg.active) — the controlling worker can
    // still be an OLD version (its postMessage would vanish into a handler
    // that does not exist, leaving the dialog downloading forever)
    void (async () => {
      try {
        const reg = await navigator.serviceWorker?.ready;
        const target = reg?.active ?? sw?.controller;
        if (target) target.postMessage({ type: 'APPLY_UPDATE' });
        else setTimeout(() => location.reload(), 300); // no SW: reload fetches fresh
      } catch {
        setTimeout(() => location.reload(), 300);
      }
    })();
  };

  const keepOld = () => {
    if (update) localStorage.setItem(DECLINED_KEY, String(update.version));
    setUpdate(null);
    setPhase('ask');
  };

  if (!update) return null;

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : phase === 'downloading' ? 5 : 0;
  const te = update.notes?.te ?? [];
  const en = update.notes?.en ?? [];

  return (
    <Dialog open onOpenChange={(v) => !v && phase === 'ask' && keepOld()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm max-h-[90dvh] overflow-y-auto [&>*]:min-w-0">
        <DialogHeader>
          <DialogTitle className="text-blue-700">
            {t('update.available')} · v{update.version}
          </DialogTitle>
          <DialogDescription>{t('update.whatsNew')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {te.length > 0 && (
            <ul className="space-y-1 text-sm text-foreground">
              {te.map((n, i) => (
                <li key={`te-${i}`} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
          {en.length > 0 && (
            <ul className="space-y-1 text-xs text-muted-foreground">
              {en.map((n, i) => (
                <li key={`en-${i}`} className="flex gap-2">
                  <span aria-hidden>•</span>
                  <span>{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {phase === 'downloading' && (
          <div className="space-y-1.5">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${Math.max(pct, 5)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('update.downloading')} {progress.total > 0 ? `${progress.done}/${progress.total} · ${pct}%` : ''}
            </p>
          </div>
        )}
        {phase === 'ready' && <p className="text-sm font-medium text-emerald-700">{t('update.restart')}</p>}
        {phase === 'failed' && (
          <p className="text-sm font-medium text-destructive">{t('update.failed')}</p>
        )}

        <div className="grid grid-cols-1 gap-2">
          <Button
            onClick={applyUpdate}
            disabled={phase === 'downloading' || phase === 'ready'}
            className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {phase === 'failed' ? t('update.retry') : t('update.now')}
          </Button>
          <Button variant="ghost" onClick={keepOld} disabled={phase === 'downloading' || phase === 'ready'} className="w-full h-10">
            {t('update.keepOld')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
