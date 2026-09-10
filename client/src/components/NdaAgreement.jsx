import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileSignature, Check, AlertCircle } from 'lucide-react';
import Modal from './ui/Modal';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/presets';

/**
 * The non-disclosure agreement, signed before a registration can be submitted.
 *
 * The reference flow signs on a single button press, with nothing to read. That
 * makes the record of consent meaningless: the applicant cannot have agreed to
 * terms never put in front of them. Here the button opens the terms, and the
 * confirmation sits at the foot of that text — so signing follows reading, and
 * the timestamp recorded alongside it means something.
 *
 * `onSign` receives an ISO timestamp. Signing is deliberately one-way within a
 * session: an applicant who wants to withdraw consent abandons the form rather
 * than un-ticking a record that has already been made.
 */
export default function NdaAgreement({ signedAt, onSign }) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [readConfirmed, setReadConfirmed] = useState(false);

  const sign = () => {
    onSign(new Date().toISOString());
    setOpen(false);
  };

  return (
    <div className="mt-6 rounded-2xl border border-navy-100 bg-navy-50/70 p-5">
      <div className="flex items-start gap-3">
        <FileSignature size={18} className="mt-0.5 shrink-0 text-navy-700" />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-sm font-black text-navy-900">{t('nda.title')}</h3>
          <p className="mt-1.5 text-xs leading-loose text-ink-muted">{t('nda.lead')}</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="rounded-full bg-navy-700 px-5 py-2.5 text-xs font-black text-white transition-colors hover:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
            >
              {signedAt ? t('nda.review') : t('nda.sign')}
            </button>

            <AnimatePresence>
              {signedAt && (
                <motion.span
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="flex items-center gap-1.5 text-xs font-black text-teal-700"
                >
                  <Check size={14} strokeWidth={3} /> {t('nda.signed')}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t('nda.title')} size="md">
        {/* The terms themselves. Scrollable inside the dialog, so the
            confirmation below is reached by moving through the text. */}
        <div className="space-y-4 text-sm leading-loose text-ink-muted">
          {['nda.clause1', 'nda.clause2', 'nda.clause3', 'nda.clause4'].map((key) => (
            <p key={key}>{t(key)}</p>
          ))}
        </div>

        <div className="mt-6 border-t border-rule pt-5">
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink">
            <input
              type="checkbox"
              checked={readConfirmed}
              onChange={(e) => setReadConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-navy-700"
            />
            {t('nda.readConfirm')}
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={sign}
              disabled={!readConfirmed}
              className="btn-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('nda.agree')}
            </button>
            <button type="button" onClick={() => setOpen(false)} className="btn-quiet">
              {t('nda.close')}
            </button>
          </div>

          {!readConfirmed && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-soft">
              <AlertCircle size={12} /> {t('nda.mustRead')}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}
