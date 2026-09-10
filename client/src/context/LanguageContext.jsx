import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'istidamah_lang';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  const isRTL = lang === 'ar';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    // Drive direction and language from the root element so CSS logical
    // properties, text selection and screen readers all behave correctly.
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.classList.toggle('font-arabic', isRTL);
  }, [lang, isRTL]);

  /**
   * Look up a translation key. Falls back to the English string, then to the
   * key itself, so a missing translation degrades visibly but never crashes.
   *
   * An optional second argument fills `{name}` placeholders in the string:
   *
   *   t('docs.limit', { max: '10 MB' })
   *
   * Interpolating rather than concatenating lets a translator move the value
   * to wherever the sentence needs it, which Arabic word order frequently
   * requires. Calls without `vars` are untouched.
   */
  const t = useCallback(
    (key, vars) => {
      const raw = translations[lang]?.[key] ?? translations.en[key] ?? key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (match, name) =>
        Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match
      );
    },
    [lang]
  );

  /**
   * Pick the right language variant for a database record.
   * Companies and evaluations store optional Arabic fields alongside the
   * English ones; this returns the Arabic value in Arabic mode when present
   * and falls back to English so older records still render.
   */
  const pick = useCallback(
    (record, field) => {
      if (!record) return '';
      const arField = `${field}Ar`;
      if (isRTL && record[arField]) return record[arField];
      return record[field] ?? '';
    },
    [isRTL]
  );

  /** Translate a governorate name coming back from the API. */
  const tGov = useCallback((name) => (name ? t(`gov.${name}`) : ''), [t]);

  /**
   * Format a number using Arabic-Indic digits when in Arabic, matching how
   * numerals are conventionally rendered in Omani government interfaces.
   */
  const fmt = useCallback(
    (value, options = {}) => {
      if (value === null || value === undefined || value === '—') return '—';
      const locale = isRTL ? 'ar-OM' : 'en-US';
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [isRTL]
  );

  const toggleLang = useCallback(() => setLang((l) => (l === 'en' ? 'ar' : 'en')), []);

  return (
    <LanguageContext.Provider value={{ lang, isRTL, setLang, toggleLang, t, tGov, fmt, pick }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
