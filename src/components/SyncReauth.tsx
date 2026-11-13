'use client';

import { useEffect, useRef, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import LockScreen from '@/components/LockScreen';
import { useT } from '@/hooks/use-app-lang';

const SNOOZE_MS = 10 * 60 * 1000; // dismissed → stay quiet for 10 minutes
let snoozeUntil = 0;

/**
 * Slim banner for the rare case the encrypted sync needs the MPIN again
 * (the server restarted with an empty vault, or the session expired).
 * The app KEEPS WORKING from this phone's local data — the banner just
 * offers a one-tap re-connect: enter the MPIN once and sync continues
 * on all the owner's phones. No data is created, moved or lost.
 */
export default function SyncReauth() {
  const t = useT();
  const [bannerOpen, setBannerOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const onReauth = () => {
      if (!mountedRef.current || Date.now() < snoozeUntil) return;
      setBannerOpen(true);
    };
    window.addEventListener('slp-reauth', onReauth);
    return () => {
      mountedRef.current = false;
      window.removeEventListener('slp-reauth', onReauth);
    };
  }, []);

  const dismiss = () => {
    setBannerOpen(false);
    snoozeUntil = Date.now() + SNOOZE_MS;
  };

  const reconnected = () => {
    setDialogOpen(false);
    setBannerOpen(false);
    snoozeUntil = 0;
  };

  if (!bannerOpen) return null;

  return (
    <>
      <div
        data-reauth-banner
        className="fixed inset-x-0 top-0 z-[90] flex items-center justify-center gap-2 bg-amber-500 px-3 py-2 text-center text-xs font-semibold text-white shadow-md"
      >
        <ShieldAlert className="size-4 shrink-0" />
        <span className="min-w-0">{t('reauth.banner')}</span>
        <button
          onClick={() => setDialogOpen(true)}
          className="shrink-0 rounded-full bg-white/20 px-2.5 py-1 font-bold underline-offset-2 hover:bg-white/30"
        >
          {t('reauth.btn')}
        </button>
        <button
          onClick={dismiss}
          aria-label="Close sync notice"
          className="shrink-0 rounded-full p-1 hover:bg-white/20"
        >
          <X className="size-3.5" />
        </button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('reauth.title')}</DialogTitle>
            <DialogDescription>{t('reauth.note')}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <LockScreen mode="reclaim" variant="sheet" onUnlocked={reconnected} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
