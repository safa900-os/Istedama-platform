import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, CornerDownLeft, Handshake, Compass } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { PARTNER_CATEGORIES, ALL_DIRECTORY_PARTNERS } from '../data/partnerDirectory';
import { STRATEGIC_PARTNERS } from '../data/partners';
import { EASE } from '../motion/presets';

/**
 * Site search, from the header.
 *
 * What was here before searched registered companies only, through the API —
 * so it answered nothing when the server was down and nothing at all about the
 * site itself. This searches what the client already holds: every page in the
 * navigation, every partner category, and all forty firms across the two
 * partner registries. No request, no spinner, no empty state caused by a
 * network failure.
 *
 * Both languages are matched at once. Someone on the Arabic page typing "nizwa"
 * still finds بنك نزوى — the content is bilingual and the keyboard in front of
 * them may not be.
 *
 * The dialog is a real one: `aria-modal`, Escape to close, focus moved in on
 * open and returned to the button on close, and arrow keys through the results
 * with `aria-activedescendant` so the option is announced without focus ever
 * leaving the text box.
 */

/** Pages, named by the same translation keys the navigation uses. */
const PAGES = [
  { to: '/', key: 'nav.home' },
  { to: '/about', key: 'nav.about' },
  { to: '/partners', key: 'nav.partners' },
  { to: '/services', key: 'nav.servicesPage' },
  { to: '/facilities', key: 'nav.facilities' },
  { to: '/discounts', key: 'nav.discounts' },
  { to: '/companies', key: 'nav.directory' },
  { to: '/advertise', key: 'nav.advertise' },
  { to: '/tenders', key: 'nav.tenders' },
  { to: '/news', key: 'nav.news' },
  { to: '/contact', key: 'nav.contact' }
];

export default function SiteSearch({ className = '' }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);
  const listRef = useRef(null);

  /* Built once. It is a few hundred strings, not a corpus. */
  const index = useMemo(() => {
    const pages = PAGES.map((p) => ({
      id: `page:${p.to}`,
      to: p.to,
      group: 'page',
      title: { ar: t(p.key), en: t(p.key) }
    }));
    const cats = PARTNER_CATEGORIES.map((c) => ({
      id: `cat:${c.id}`,
      to: '/partners',
      group: 'category',
      title: c.name
    }));
    const roster = ALL_DIRECTORY_PARTNERS.map((m) => ({
      id: `firm:${m.categoryId}:${m.id}`,
      to: '/partners',
      group: 'partner',
      title: m.name,
      sub: m.categoryName
    }));
    const strategic = STRATEGIC_PARTNERS.map((p) => ({
      id: `strategic:${p.id}`,
      to: '/partners',
      group: 'partner',
      title: p.name,
      sub: p.kind
    }));
    return [...pages, ...cats, ...roster, ...strategic];
  }, [t]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return index
      .filter((r) => `${r.title.ar} ${r.title.en}`.toLowerCase().includes(q))
      .slice(0, 12);
  }, [q, index]);

  useEffect(() => setCursor(0), [q]);

  /* Ctrl/Cmd+K from anywhere, Escape to leave. */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === 'Escape' && open) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* Move focus in on open; hand it back to the button on close. */
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    setQuery('');
    triggerRef.current?.focus({ preventScroll: true });
    return undefined;
  }, [open]);

  /* The page behind must not scroll while the dialog is up. */
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const go = (item) => {
    setOpen(false);
    navigate(item.to);
  };

  const onInputKey = (e) => {
    if (!results.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => (c + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[cursor]);
    }
  };

  /*
    Optional-called: `scrollIntoView` is not universal — jsdom has no
    implementation at all, and calling it there took the whole dialog down with
    an uncaught TypeError. Keeping the highlighted row in view is a nicety, so
    it should never be able to break the search.
  */
  useEffect(() => {
    listRef.current
      ?.querySelector('[data-active="true"]')
      ?.scrollIntoView?.({ block: 'nearest' });
  }, [cursor, results.length]);

  const GROUP_ICON = { page: Compass, category: Handshake, partner: Handshake };

  return (
    <>
      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.94 }}
        aria-label={t('search.open')}
        title={t('search.open')}
        className={`flex h-10 w-10 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-50 ${className}`}
      >
        <Search size={18} strokeWidth={2.1} />
      </motion.button>

      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="search-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-[100] flex items-start justify-center bg-navy-900/45 px-4 pt-[12vh] backdrop-blur-sm"
                onMouseDown={(e) => {
                  if (e.target === e.currentTarget) setOpen(false);
                }}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={t('search.dialogLabel')}
                  initial={{ opacity: 0, y: -14, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: EASE }}
                  className="w-full max-w-xl overflow-hidden rounded-3xl border border-rule bg-surface shadow-pop"
                >
                  <div className="flex items-center gap-3 border-b border-rule px-5">
                    <Search size={18} className="shrink-0 text-ink-soft" aria-hidden="true" />
                    <input
                      ref={inputRef}
                      type="text"
                      role="combobox"
                      aria-expanded={results.length > 0}
                      aria-controls="site-search-results"
                      aria-autocomplete="list"
                      aria-activedescendant={
                        results.length ? `site-search-opt-${cursor}` : undefined
                      }
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={onInputKey}
                      placeholder={t('search.placeholder')}
                      aria-label={t('search.inputLabel')}
                      className="h-16 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-soft"
                    />
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      aria-label={t('search.close')}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-mist hover:text-navy-700"
                    >
                      <X size={17} />
                    </button>
                  </div>

                  <div
                    ref={listRef}
                    id="site-search-results"
                    role="listbox"
                    aria-label={t('search.resultsLabel')}
                    className="max-h-[52vh] overflow-y-auto p-2"
                  >
                    {!q ? (
                      <p className="px-4 py-8 text-center text-sm text-ink-soft">
                        {t('search.hint')}
                      </p>
                    ) : results.length === 0 ? (
                      <p className="px-4 py-8 text-center text-sm text-ink-muted">
                        {t('search.noResults')}
                      </p>
                    ) : (
                      results.map((r, i) => {
                        const Icon = GROUP_ICON[r.group] || Compass;
                        return (
                          <button
                            key={r.id}
                            id={`site-search-opt-${i}`}
                            role="option"
                            aria-selected={i === cursor}
                            data-active={i === cursor}
                            type="button"
                            onMouseMove={() => setCursor(i)}
                            onClick={() => go(r)}
                            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-start transition-colors ${
                              i === cursor ? 'bg-navy-50' : 'hover:bg-mist'
                            }`}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mist text-navy-700">
                              <Icon size={16} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-bold text-navy-900">
                                {r.title[lang]}
                              </span>
                              <span className="block truncate text-xs text-ink-soft">
                                {r.sub ? r.sub[lang] : t(`search.group.${r.group}`)}
                              </span>
                            </span>
                            {i === cursor && (
                              <CornerDownLeft
                                size={14}
                                aria-hidden="true"
                                className="shrink-0 text-ink-soft"
                              />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
