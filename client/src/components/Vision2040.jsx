import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Boxes, Rocket, Recycle, TrendingUp } from 'lucide-react';
import SectionHead from './SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { VISION_2040 } from '../data/programme';
import { fadeUp, stagger, inView } from '../motion/presets';

/**
 * How the programme lines up with Oman Vision 2040.
 *
 * This replaced a dark two-column dashboard. Three things were wrong with it:
 *
 *   - It reported headline counts — total companies, certified companies —
 *     that the live impact band a few hundred pixels up the same page also
 *     reports, from the database. The two disagreed, so the page stated two
 *     different totals for the same thing. Those figures are gone; the band
 *     above is the one place the platform counts itself.
 *
 *   - Nothing in it was recognisably part of this site. A full-bleed dark
 *     dashboard with an outsized ghost "2040" behind the text belonged to a
 *     different product; every other section here is a light card on the slate
 *     ground.
 *
 *   - It leaned on a numeral for its identity where an actual mark exists. The
 *     Vision's own logo is in the programme's asset folder and is used here.
 *
 * What remains are the claims the programme makes about its own direction —
 * pillars, readiness, priorities, the activation path — and those are labelled
 * as published rather than measured, because that is what they are.
 */

const PILLAR_ICONS = { Boxes, Rocket, Recycle };

export default function Vision2040() {
  const { t, lang, fmt, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      {/* Title only. The statement itself now sits in the banner below,
          beside the mark it is about, rather than above a card that then
          repeated a caveat about figures the reader has not reached yet. */}
      <SectionHead eyebrow={t('v2040.badge')} title={t('v2040.title')} center />

      {/* ------------------------------------------------ alignment banner */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="mt-12 overflow-hidden rounded-4xl border border-rule bg-surface shadow-card"
      >
        <div className="grid items-center gap-0 md:grid-cols-[minmax(0,320px),1fr]">
          {/* No tinted panel behind the mark. The logo file carries its own
              white field, so a second block behind it drew a visible box
              inside a box — the mark now sits on the card itself. */}
          <div className="flex items-center justify-center px-8 py-10">
            {/* The Vision's own mark, from the programme's assets. */}
            <img
              src="/partners/oman-vision-2040.png"
              alt={t('v2040.badge')}
              loading="lazy"
              className="h-28 w-auto object-contain sm:h-32"
            />
          </div>

          <div className="p-7 sm:p-9">
            {/* What the programme actually claims about its alignment. The
                caveat that used to sit here — that the readiness and priority
                numbers are published targets — has moved down to where those
                numbers are, which is the only place it means anything. */}
            <p className="text-[15px] leading-loose text-ink-muted">{t('v2040.lead')}</p>

            <ul className="mt-6 flex flex-wrap gap-2.5">
              {['chipEnable', 'chipContracts', 'chipIcv'].map((k) => (
                <li
                  key={k}
                  className="rounded-full border border-navy-100 bg-navy-50/60 px-4 py-2 text-xs font-bold text-navy-700"
                >
                  {t(`v2040.${k}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* -------------------------------------------------------- pillars */}
      <motion.ul
        variants={stagger(0.07)}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="mt-6 grid gap-5 md:grid-cols-3"
      >
        {VISION_2040.pillars.map((p, i) => {
          const Icon = PILLAR_ICONS[p.icon] || Boxes;
          return (
            <motion.li
              key={p.id}
              variants={fadeUp}
              custom={i}
              className="card-pad h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                  i === 1 ? 'bg-accent-500' : 'bg-navy-700'
                }`}
              >
                <Icon size={21} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-black text-navy-900">{p.title[lang]}</h3>
              <p className="mt-3 text-sm leading-loose text-ink-muted">{p.body[lang]}</p>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* ------------------------------------------------- activation path */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="card-pad mt-6"
      >
        <h3 className="font-display text-lg font-black text-navy-900">{t('v2040.trackTitle')}</h3>

        <ol className="mt-7 grid gap-6 sm:grid-cols-3">
          {VISION_2040.track.map((s, i) => {
            const isLast = i === VISION_2040.track.length - 1;
            return (
              <li key={s.number} className="relative">
                {/* Connector to the next stage, hidden on the last one and at
                    widths where the row wraps — a line running off the end
                    would point at a stage that is not there. */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute top-5 hidden h-0.5 w-full bg-gradient-to-r from-navy-200 to-transparent sm:block ltr:left-1/2 rtl:right-1/2 rtl:bg-gradient-to-l"
                  />
                )}
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-navy-700 font-display text-sm font-black text-white shadow-soft">
                  {fmt(s.number)}
                </span>
                <p className="relative mt-4 text-sm font-bold leading-relaxed text-ink">
                  {s.label[lang]}
                </p>
              </li>
            );
          })}
        </ol>
      </motion.div>

      {/* ------------------------------------- readiness and 2025 priorities */}
      <p className="mt-10 text-center text-xs leading-relaxed text-ink-soft">
        {t('v2040.figuresNote')}
      </p>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="card-pad"
        >
          <h3 className="font-display text-lg font-black text-navy-900">
            {t('v2040.readinessTitle')}
          </h3>

          <ul className="mt-6 space-y-5">
            {VISION_2040.meters.map((m) => (
              <li key={m.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-ink">{m.label[lang]}</span>
                  <span className="font-display text-sm font-black tabular-nums text-navy-700">
                    {fmt(m.value)}%
                  </span>
                </div>
                {/* The bar is graphical, so the figure is on its accessible
                    name as well as printed beside it. */}
                <div
                  role="img"
                  aria-label={`${m.label[lang]} — ${fmt(m.value)}%`}
                  className="mt-2 h-2 overflow-hidden rounded-full bg-mist"
                >
                  <motion.span
                    className="block h-full rounded-full bg-gradient-to-r from-navy-700 to-accent-500"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.value}%` }}
                    viewport={inView}
                    transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="card-pad flex flex-col"
        >
          <h3 className="font-display text-lg font-black text-navy-900">
            {t('v2040.prioritiesTitle')}
          </h3>

          <ul className="mt-6 space-y-3">
            {VISION_2040.priorities.items.map((item) => (
              <li
                key={item.en}
                className="flex items-start gap-3 rounded-2xl bg-mist/70 px-4 py-3 text-sm font-bold leading-relaxed text-ink"
              >
                <span
                  aria-hidden="true"
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent-500"
                />
                {item[lang]}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex items-center gap-4 border-t border-rule pt-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-50 text-accent-600">
              <TrendingUp size={21} strokeWidth={2} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-2xl font-black leading-none text-navy-900">
                +{fmt(VISION_2040.priorities.uplift)}%
              </p>
              <p className="mt-1.5 text-xs text-ink-soft">{t('v2040.upliftNote')}</p>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="mt-9 text-center">
        <Link to="/about" className="btn-quiet">
          {t('v2040.cta')} <Arrow size={15} strokeWidth={2.4} />
        </Link>
      </div>
    </section>
  );
}
