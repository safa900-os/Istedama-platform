import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Image as ImageIcon, X, Check, AlertCircle } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/presets';

/**
 * The document checklist for a registration.
 *
 * Files are held here and uploaded by the parent once the company record
 * exists — the upload routes are addressed by company id, and during the
 * wizard there is no id yet. Holding them also means a user who abandons the
 * form has not left orphaned files on the server.
 *
 * The slot list comes from the API rather than being repeated here. The server
 * decides what a merchant owes versus an organisation, and a second copy in the
 * client would eventually disagree with it.
 */

const ICON_FOR = { pdf: FileText, jpg: ImageIcon, png: ImageIcon };

const extList = (accept) => accept.map((a) => `.${a}`).join(',');

export default function DocumentChecklist({ entityType, files, onChange }) {
  const { t, lang, fmt } = useLanguage();

  // Uses the shared formatter so sizes carry Arabic-Indic digits in Arabic,
  // matching every other number in the app.
  const prettySize = (bytes) => {
    const mb = bytes / (1024 * 1024);
    const inMb = mb >= 1;
    return `${fmt(inMb ? mb : bytes / 1024, { maximumFractionDigits: 1 })} ${inMb ? 'MB' : 'KB'}`;
  };

  const [slots, setSlots] = useState([]);
  const [maxBytes, setMaxBytes] = useState(10 * 1024 * 1024);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const inputs = useRef({});

  useEffect(() => {
    let live = true;
    setLoading(true);
    api
      .get('/companies/documents/catalogue', { params: { entityType } })
      .then((res) => {
        if (!live) return;
        setSlots(res.data.data.slots);
        setMaxBytes(res.data.data.maxBytes);
      })
      .catch(() => live && setSlots([]))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [entityType]);

  // Dropping a registration type can orphan a file in a slot that no longer
  // applies — an organisation has no `chamber`. Clear those rather than
  // uploading something the server would reject.
  useEffect(() => {
    if (loading || !slots.length) return;
    const valid = new Set(slots.map((s) => s.slot));
    const stale = Object.keys(files).filter((k) => !valid.has(k));
    if (stale.length) {
      const next = { ...files };
      stale.forEach((k) => delete next[k]);
      onChange(next);
    }
  }, [slots, loading, files, onChange]);

  const required = useMemo(() => slots.filter((s) => s.required), [slots]);
  const missing = useMemo(
    () => required.filter((s) => !files[s.slot]).map((s) => s.slot),
    [required, files]
  );

  const pick = (slot, accept) => (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Checked here only so the user hears about it immediately; the server
    // checks the same things again, and reads the file signature besides.
    const ext = file.name.split('.').pop()?.toLowerCase();
    const normalised = ext === 'jpeg' ? 'jpg' : ext;
    if (!accept.includes(normalised)) {
      setErrors((e) => ({ ...e, [slot]: t('docs.errType', { types: extList(accept) }) }));
      event.target.value = '';
      return;
    }
    if (file.size > maxBytes) {
      setErrors((e) => ({ ...e, [slot]: t('docs.errSize', { max: prettySize(maxBytes) }) }));
      event.target.value = '';
      return;
    }

    setErrors((e) => {
      const next = { ...e };
      delete next[slot];
      return next;
    });
    onChange({ ...files, [slot]: file });
  };

  const clear = (slot) => {
    const next = { ...files };
    delete next[slot];
    onChange(next);
    if (inputs.current[slot]) inputs.current[slot].value = '';
    setErrors((e) => {
      const rest = { ...e };
      delete rest[slot];
      return rest;
    });
  };

  if (loading) {
    return <p className="hint">{t('docs.loading')}</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="label mb-0">{t('form.documents')}</p>
        <p className="text-xs text-ink-soft">
          {t('docs.limit', { max: prettySize(maxBytes) })}
        </p>
      </div>

      <ul className="space-y-2.5">
        {slots.map((s) => {
          const chosen = files[s.slot];
          const error = errors[s.slot];
          const Icon = ICON_FOR[s.accept[0]] || FileText;
          const inputId = `doc-${s.slot}`;

          return (
            <li
              key={s.slot}
              className={`rounded-2xl border p-3.5 transition-colors ${
                error
                  ? 'border-gold-500 bg-gold-50'
                  : chosen
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-rule bg-surface'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    chosen ? 'bg-teal-500 text-white' : 'bg-mist text-navy-700'
                  }`}
                >
                  {chosen ? <Check size={18} /> : <Icon size={18} />}
                </span>

                <div className="min-w-0 flex-1">
                  <label htmlFor={inputId} className="block cursor-pointer">
                    <span className="block text-sm font-bold text-ink">
                      {s.label[lang] || s.label.en}
                      {s.required && <span className="ms-1 text-gold-600">*</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-muted">
                      {chosen
                        ? `${chosen.name} · ${prettySize(chosen.size)}`
                        : t('docs.accepts', { types: s.accept.join(' / ').toUpperCase() })}
                    </span>
                  </label>
                </div>

                <input
                  id={inputId}
                  ref={(el) => {
                    inputs.current[s.slot] = el;
                  }}
                  type="file"
                  className="sr-only"
                  accept={extList(s.accept)}
                  aria-describedby={error ? `${inputId}-err` : undefined}
                  aria-invalid={error ? 'true' : undefined}
                  onChange={pick(s.slot, s.accept)}
                />

                {chosen ? (
                  <button
                    type="button"
                    onClick={() => clear(s.slot)}
                    aria-label={t('docs.remove', { name: s.label[lang] || s.label.en })}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-surface hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-700"
                  >
                    <X size={16} />
                  </button>
                ) : (
                  <label
                    htmlFor={inputId}
                    className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-navy-50 px-3.5 py-2 text-xs font-bold text-navy-700 transition-colors hover:bg-navy-100"
                  >
                    <UploadCloud size={14} />
                    {t('docs.choose')}
                  </label>
                )}
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    id={`${inputId}-err`}
                    role="alert"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.18, ease: EASE }}
                    className="flex items-center gap-1.5 overflow-hidden ps-[3.25rem] text-xs font-medium text-gold-700"
                  >
                    <AlertCircle size={13} /> {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </li>
          );
        })}
      </ul>

      {missing.length > 0 && (
        <p className="hint flex items-center gap-1.5">
          <AlertCircle size={13} className="text-gold-600" />
          {t('docs.stillNeeded', { count: missing.length })}
        </p>
      )}
    </div>
  );
}
