import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  IdCard, UserRoundCheck, FileCheck2, Wallet, CalendarCheck, Handshake,
  ArrowRight, ArrowLeft, Info
} from 'lucide-react';
import SectionHead from '../components/SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp, stagger, inView, EASE } from '../motion/presets';

/**
 * Self-employment (العمل الحر) on the platform.
 *
 * A freelance-card holder is not a company: no commercial registration, no
 * staff, so no Omanization rate and no Istedama score. Half of what this
 * platform does therefore does not apply to them, and pretending otherwise on
 * a page of its own would be worse than not having the page.
 *
 * So this says two things plainly — what the platform does open to them, and
 * what it does not — and sends them to register.
 *
 * What it deliberately does NOT do is restate the Ministry of Labour's own
 * rules: which professions the card covers, what it costs, how long it lasts.
 * Those belong to the Ministry, they change, and inventing them here would put
 * false official information under a government-facing masthead. The page links
 * out for them instead.
 */

/* What a card holder can actually use today, drawn from what the platform has.
   Each `to` is a real route; none of these is aspirational. */
const OPEN_TO_THEM = [
  { icon: Handshake, key: 'free.b1', to: '/partners' },
  { icon: CalendarCheck, key: 'free.b2', to: '/facilities' },
  { icon: Wallet, key: 'free.b3', to: '/discounts' },
  { icon: FileCheck2, key: 'free.b4', to: '/tenders' }
];

const STEPS = ['free.s1', 'free.s2', 'free.s3'];

export default function Freelance() {
  const { t, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className="pb-4">
      {/* -------------------------------------------------------- masthead */}
      <section className="px-3 py-5 sm:px-5">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="rounded-4xl border border-white/80 bg-wash-hero px-6 py-12 shadow-card sm:px-12 sm:py-14"
          >
            <motion.div variants={stagger(0.09)} initial="hidden" animate="show" className="max-w-3xl">
              <motion.p variants={fadeUp} className="eyebrow">{t('free.eyebrow')}</motion.p>
              <motion.h1
                variants={fadeUp}
                className="mt-4 font-display text-[2.2rem] font-black leading-[1.15] tracking-tight text-navy-900 sm:text-[2.9rem]"
              >
                {t('free.title')}
              </motion.h1>
              <motion.p variants={fadeUp} className="mt-6 text-[17px] leading-loose text-ink-muted">
                {t('free.lead')}
              </motion.p>

              <motion.div variants={fadeUp} className="mt-9 flex flex-wrap gap-3">
                <Link
                  to="/register"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-navy-700 px-6 text-sm font-bold text-white shadow-pill transition-all hover:bg-navy-800 hover:shadow-lift"
                >
                  {t('free.cta')} <Arrow size={16} />
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex min-h-[48px] items-center rounded-full border border-rule bg-surface px-6 text-sm font-bold text-navy-700 transition-colors hover:border-navy-200 hover:bg-navy-50"
                >
                  {t('free.ask')}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------- what is open */}
      <section className="mx-auto max-w-[1400px] px-3 pb-4 pt-12 sm:px-5">
        <SectionHead eyebrow={t('free.openEyebrow')} title={t('free.openTitle')} lead={t('free.openLead')} center />

        <motion.ul
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          {OPEN_TO_THEM.map(({ icon: Icon, key, to }) => (
            <motion.li key={key} variants={fadeUp}>
              <Link
                to={to}
                className="group flex h-full flex-col rounded-3xl border border-rule bg-surface p-6 shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 ring-1 ring-navy-100 transition-transform duration-300 group-hover:scale-105">
                  <Icon size={22} strokeWidth={1.8} aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-base font-black leading-snug text-navy-900">
                  {t(`${key}t`)}
                </h3>
                <p className="mt-2 flex-1 text-[13px] leading-relaxed text-ink-muted">{t(`${key}b`)}</p>
                <span className="mt-5 flex items-center gap-1.5 text-xs font-bold text-navy-700">
                  {t('free.open')} <Arrow size={13} />
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {/* ------------------------------------------------ what does not apply */}
      <section className="mx-auto max-w-[1400px] px-3 py-12 sm:px-5">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="grid gap-5 lg:grid-cols-[1.2fr,1fr]"
        >
          {/*
            Said out loud rather than left to be discovered. A card holder who
            registers expecting a sustainability certificate and finds the score
            permanently blank has been misled by omission.
          */}
          <div className="rounded-3xl border border-accent-200 bg-accent-50/60 p-7 sm:p-9">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface text-accent-700 shadow-soft">
              <Info size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-xl font-black text-navy-900">{t('free.limitTitle')}</h2>
            <p className="mt-4 text-[15px] leading-loose text-ink-muted">{t('free.limitBody')}</p>
          </div>

          <div className="rounded-3xl border border-rule bg-surface p-7 shadow-soft sm:p-9">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
              <IdCard size={20} strokeWidth={1.9} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-xl font-black text-navy-900">{t('free.cardTitle')}</h2>
            <p className="mt-4 text-[15px] leading-loose text-ink-muted">{t('free.cardBody')}</p>
            {/*
              The Ministry owns these rules and changes them. Linking out is the
              only way this page can still be true a year from now.
            */}
            <a
              href="https://www.mol.gov.om"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-700"
            >
              {t('free.cardLink')} <Arrow size={14} />
            </a>
          </div>
        </motion.div>
      </section>

      {/* -------------------------------------------------------- how to join */}
      <section className="mx-auto max-w-[1400px] px-3 pb-16 sm:px-5">
        <div className="overflow-hidden rounded-4xl border border-rule bg-surface shadow-soft">
          <span aria-hidden="true" className="block h-1 w-full bg-gradient-to-r from-navy-700 via-navy-400 to-accent-400" />
          <div className="p-7 sm:p-10">
            <h2 className="font-display text-xl font-black text-navy-900">{t('free.stepsTitle')}</h2>

            <ol className="mt-7 grid gap-5 sm:grid-cols-3">
              {STEPS.map((key, i) => (
                <li key={key} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-700 font-display text-sm font-black text-white"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-sm font-black leading-snug text-navy-900">{t(`${key}t`)}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">{t(`${key}b`)}</p>
                  </div>
                </li>
              ))}
            </ol>

            <Link
              to="/register"
              className="mt-9 inline-flex min-h-[48px] items-center gap-2 rounded-full bg-navy-700 px-6 text-sm font-bold text-white shadow-pill transition-all hover:bg-navy-800 hover:shadow-lift"
            >
              <UserRoundCheck size={16} aria-hidden="true" /> {t('free.cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
