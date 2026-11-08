'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Share2, PlusCircle, X, Smartphone, WifiOff, Zap, Save, BellRing, RefreshCw } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const RELOAD_GUARD_KEY = 'slp-sw-reloaded-at';
const RELOAD_GUARD_MS = 8000;

/**
 * Registers the service worker and keeps EVERY device on the latest version:
 * - sw.js uses skipWaiting + clients.claim, so a newly detected worker takes
 *   over immediately
 * - this page polls reg.update() (interval / focus / online / visibility), and
 *   when a new worker takes control the page auto-reloads ONCE — so phones
 *   with the installed PWA pick up every change without reinstalling
 */
export function ServiceWorkerRegister() {
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let reg: ServiceWorkerRegistration | null = null;
    let interval: ReturnType<typeof setInterval> | undefined;
    let reloading = false;
    // First install also fires controllerchange (clients.claim) — that is NOT
    // an update, the page is already running the newest code.
    let hadController = !!navigator.serviceWorker.controller;

    const scheduleReload = () => {
      if (reloading) return;
      let last = 0;
      try {
        last = Number(sessionStorage.getItem(RELOAD_GUARD_KEY) || 0);
      } catch {
        /* storage unavailable */
      }
      if (Date.now() - last < RELOAD_GUARD_MS) return; // just reloaded — skip
      reloading = true;
      try {
        sessionStorage.setItem(RELOAD_GUARD_KEY, String(Date.now()));
      } catch {
        /* storage unavailable */
      }
      setUpdating(true);
      // show the banner for a moment, then refresh onto the new version
      setTimeout(() => window.location.reload(), 1200);
    };

    const onControllerChange = () => {
      if (!hadController) {
        hadController = true;
        return;
      }
      scheduleReload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    const check = async () => {
      try {
        reg = reg ?? (await navigator.serviceWorker.getRegistration());
        await reg?.update();
      } catch {
        /* offline — the cached version keeps working; update happens next time online */
      }
    };

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (r) => {
        reg = r;
        await check();
      })
      .catch(() => undefined);

    // Poll while the app is open — installed devices update themselves
    interval = setInterval(check, 60_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const onOnline = () => check();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    window.addEventListener('online', onOnline);

    return () => {
      if (interval) clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
      window.removeEventListener('online', onOnline);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  if (!updating) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] bg-blue-600 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg"
    >
      Updating app to the latest version…
    </div>
  );
}

export function usePwaInstalled() {
  const [installed, setInstalled] = useState(true);
  useEffect(() => {
    const check = () =>
      setInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true
      );
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return installed;
}

const NOTICE_SEEN_KEY = 'slp-update-notice-seen';

/**
 * ONE-TIME install notification after an app update:
 * every time a new version lands on a device (APP_VERSION changes), a popup
 * asks the user to install the app on that device. Once the user CLOSES it,
 * the version is remembered and the popup never shows again for this version
 * — it only returns when the next update ships.
 */
export default function PwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const installed = usePwaInstalled();
  const deferredRef = useRef<BIPEvent | null>(null);

  useEffect(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      navigator.maxTouchPoints > 1 ||
      window.matchMedia('(pointer: coarse)').matches;
    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BIPEvent;
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // one-time-per-version flag in localStorage — closing it means it NEVER
    // comes back for this version (only the next update re-shows it)
    let seen = '';
    try {
      seen = localStorage.getItem(NOTICE_SEEN_KEY) ?? '';
    } catch {
      /* storage unavailable */
    }
    const timer = setTimeout(() => {
      if (!installed && seen !== APP_VERSION && (deferredRef.current || isMobile)) {
        setShowPopup(true);
      }
    }, 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, [installed]);

  const dismiss = () => {
    setShowPopup(false);
    try {
      localStorage.setItem(NOTICE_SEEN_KEY, APP_VERSION);
    } catch {
      /* storage unavailable */
    }
  };

  const onInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') dismiss();
      setDeferred(null);
      deferredRef.current = null;
    } else {
      setHelpOpen(true);
    }
  };

  if (installed || !showPopup) return null;

  return (
    <>
      {/* Bottom-sheet one-time update/install popup (above mobile bottom nav) */}
      <div
        role="dialog"
        aria-label="Install app notification"
        className="fixed inset-x-3 bottom-[4.75rem] z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
      >
        <div className="relative rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
          <button
            onClick={dismiss}
            aria-label="Close install notification"
            className="absolute right-2 top-2 rounded-full p-1.5 text-blue-700 hover:bg-blue-50"
          >
            <X className="size-4" />
          </button>

          <div className="flex items-start gap-3">
            <img
              src="/narasimha-logo.jpg"
              alt="SLP Cement Works app logo"
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-blue-200"
            />
            <div className="min-w-0 pr-5">
              <p className="flex items-center gap-1.5 text-sm font-bold leading-tight text-blue-900">
                <BellRing className="size-4 shrink-0 text-blue-600" />
                App updated — Install it on your phone
              </p>
              <p className="text-sm font-bold leading-tight text-blue-800">
                యాప్ అప్‌డేట్ అయ్యింది — ఇన్‌స్టాల్ చేయండి
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                యాప్ ఇప్పుడే కొత్త వెర్షన్‌కు అప్‌డేట్ అయ్యింది — మీ ఫోన్‌లో ఇన్‌స్టాల్ చేయండి (ఉచితం, ఆఫ్‌లైన్‌లో పనిచేస్తుంది).
              </p>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5 text-xs text-blue-900">
            <li className="flex items-center gap-2">
              <WifiOff className="size-3.5 shrink-0 text-blue-600" /> ఆఫ్‌లైన్‌లో పనిచేస్తుంది — Works offline
            </li>
            <li className="flex items-center gap-2">
              <Zap className="size-3.5 shrink-0 text-blue-600" /> వెంటనే తెరుచుకుంటుంది — Opens instantly
            </li>
            <li className="flex items-center gap-2">
              <Save className="size-3.5 shrink-0 text-blue-600" /> బిల్లులు డివైస్‌లో సురక్షితం — Bills saved on device
            </li>
          </ul>

          <div className="mt-3 flex gap-2">
            <Button
              onClick={onInstall}
              className="h-10 flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {deferred ? (
                <>
                  <Download className="size-4" /> Install App · ఇన్‌స్టాల్
                </>
              ) : (
                <>
                  <Smartphone className="size-4" /> How to Install · ఎలా?
                </>
              )}
            </Button>
            <Button variant="outline" onClick={dismiss} className="h-10">
              Close · మూసివేయి
            </Button>
          </div>
          <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
            <RefreshCw className="size-3" /> v{APP_VERSION} — ఈ పాప్-అప్ మీరు మూసేయగానే మళ్ళీ రాదు · closed = never again
          </p>
        </div>
      </div>

      {/* Manual install steps (iOS Safari / browsers without native prompt) */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Add to Home Screen</DialogTitle>
            <DialogDescription asChild>
              <div className="space-y-3 pt-1 text-left text-sm">
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Smartphone className="size-4" /> Android (Chrome)
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 pt-1">
                    <li>
                      Tap the <b>⋮ menu</b> at the top-right
                    </li>
                    <li>
                      Tap <b>Install app</b> / <b>Add to Home screen</b>
                    </li>
                    <li>Tap <b>Install</b> — icon appears on your Home Screen</li>
                  </ol>
                </div>
                <div>
                  <p className="flex items-center gap-1.5 font-semibold">
                    <Share2 className="size-4" /> iPhone (Safari)
                  </p>
                  <ol className="list-decimal space-y-1 pl-5 pt-1">
                    <li>
                      Tap the <Share2 className="inline size-4 -translate-y-0.5" /> <b>Share</b>{' '}
                      button
                    </li>
                    <li>
                      Scroll and tap <PlusCircle className="inline size-4 -translate-y-0.5" />{' '}
                      <b>Add to Home Screen</b>
                    </li>
                    <li>Tap <b>Add</b> — icon appears on your Home Screen</li>
                  </ol>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
