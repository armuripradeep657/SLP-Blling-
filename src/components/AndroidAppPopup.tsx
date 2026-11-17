'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, X, Zap, ShieldCheck, WifiOff, Info } from 'lucide-react';
import { APP_VERSION } from '@/lib/version';

const APK_SEEN_KEY = 'slp-apk-popup-seen';
// PwaInstall's per-version key — when the APK popup shows we take over the
// install prompt for this version, so the user never sees two pop-ups at once
const NOTICE_SEEN_KEY = 'slp-update-notice-seen';

/**
 * ONE-TIME-per-version "Get the real Android app" popup:
 * every time a new version lands, opening the site shows a popup offering the
 * standalone APK (works directly on the phone — no Chrome). Closing it or
 * downloading the APK remembers the version, so it returns only with the next
 * update. Skipped inside the APK's own WebView (users already have the app)
 * and on iPhone/iPad, where the PWA install notice keeps serving.
 */
export default function AndroidAppPopup() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    // inside the standalone APK the UA contains "; wv)" — never nag there
    const inApk = ua.includes('; wv)');
    const isIOS = /iPhone|iPad|iPod/i.test(ua) ||
      (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    let seen = '';
    try {
      seen = localStorage.getItem(APK_SEEN_KEY) ?? '';
    } catch {
      /* storage unavailable */
    }

    if (!inApk && !isIOS && !standalone && seen !== APP_VERSION) {
      // decide + persist synchronously (before PwaInstall's 1.2s timer reads
      // its own flag) so only ONE install popup appears per device
      try {
        localStorage.setItem(NOTICE_SEEN_KEY, APP_VERSION);
      } catch {
        /* storage unavailable */
      }
      const timer = setTimeout(() => setShowPopup(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const dismiss = () => {
    setShowPopup(false);
    try {
      localStorage.setItem(APK_SEEN_KEY, APP_VERSION);
    } catch {
      /* storage unavailable */
    }
  };

  if (!showPopup) return null;

  return (
    <div
      role="dialog"
      aria-label="Android app download notification"
      className="fixed inset-x-3 bottom-[4.75rem] z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-96"
    >
      <div className="anim-sheet relative rounded-2xl border border-blue-200 bg-white p-4 shadow-2xl">
        <button
          onClick={dismiss}
          aria-label="Close Android app notification"
          className="absolute right-2 top-2 rounded-full p-1.5 text-blue-700 hover:bg-blue-50"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-start gap-3">
          <img
            src="/icon-192.png"
            alt="SLP Billing app icon"
            className="size-12 shrink-0 rounded-xl object-cover ring-2 ring-blue-200"
          />
          <div className="min-w-0 pr-5">
            <p className="flex items-center gap-1.5 text-sm font-bold leading-tight text-blue-900">
              <Smartphone className="size-4 shrink-0 text-blue-600" />
              Get the real Android app
            </p>
            <p className="text-sm font-bold leading-tight text-blue-800">
              అసలైన యాప్‌ని డౌన్‌లోడ్ చేయండి
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              బ్రౌజర్‌లో కాదు — ఫోన్‌లో నేరుగా తెరుచుకునే పూర్తి యాప్. ఉచితం.
            </p>
          </div>
        </div>

        <ul className="mt-3 space-y-1.5 text-xs text-blue-900">
          <li className="flex items-center gap-2">
            <Zap className="size-3.5 shrink-0 text-blue-600" /> ఫోన్ మీద నేరుగా తెరుచుకుంటుంది — Chrome అవసరం లేదు
          </li>
          <li className="flex items-center gap-2">
            <WifiOff className="size-3.5 shrink-0 text-blue-600" /> హోమ్ స్క్రీన్ ఐకాన్, ఫుల్-స్క్రీన్ యాప్
          </li>
          <li className="flex items-center gap-2">
            <ShieldCheck className="size-3.5 shrink-0 text-blue-600" /> మీ అదే సర్వర్, అదే బిల్లులు — కొత్త లాగిన్ అవసరం లేదు
          </li>
        </ul>

        <div className="mt-3 flex gap-2">
          <Button asChild className="h-10 flex-1 bg-blue-600 text-white hover:bg-blue-700">
            <a
              href="/slp-billing.apk"
              download="SLP-Billing.apk"
              onClick={dismiss}
            >
              <Download className="size-4" /> Download · డౌన్‌లోడ్
            </a>
          </Button>
          <Button variant="outline" onClick={dismiss} className="h-10">
            Close · మూసివేయి
          </Button>
        </div>
        <p className="mt-2 flex items-start justify-center gap-1 text-center text-[10px] text-muted-foreground">
          <Info className="mt-0.5 size-3 shrink-0" />
          డౌన్‌లోడ్ అయ్యాక: ఫైల్‌ని తెరిచి → &quot;Install anyway / ఏదైనా ఇన్‌స్టాల్&quot; అనుమతించండి
        </p>
        <p className="text-center text-[10px] text-muted-foreground">
          v{APP_VERSION} — మూసేయగానే ఈ వెర్షన్‌లో మళ్ళీ రాదు · closed = never again
        </p>
      </div>
    </div>
  );
}
