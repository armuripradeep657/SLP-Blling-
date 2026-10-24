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
import { Download, Share2, PlusCircle, X, Smartphone, WifiOff, Zap, Save } from 'lucide-react';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);
  return null;
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

const DISMISS_KEY = 'slp-install-popup-dismissed';

/** Install popup (mobile-first bottom sheet): native prompt when available, manual steps otherwise */
export default function PwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const installed = usePwaInstalled();
  const deferredRef = useRef<BIPEvent | null>(null);

  useEffect(() => {
    const isMobile =
      /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1;
    const handler = (e: Event) => {
      e.preventDefault();
      deferredRef.current = e as BIPEvent;
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);

    let dismissed = false;
    try {
      dismissed = sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      /* storage unavailable */
    }
    const timer = setTimeout(() => {
      if (!installed && !dismissed && (deferredRef.current || isMobile)) {
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
      sessionStorage.setItem(DISMISS_KEY, '1');
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
      {/* Bottom-sheet install popup (above mobile bottom nav) */}
      <div
        role="dialog"
        aria-label="Install app popup"
        className="fixed inset-x-3 bottom-[4.75rem] z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
      >
        <div className="relative rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
          <button
            onClick={dismiss}
            aria-label="Close install popup"
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
              <p className="text-sm font-bold leading-tight text-blue-900">
                Install the Billing App
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Download Sri Lakshmi Penchil Narasimha Swamy Cement Works app on your phone — free.
              </p>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5 text-xs text-blue-900">
            <li className="flex items-center gap-2">
              <WifiOff className="size-3.5 shrink-0 text-blue-600" /> Works offline — no internet
              needed to bill
            </li>
            <li className="flex items-center gap-2">
              <Zap className="size-3.5 shrink-0 text-blue-600" /> Opens instantly, full-screen like
              a real app
            </li>
            <li className="flex items-center gap-2">
              <Save className="size-3.5 shrink-0 text-blue-600" /> All bills saved safely on this
              device
            </li>
          </ul>

          <div className="mt-3 flex gap-2">
            <Button
              onClick={onInstall}
              className="h-10 flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {deferred ? (
                <>
                  <Download className="size-4" /> Install App
                </>
              ) : (
                <>
                  <Smartphone className="size-4" /> How to Install
                </>
              )}
            </Button>
            <Button variant="outline" onClick={dismiss} className="h-10">
              Not now
            </Button>
          </div>
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
