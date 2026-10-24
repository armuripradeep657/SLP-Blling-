'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Download, Share2, PlusCircle, X, Smartphone } from 'lucide-react';

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

/** Floating install banner (Android/Chrome) + iOS instructions dialog */
export default function PwaInstall() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [showBar, setShowBar] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);
  const installed = usePwaInstalled();

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setTimeout(() => setShowBar(true), 1500);
    };
    window.addEventListener('beforeinstallprompt', handler);
    // iOS Safari never fires beforeinstallprompt — show the Add-to-Home-Screen hint
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    if (isIOS && !installed) setTimeout(() => setShowBar(true), 1500);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [installed]);

  if (installed || !showBar) return null;

  const onInstall = async () => {
    if (deferred) {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === 'accepted') setShowBar(false);
      setDeferred(null);
    } else {
      setIosHelp(true);
    }
  };

  return (
    <>
      <div className="fixed top-[3.6rem] left-1/2 z-40 w-[min(26rem,calc(100vw-1.5rem))] -translate-x-1/2">
        <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-2 shadow-lg backdrop-blur">
          <Smartphone className="size-4 shrink-0 text-amber-700" />
          <p className="flex-1 text-xs font-medium leading-snug text-amber-900">
            {deferred ? 'Install this billing app on your phone — works offline.' : 'Add this billing app to your Home Screen.'}
          </p>
          <Button size="sm" onClick={onInstall} className="h-8 shrink-0 bg-amber-600 text-white hover:bg-amber-700">
            <Download className="size-3.5" /> Install
          </Button>
          <button onClick={() => setShowBar(false)} aria-label="Dismiss install hint" className="shrink-0 rounded p-1 text-amber-700 hover:bg-amber-100">
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <Dialog open={iosHelp} onOpenChange={setIosHelp}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>Install on iPhone / iPad</DialogTitle>
            <DialogDescription asChild>
              <ol className="list-decimal space-y-2 pl-4 pt-1 text-left text-sm">
                <li>
                  Tap the <Share2 className="inline size-4 -translate-y-0.5" /> <b>Share</b> button in Safari
                </li>
                <li>
                  Scroll and tap <PlusCircle className="inline size-4 -translate-y-0.5" /> <b>Add to Home Screen</b>
                </li>
                <li>Tap <b>Add</b> — the app icon appears on your Home Screen</li>
              </ol>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}
