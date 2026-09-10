import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accessibility, X, Plus, Minus, RotateCcw, Contrast, Link2, Volume2, Square,
  Type, MousePointer2, Waves, MessageSquare, Play
} from 'lucide-react';
import { useAccessibility } from '../context/AccessibilityContext';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/variants';

/**
 * The accessibility panel.
 *
 * Three things were wrong with the version this replaces, and all three hurt
 * exactly the readers the panel exists for:
 *
 *   - It read `readAloud`, `setReadAloud`, `stopSpeaking` and `ttsSupported`
 *     off the context. The context has never exported any of those names, so
 *     the switch sat permanently disabled behind "not supported in this
 *     browser" — and would have thrown on the first click had it been
 *     reachable. Read-aloud therefore never worked at all. The real names are
 *     `speechEnabled`, `readPage`, `cancelSpeech` and `speechSupported`.
 *
 *   - Three preferences the context implements and index.css already styles —
 *     a plainer typeface, a large pointer, and reduced motion — had no control
 *     anywhere in the interface. They could be set only by hand-editing local
 *     storage.
 *
 *   - Everything was one flat column of switches. The programme's members
 *     include merchants in their sixties, so the settings are grouped by what
 *     they are *for* — seeing, motion, listening — rather than by the
 *     mechanism behind them, and every control is at least 44px tall.
 */

/** One labelled switch. */
function Toggle({ on, onToggle, label, icon: Icon, hint, disabled }) {
  const { isRTL } = useLanguage();
  return (
    <div className={`rounded-xl bg-canvas px-3 py-2.5 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex min-h-[44px] items-center justify-between gap-3">
        <span className="flex items-center gap-2 text-sm font-medium text-ink">
          <Icon size={16} strokeWidth={2} aria-hidden="true" /> {label}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label={label}
          disabled={disabled}
          onClick={onToggle}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-navy-700' : 'bg-rule'}`}
        >
          <motion.span
            className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
            initial={false}
            animate={{ [isRTL ? 'right' : 'left']: on ? 24 : 4 }}
            transition={{ duration: 0.22, ease: EASE }}
          />
        </button>
      </div>
      {hint && <p className="mt-1 text-[11px] leading-snug text-ink-soft">{hint}</p>}
    </div>
  );
}

/** A heading over a run of related controls. */
function Group({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="px-1 text-[11px] font-black uppercase tracking-wide text-ink-soft">{title}</h3>
      {children}
    </section>
  );
}

const FONT_LEVELS = 4;

export default function AccessibilityWidget({ variant = 'floating' }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const triggerRef = useRef(null);
  const { t, fmt, isRTL } = useLanguage();
  const inHeader = variant === 'header';
  /*
    The context returns null when no provider is above — App.jsx already treats
    that as a legitimate state. Now that this widget sits inside the header it
    can be mounted in trees that have no provider, and destructuring null there
    took the whole bar down with it. Read first, bail after the hooks.
  */
  const a11y = useAccessibility();
  const {
    highContrast, setHighContrast,
    highlightLinks, setHighlightLinks,
    readableFont, setReadableFont,
    bigCursor, setBigCursor,
    reduceMotion, setReduceMotion,
    fontStep, increaseFont, decreaseFont,
    speechEnabled, setSpeechEnabled,
    hoverRead, setHoverRead,
    speaking, readPage, cancelSpeech,
    speechSupported,
    reset
  } = a11y ?? {};

  /*
    The panel is a dialog, so opening it moves focus into it and closing hands
    focus back to the button. Without this the panel sits before the button in
    the DOM and the only way to reach its switches from the keyboard is
    Shift+Tab — which nobody guesses.
  */
  useEffect(() => {
    if (open) panelRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (!a11y) return null;

  return (
    <div
      className={
        inHeader
          ? 'relative'
          : `fixed bottom-5 z-50 ${isRTL ? 'right-5' : 'left-5'}`
      }
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.97 }}
            transition={{ duration: 0.2, ease: EASE }}
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-label={t('a11y.dialogLabel')}
            className={`max-h-[min(78vh,40rem)] w-[20rem] max-w-[calc(100vw-2.5rem)] overflow-y-auto rounded-2xl border border-rule bg-surface p-4 shadow-pop outline-none ${
              inHeader ? 'absolute end-0 top-full z-50 mt-3' : 'mb-3'
            }`}
          >
            <div className="mb-4 flex items-center justify-between">
              <p className="font-display text-base font-black text-navy-900">{t('a11y.title')}</p>
              <button
                type="button"
                aria-label={t('a11y.closePanel')}
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 hover:bg-canvas"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-5">
              {/* ------------------------------------------------ seeing */}
              <Group title={t('a11y.groupSight')}>
                <div className="rounded-xl bg-canvas px-3 py-2.5">
                  <div className="flex min-h-[44px] items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-ink">
                      <Type size={16} strokeWidth={2} aria-hidden="true" /> {t('a11y.textSize')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        aria-label={t('a11y.decrease')}
                        onClick={decreaseFont}
                        disabled={fontStep === 0}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rule bg-surface disabled:opacity-40"
                      >
                        <Minus size={15} />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.9 }}
                        aria-label={t('a11y.increase')}
                        onClick={increaseFont}
                        disabled={fontStep === FONT_LEVELS - 1}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rule bg-surface disabled:opacity-40"
                      >
                        <Plus size={15} />
                      </motion.button>
                    </div>
                  </div>
                  {/* The level is stated rather than left to be inferred from
                      how the page looks — someone raising the size cannot
                      always tell whether the button did anything, or whether
                      they have reached the end of the range. */}
                  <p aria-live="polite" className="mt-1 text-[11px] text-ink-soft">
                    {t('a11y.textSizeLevel', {
                      level: fmt(fontStep + 1),
                      max: fmt(FONT_LEVELS)
                    })}
                  </p>
                </div>

                <Toggle
                  on={highContrast}
                  onToggle={() => setHighContrast((v) => !v)}
                  label={t('a11y.highContrast')}
                  icon={Contrast}
                />
                <Toggle
                  on={readableFont}
                  onToggle={() => setReadableFont((v) => !v)}
                  label={t('a11y.readableFont')}
                  hint={t('a11y.readableFontHint')}
                  icon={Type}
                />
                <Toggle
                  on={highlightLinks}
                  onToggle={() => setHighlightLinks((v) => !v)}
                  label={t('a11y.highlightLinks')}
                  icon={Link2}
                />
              </Group>

              {/* --------------------------------------- motion & pointer */}
              <Group title={t('a11y.groupMotion')}>
                <Toggle
                  on={reduceMotion}
                  onToggle={() => setReduceMotion((v) => !v)}
                  label={t('a11y.reduceMotion')}
                  hint={t('a11y.reduceMotionHint')}
                  icon={Waves}
                />
                <Toggle
                  on={bigCursor}
                  onToggle={() => setBigCursor((v) => !v)}
                  label={t('a11y.bigCursor')}
                  hint={t('a11y.bigCursorHint')}
                  icon={MousePointer2}
                />
              </Group>

              {/* --------------------------------------------- listening */}
              <Group title={t('a11y.groupSound')}>
                <Toggle
                  on={speechEnabled}
                  onToggle={() => setSpeechEnabled((v) => !v)}
                  label={t('a11y.readAloud')}
                  icon={Volume2}
                  hint={speechSupported ? undefined : t('a11y.ttsUnavailable')}
                  disabled={!speechSupported}
                />

                {/* These only exist once reading is on: offering "read this
                    page" while speech is off would do nothing when pressed. */}
                <AnimatePresence initial={false}>
                  {speechEnabled && speechSupported && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="space-y-2 overflow-hidden"
                    >
                      <Toggle
                        on={hoverRead}
                        onToggle={() => setHoverRead((v) => !v)}
                        label={t('a11y.hoverRead')}
                        hint={t('a11y.readAloudHint')}
                        icon={MessageSquare}
                      />
                      <button
                        type="button"
                        onClick={readPage}
                        className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-navy-700 px-3 text-sm font-bold text-white hover:bg-navy-800"
                      >
                        <Play size={14} strokeWidth={2.5} /> {t('a11y.readPage')}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {speaking && (
                    <motion.button
                      type="button"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={cancelSpeech}
                      className="flex min-h-[44px] w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gold-50 text-sm font-bold text-gold-700"
                    >
                      <Square size={12} strokeWidth={3} /> {t('a11y.stopReading')}
                    </motion.button>
                  )}
                </AnimatePresence>
              </Group>

              {/*
                A written route to a person. The programme's members include
                deaf and non-speaking merchants, for whom a phone number is not
                a way of getting help — so the panel that exists for access
                barriers names the channel that is not a phone call.
              */}
              <div className="rounded-xl border border-rule bg-navy-50/60 p-3">
                <p className="text-[11px] leading-relaxed text-ink-muted">{t('a11y.contact')}</p>
                <Link
                  to="/contact"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-navy-200 bg-surface px-3 text-sm font-bold text-navy-700 hover:bg-navy-50"
                >
                  <MessageSquare size={14} /> {t('a11y.contactCta')}
                </Link>
              </div>

              <button
                type="button"
                onClick={reset}
                className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-rule text-sm font-medium text-ink-muted hover:bg-canvas"
              >
                <RotateCcw size={14} /> {t('a11y.reset')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={inHeader ? undefined : { scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        aria-expanded={open}
        aria-label={open ? t('a11y.close') : t('a11y.open')}
        title={t('a11y.open')}
        className={
          inHeader
            ? 'relative flex h-10 w-10 items-center justify-center rounded-full text-navy-700 transition-colors hover:bg-navy-50'
            : 'relative flex h-14 w-14 items-center justify-center rounded-full bg-navy-700 text-white shadow-pop'
        }
      >
        {/* Pulse ring while speech is running, so the state is visible from
            outside the panel too. */}
        {speaking && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border-2 border-gold-500"
            animate={{ scale: [1, 1.35], opacity: [0.8, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, ease: 'easeOut' }}
          />
        )}
        {open ? <X size={inHeader ? 18 : 22} /> : <Accessibility size={inHeader ? 19 : 22} />}
      </motion.button>
    </div>
  );
}
