'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, PlusCircle, CheckCircle2, Smartphone } from 'lucide-react';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Settings section: download/install the PWA on the user's phone */
export default function InstallAppSection() {
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const check = () =>
      setInstalled(
        window.matchMedia('(display-mode: standalone)').matches ||
          (window.navigator as unknown as { standalone?: boolean }).standalone === true
      );
    check();
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === 'accepted') {
      setInstalled(true);
      setDeferred(null);
    }
  };

  return (
    <section aria-label="Install app on phone" className="space-y-2">
      <h3 className="text-sm font-bold text-blue-800">Get the App on Your Phone</h3>
      {installed ? (
        <p className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-800">
          <CheckCircle2 className="size-4 shrink-0" />
          App is installed — you are using the installed version.
        </p>
      ) : (
        <>
          <p className="text-xs text-muted-foreground">
            Download this billing app to your phone home screen. It opens full-screen like a real app,
            works offline, and keeps all your bills safely on this device.
          </p>
          {deferred && (
            <Button
              onClick={onInstall}
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
            >
              <Download className="size-4" /> Install App Now
            </Button>
          )}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-relaxed text-blue-900">
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              <Smartphone className="size-3.5" /> Android (Chrome):
            </p>
            <p className="mb-2 pl-5">
              Tap the <b>⋮ menu</b> at the top-right → <b>Install app</b> / <b>Add to Home screen</b>.
            </p>
            <p className="mb-1 flex items-center gap-1.5 font-semibold">
              <Share2 className="size-3.5" /> iPhone (Safari):
            </p>
            <p className="pl-5">
              Tap <Share2 className="inline size-3.5 -translate-y-0.5" /> <b>Share</b> → scroll down →{' '}
              <PlusCircle className="inline size-3.5 -translate-y-0.5" /> <b>Add to Home Screen</b> →{' '}
              <b>Add</b>. The Narasimha Swamy app icon appears on your home screen.
            </p>
          </div>
        </>
      )}
    </section>
  );
}
