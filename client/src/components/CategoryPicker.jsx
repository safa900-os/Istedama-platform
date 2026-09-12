import { useEffect, useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

/**
 * Picks the categories a business sells under.
 *
 * The list comes from the server rather than from a copy held here, so the
 * options a registrant sees and the values the server accepts are the same
 * thing. If the request fails the field degrades to nothing rather than to a
 * stale local list that would be rejected on submit.
 *
 * Chips, not a multi-select box: a native multiple-select needs a modifier key
 * to add a second choice, gives no indication that it does, and shows the
 * chosen items only by highlight inside a scrolling list. Here every choice
 * stays visible above the list and can be removed on its own.
 */
export default function CategoryPicker({ value = [], onChange, error, hint }) {
  const { t, lang, isRTL } = useLanguage();
  const [catalogue, setCatalogue] = useState([]);
  const [max, setMax] = useState(6);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let live = true;
    api
      .get('/companies/categories')
      .then((res) => {
        if (!live) return;
        setCatalogue(res.data.data.categories || []);
        setMax(res.data.data.max || 6);
      })
      .catch(() => live && setCatalogue([]));
    return () => {
      live = false;
    };
  }, []);

  const label = (c) => (isRTL ? c.ar : c.en);
  const byKey = useMemo(
    () => Object.fromEntries(catalogue.map((c) => [c.key, c])),
    [catalogue]
  );

  const full = value.length >= max;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogue;
    // Matched against both labels, so typing "IT" finds it on an Arabic page
    // and typing Arabic finds it on an English one.
    return catalogue.filter(
      (c) =>
        c.en.toLowerCase().includes(q) || c.ar.includes(query.trim()) || c.key.includes(q)
    );
  }, [catalogue, query]);

  const toggle = (key) => {
    if (value.includes(key)) {
      onChange(value.filter((k) => k !== key));
    } else if (!full) {
      onChange([...value, key]);
    }
  };

  return (
    <div className="sm:col-span-2">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="block text-sm font-bold text-ink">{t('form.categories')}</span>
        <span className={`text-xs font-bold ${full ? 'text-accent-700' : 'text-ink-soft'}`}>
          {t('form.categoriesCount')
            .replace('{n}', lang === 'ar' ? toArabic(value.length) : value.length)
            .replace('{max}', lang === 'ar' ? toArabic(max) : max)}
        </span>
      </div>

      {hint && <p className="mb-3 text-sm text-ink-muted">{hint}</p>}

      {/* The choices so far, each removable on its own. */}
      {value.length > 0 && (
        <ul className="mb-3 flex flex-wrap gap-2">
          {value.map((key) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => toggle(key)}
                className="inline-flex items-center gap-1.5 rounded-full bg-navy-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-navy-800"
              >
                {byKey[key] ? label(byKey[key]) : key}
                <X size={13} aria-hidden="true" />
                <span className="sr-only">{t('form.removeCategory')}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="field-shell mb-3">
        <Search size={16} className="field-glyph" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('form.searchCategories')}
          aria-label={t('form.searchCategories')}
          className="field field-icon"
        />
      </div>

      <div
        role="group"
        aria-label={t('form.categories')}
        className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-2xl border border-rule bg-surface p-3"
      >
        {visible.length === 0 && (
          <p className="px-1 py-2 text-sm text-ink-soft">{t('form.noCategoryMatch')}</p>
        )}
        {visible.map((c) => {
          const chosen = value.includes(c.key);
          // A category already chosen stays clickable, so it can be removed
          // from here too; only unchosen ones are disabled once the cap is met.
          const blocked = full && !chosen;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={chosen}
              disabled={blocked}
              onClick={() => toggle(c.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                chosen
                  ? 'border-navy-700 bg-navy-50 font-bold text-navy-900'
                  : blocked
                    ? 'cursor-not-allowed border-rule text-ink-soft opacity-50'
                    : 'border-rule text-ink hover:border-navy-300 hover:bg-navy-50'
              }`}
            >
              {chosen && <Check size={13} aria-hidden="true" />}
              {label(c)}
            </button>
          );
        })}
      </div>

      {error && (
        <p id="categories-error" className="mt-1.5 text-sm font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Western digits to Arabic-Indic, for the counter inside a template string. */
const toArabic = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
