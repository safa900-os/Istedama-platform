import { motion } from 'framer-motion';
import { Users, Clock, TrendingUp } from 'lucide-react';
import SectionHead from './SectionHead';
import CountUp from './ui/CountUp';
import { useLanguage } from '../context/LanguageContext';
import { VISITOR_STATS } from '../data/programme';
import { fadeUp, stagger, inView } from '../motion/presets';

/**
 * Site audience figures.
 *
 * The numbers come from the programme's reporting material — this app has no
 * analytics integration, so nothing here is live. The footnote says so on the
 * page rather than only in a comment: a stat tile that looks live but is not
 * is the kind of detail a reader is entitled to know without reading source.
 */

const ICONS = { Users, Clock, TrendingUp };

export default function VisitorStats() {
  const { t, lang } = useLanguage();

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      <SectionHead eyebrow={t('audience.eyebrow')} title={t('audience.title')} lead={t('audience.lead')} center />

      <motion.dl
        variants={stagger(0.09)}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="mt-12 grid gap-5 sm:grid-cols-3"
      >
        {VISITOR_STATS.map((s) => {
          const Icon = ICONS[s.icon] || Users;
          return (
            <motion.div
              key={s.id}
              variants={fadeUp}
              className="group flex flex-col items-center rounded-3xl border border-rule bg-surface p-8 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500 text-navy-900 shadow-soft transition-transform duration-300 group-hover:scale-105">
                <Icon size={24} strokeWidth={1.9} />
              </span>

              <dt className="sr-only">{s.label[lang]}</dt>
              <dd className="mt-6 font-display text-4xl font-black tabular-nums text-navy-900">
                {/* CountUp already formats through the language context and
                    skips its animation under reduced motion, so the minute
                    figure only needs its decimal place and unit. */}
                <CountUp
                  value={s.value}
                  decimals={s.format === 'minutes' ? 1 : 0}
                  suffix={s.format === 'percent' ? '%' : ''}
                />
                {s.format === 'minutes' && (
                  <span className="ms-1.5 text-2xl">{t('audience.minutes')}</span>
                )}
              </dd>

              <p className="mt-3 font-display text-sm font-black text-navy-700">{s.label[lang]}</p>
              <p className="mt-1 text-xs text-ink-soft">{s.note[lang]}</p>
            </motion.div>
          );
        })}
      </motion.dl>

      <p className="mt-6 text-center text-xs text-ink-soft">{t('audience.note')}</p>
    </section>
  );
}
