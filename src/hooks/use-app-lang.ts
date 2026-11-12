'use client';

import { useCallback } from 'react';
import { useStore } from '@/lib/store';
import { appT, type AppLangKey } from '@/lib/i18n';
import type { AppLanguage } from '@/lib/types';

/** Current app UI language (English or తెలుగు) from settings */
export function useAppLang(): AppLanguage {
  const lang = useStore((s) => s.settings.appLang);
  return lang === 'te' ? 'te' : 'en';
}

/**
 * t('key') translator bound to the current app language.
 * STABLE across renders (only changes when the language changes) — a new
 * function identity per render would re-trigger effects that depend on t.
 */
export function useT(): (key: AppLangKey) => string {
  const lang = useAppLang();
  return useCallback((key: AppLangKey) => appT(lang, key), [lang]);
}
