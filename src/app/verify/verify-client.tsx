'use client';

import { useSyncExternalStore } from 'react';
import { Languages } from 'lucide-react';
import VerifyView from '@/components/VerifyView';
import { appT, type AppLangKey } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/types';

/**
 * Client shell of the PUBLIC /verify page.
 *
 * A customer's phone has no vault / no store language — the app's language
 * lives behind the MPIN gate — so this page carries its OWN English | తెలుగు
 * toggle (persisted in localStorage) and passes the choice down to VerifyView.
 */
const LANG_KEY = 'slp-public-lang';

/** tiny external store around localStorage — SSR-safe via useSyncExternalStore */
const langStore = {
  listeners: new Set<() => void>(),
  subscribe(fn: () => void) {
    langStore.listeners.add(fn);
    return () => {
      langStore.listeners.delete(fn);
    };
  },
  get(): AppLanguage {
    try {
      return localStorage.getItem(LANG_KEY) === 'te' ? 'te' : 'en';
    } catch {
      return 'en';
    }
  },
  getServer(): AppLanguage {
    return 'en';
  },
  set(next: AppLanguage) {
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* storage unavailable */
    }
    langStore.listeners.forEach((fn) => fn());
  },
};

export default function VerifyPublicClient() {
  const lang = useSyncExternalStore(langStore.subscribe, langStore.get, langStore.getServer);
  const t = (k: AppLangKey) => appT(lang, k);

  return (
    <div className="min-h-dvh bg-gradient-to-b from-blue-50 via-white to-blue-100 px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <img
            src="/narasimha-logo.jpg"
            alt="Company logo"
            className="size-16 rounded-full object-cover shadow-md ring-2 ring-white"
          />
          <h1 className="text-lg font-extrabold text-blue-900">SLP Cement Works</h1>
          <p className="text-xs font-semibold text-muted-foreground">{t('verify.publicTag')}</p>
          <div
            data-public-lang
            className="flex items-center gap-1 rounded-full border bg-card p-0.5 shadow-sm"
            role="group"
            aria-label="Language"
          >
            <Languages className="mx-1 size-3.5 text-muted-foreground" />
            {(['en', 'te'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => langStore.set(l)}
                aria-pressed={lang === l}
                className={`rounded-full px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
                  lang === l ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-accent'
                }`}
              >
                {l === 'en' ? 'English' : 'తెలుగు'}
              </button>
            ))}
          </div>
        </div>

        <VerifyView lang={lang} autoFocus={false} />

        <p className="pb-6 text-center text-[10px] leading-relaxed text-muted-foreground">{t('verify.publicNote')}</p>
      </div>
    </div>
  );
}
