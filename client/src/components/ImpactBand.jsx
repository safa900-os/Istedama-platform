import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, FileText, Award, TrendingUp, Boxes, Tag, ClipboardCheck } from 'lucide-react';
import api from '../api/axios';
import CountUp from './ui/CountUp';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp, stagger, inView, EASE } from '../motion/presets';

/**
 * The programme's impact dashboard: a deep navy band of headline figures with
 * a secondary strip beneath, matching the reference screens. Figures come from
 * the live aggregate endpoint; the presentational extras (visits, satisfaction)
 * are programme metrics the API doesn't track and are labelled as indicative.
 */
export default function ImpactBand() {
  const { t } = useLanguage();
  const [impact, setImpact] = useState(null);

  useEffect(() => {
    api.get('/content/impact').then((r) => setImpact(r.data.data)).catch(() => setImpact(null));
  }, []);

  // Every figure below is a real aggregate from /api/content/impact — nothing
  // here is a decorative placeholder.
  const primary = [
    { icon: Building2, value: impact?.totalCompanies ?? 0, label: t('impact.companies') },
    { icon: FileText, value: impact?.activeTenders ?? 0, label: t('impact.tenders') },
    { icon: Award, value: impact?.certified ?? 0, label: t('impact.certified') },
    { icon: TrendingUp, value: impact?.avgScore ?? 0, label: t('impact.avgScore') },
    { icon: Boxes, value: impact?.avgIcv ?? 0, label: t('impact.avgIcv'), suffix: '%' }
  ];

  const secondary = [
    { icon: Building2, value: impact?.facilities ?? 0, label: t('impact.facilities') },
    { icon: Tag, value: impact?.discounts ?? 0, label: t('impact.discounts') },
    { icon: ClipboardCheck, value: impact?.evaluationsCompleted ?? 0, label: t('impact.evaluations') }
  ];

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-6 sm:px-5">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="relative overflow-hidden rounded-4xl bg-wash-navy p-7 shadow-lift sm:p-10"
      >
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-gold-500/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="eyebrow !text-navy-200">{t('impact.eyebrow')}</p>
            <h2 className="mt-2 font-display text-[1.7rem] font-black tracking-tight text-white sm:text-[2.1rem]">
              {t('impact.title')}
            </h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white">
            <span className="relative flex h-2 w-2">
              {/* The pulse sits on the navy band, where the mark's orange
                  reads far more clearly than a pale green did. */}
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-400" />
            </span>
            {t('impact.live')}
          </span>
        </div>

        <motion.div
          variants={stagger(0.08, 0.1)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="relative mt-9 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-5"
        >
          {primary.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={i}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.3, ease: EASE }}
              /* Centred at every width. Left-aligning these on wide screens
                 put the icon, the figure and the label on three different
                 optical axes inside a column only as wide as the label — the
                 dividers already do the work of separating them. */
              className={`px-4 text-center ${i < primary.length - 1 ? 'lg:border-e lg:border-white/12' : ''}`}
            >
              <span className="mx-auto inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                <s.icon size={18} strokeWidth={2} />
              </span>
              <p className="mt-4 font-display text-[2rem] font-black leading-none text-white">
                <CountUp value={s.value} suffix={s.suffix || ''} />
              </p>
              <p className="mt-2 text-xs font-medium text-navy-200">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="relative mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-white/12 pt-6">
          {secondary.map((s) => (
            <span key={s.label} className="flex items-center gap-2 text-xs text-navy-200">
              <s.icon size={14} className="text-gold-300" />
              <strong className="font-display text-sm font-black text-white">
                {s.prefix || ''}<CountUp value={s.value} suffix={s.suffix || ''} />
              </strong>
              {s.label}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
