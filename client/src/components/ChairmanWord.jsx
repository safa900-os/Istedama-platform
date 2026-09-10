import { useState } from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { CHAIRMAN } from '../data/programme';
import { fadeUp, stagger, inView, EASE } from '../motion/presets';

/**
 * The chairman's message.
 *
 * A two-column band: the message reads on the text side, the portrait sits
 * opposite it. The columns swap with the reading direction, so in Arabic the
 * text leads from the right and the portrait closes the row on the left —
 * matching the printed layout.
 *
 * When the portrait file is missing the frame does not collapse or show a
 * broken image; it falls back to the brand mark on a tinted panel. That keeps
 * the section shippable before the official photograph is supplied.
 */
export default function ChairmanWord() {
  const { t, lang, isRTL } = useLanguage();
  const [portraitFailed, setPortraitFailed] = useState(false);

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="overflow-hidden rounded-4xl border border-rule bg-wash-hero shadow-card"
      >
        <div className="grid items-stretch gap-0 lg:grid-cols-[1.15fr,1fr]">
          {/* ------------------------------------------------------- text */}
          <motion.div
            variants={stagger(0.08)}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="relative px-6 py-12 sm:px-12 sm:py-14"
          >
            {/*
              A decorative quote mark, anchored to the side the text starts on.
              `start-6` is a logical inset, so it moves with the direction
              rather than needing an RTL override.
            */}
            <Quote
              size={54}
              aria-hidden="true"
              className="absolute top-8 start-6 text-navy-700/10"
              strokeWidth={1.5}
            />

            <motion.p variants={fadeUp} className="eyebrow relative">
              {t('chairman.eyebrow')}
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="relative mt-4 font-display text-[1.9rem] font-black leading-tight tracking-tight text-navy-900 sm:text-[2.4rem]"
            >
              {t('chairman.title')}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="relative mt-6 max-w-2xl text-[17px] leading-loose text-ink-muted"
            >
              {CHAIRMAN.body[lang]}
            </motion.p>

            <motion.div variants={fadeUp} className="relative mt-8 flex items-center gap-4">
              <span
                aria-hidden="true"
                className="h-12 w-1 shrink-0 rounded-full bg-gradient-to-b from-navy-700 to-accent-500"
              />
              <div>
                <p className="font-display text-base font-black text-navy-900">
                  {CHAIRMAN.name[lang]}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{CHAIRMAN.role[lang]}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ---------------------------------------------------- portrait */}
          <motion.div
            initial={{ opacity: 0, x: isRTL ? -24 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={inView}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative min-h-[280px] bg-navy-50 sm:min-h-[360px]"
          >
            {portraitFailed ? (
              <div className="flex h-full w-full items-center justify-center p-10">
                <img
                  src="/promo/lockup.png"
                  alt=""
                  className="max-h-24 w-auto max-w-[70%] object-contain opacity-40"
                />
              </div>
            ) : (
              <img
                src={CHAIRMAN.portrait}
                alt={`${CHAIRMAN.name[lang]} — ${CHAIRMAN.role[lang]}`}
                onError={() => setPortraitFailed(true)}
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            )}

            {/* A soft edge where the photo meets the text column, so the two
                halves read as one band rather than two pasted panels. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 hidden w-24 bg-gradient-to-l from-transparent to-wash-hero lg:block ltr:left-0 rtl:right-0 rtl:bg-gradient-to-r"
            />
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
