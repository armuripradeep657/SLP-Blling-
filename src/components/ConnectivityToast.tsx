'use client';

import { useEffect, useRef } from 'react';
import { useSyncExternalStore } from 'react';
import { useToast } from '@/hooks/use-toast';

const subscribe = (cb: () => void) => {
  window.addEventListener('online', cb);
  window.addEventListener('offline', cb);
  return () => {
    window.removeEventListener('online', cb);
    window.removeEventListener('offline', cb);
  };
};

/** Toast reassurance on connectivity changes — billing never stops working */
export default function ConnectivityToast() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
  const { toast } = useToast();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (online) {
      toast({ title: 'Back online', description: 'Internet restored — sending bills on WhatsApp works again.' });
    } else {
      toast({
        title: 'You are offline',
        description: 'No problem — keep billing as usual. Bills are saved on this device and WhatsApp sends resume when internet returns.',
      });
    }
  }, [online, toast]);

  return null;
}
