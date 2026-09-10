import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Building2, Users, ShieldCheck, ArrowRight, ArrowLeft, BarChart3,
  Boxes, ClipboardList, FileCheck2, Award, CalendarDays, MapPin
} from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import SectionHead from '../components/SectionHead';
import Reveal from '../components/Reveal';
import ImpactBand from '../components/ImpactBand';
import NewsStrip from '../components/NewsStrip';
import PartnerStrip from '../components/PartnerStrip';
import PromoReel from '../components/promo/PromoReel';
import ChairmanWord from '../components/ChairmanWord';
import ProgrammeBenefits from '../components/ProgrammeBenefits';
import CertificateSteps from '../components/CertificateSteps';
import GccChambers from '../components/GccChambers';
import Vision2040 from '../components/Vision2040';
import VisitorStats from '../components/VisitorStats';
import CertifiedDirectoryCta from '../components/CertifiedDirectoryCta';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp, scaleIn, stagger, inView, EASE } from '../motion/presets';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [tenders, setTenders] = useState([]);
  const { t, fmt, pick, isRTL, lang } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    api.get('/companies/stats/overview').then((r) => setStats(r.data.data)).catch(() => setStats(null));
    api.get('/content/tenders', { params: { limit: 3 } }).then((r) => setTenders(r.data.data.slice(0, 3))).catch(() => setTenders([]));
  }, []);

  const weights = [
    { label: t('home.weightOmanization'), pct: 60, bar: 'bg-navy-700' },
    { label: t('home.weightFinancial'), pct: 30, bar: 'bg-navy-400' },
    { label: t('home.weightIcv'), pct: 10, bar: 'bg-gold-500' }
  ];

  const steps = [
    { icon: ClipboardList, title: t('home.step1Title'), body: t('home.step1Body') },
    { icon: FileCheck2, title: t('home.step2Title'), body: t('home.step2Body') },
    { icon: Award, title: t('home.step3Title'), body: t('home.step3Body') }
  ];

  const fmtDate = (iso) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      .format(new Date(iso));

  return (
    <div className="pb-4">
      {/* ---------------------------------------------------------- Hero */}
      <section className="px-3 pt-5 sm:px-5">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative overflow-hidden rounded-4xl border border-white/80 bg-wash-hero px-6 py-12 shadow-card sm:px-12 sm:py-16"
          >
            {/* The reel takes the larger half now. The split favoured the
                headline when this column held a seal; a 16:9 film needs the
                width more than the paragraph does. */}
            <div className="grid items-center gap-10 lg:grid-cols-[1fr,1.15fr]">
              <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
                <motion.p variants={fadeUp} className="eyebrow">{t('home.heroEyebrow')}</motion.p>

                <motion.h1
                  variants={fadeUp}
                  className="mt-4 font-display text-[2.6rem] font-black leading-[1.15] tracking-tight text-navy-900 sm:text-[3.4rem]"
                >
                  {t('home.title1')}{' '}
                  <span className="relative inline-block text-navy-700">
                    {t('home.title2')}
                    <motion.svg
                      className="absolute -bottom-2 left-0 h-3 w-full text-gold-400"
                      viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true"
                    >
                      <motion.path
                        d="M3,8 C55,2 145,2 197,7" stroke="currentColor" strokeWidth="4"
                        fill="none" strokeLinecap="round"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                        transition={{ duration: 0.9, delay: 0.5, ease: EASE }}
                      />
                    </motion.svg>
                  </span>
                </motion.h1>

                <motion.p variants={fadeUp} className="mt-7 max-w-xl text-[17px] leading-loose text-ink-muted">
                  {t('home.subtitle')}
                </motion.p>

                {/* One orange action per view: registering is the page's whole point */}
                <motion.div variants={fadeUp} className="mt-10 flex flex-wrap gap-3">
                  <Link to="/register" className="btn-accent">
                    {t('home.ctaRegister')} <Arrow size={16} strokeWidth={2.4} />
                  </Link>
                  <Link to="/about" className="btn-quiet">{t('home.ctaLearn')}</Link>
                </motion.div>
              </motion.div>

              {/*
                Seal with floating info chips.

                The chips sit in a reserved gutter around the seal panel rather
                than floating over it: the score is the point of the panel, so
                nothing is allowed to cover it. Each chip is anchored to a
                corner outside the panel's edge, and the wrapper carries the
                matching padding so they never clip or collide.
              */}
              <motion.div
                variants={scaleIn}
                initial="hidden"
                animate="show"
                /* Wider and barely padded: this column held a 26rem seal
                   before, and the reel was being squeezed into the same slot
                   with the seal's generous gutters still around it. The chips
                   still need room to sit outside the frame, so the padding is
                   trimmed rather than removed. */
                className="relative mx-auto w-full max-w-[44rem] px-2 pb-12 pt-10 sm:px-4"
              >
                {/*
                  The promo reel, not the sample seal.

                  The reel's third scene is the three pillars — measure, verify,
                  grow — and it had a whole section of its own further down the
                  page saying exactly that. The programme's own home page puts
                  the film here, beside the headline, and that is the one place
                  it belongs: it is the introduction, so it should play while
                  the introduction is being read rather than a screen later.
                */}
                <div className="overflow-hidden rounded-4xl bg-mist/70 p-2 shadow-card sm:p-2.5">
                  <PromoReel />
                </div>

                {/* top, clear of the panel */}
                <motion.div
                  className="absolute end-0 top-0 chip animate-float"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5, ease: EASE }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-white">
                    <BarChart3 size={14} />
                  </span>
                  <span className="whitespace-nowrap">{t('home.chipReports')}</span>
                </motion.div>

                {/* bottom, clear of the panel */}
                <motion.div
                  className="absolute bottom-0 start-0 chip animate-float-slow"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.5, ease: EASE }}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold-500 text-navy-900">
                    <Boxes size={14} />
                  </span>
                  <span className="whitespace-nowrap">{t('home.chipIcv')}</span>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------- Stats */}
      <section className="mx-auto max-w-[1400px] px-3 py-14 sm:px-5">
        <motion.div variants={stagger(0.09)} initial="hidden" whileInView="show" viewport={inView} className="grid gap-5 sm:grid-cols-3">
          <StatCard icon={Building2} label={t('home.statCompanies')} numeric={stats?.totalCompanies ?? 0} accent="navy" i={0} />
          <StatCard icon={Users} label={t('home.statOmanization')} numeric={stats?.avgOmanizationRate ?? 0} suffix="%" sublabel={t('home.statOmanizationSub')} accent="teal" i={1} />
          <StatCard icon={ShieldCheck} label={t('home.statThreshold')} value={`${fmt(70)}/${fmt(100)}`} sublabel={t('home.statThresholdSub')} accent="gold" i={2} />
        </motion.div>
      </section>

      {/* ------------------------------------------------ Score method */}
      <section className="mx-auto max-w-[1400px] px-3 pb-16 sm:px-5">
        <div className="block-shell grid gap-12 p-7 sm:p-12 lg:grid-cols-2 lg:items-center">
          <SectionHead eyebrow={t('home.formulaTitle')} title={t('home.trustTitle')} lead={t('home.trustBody')} />
          <Reveal className="card-pad">
            <ul className="space-y-7">
              {weights.map((w, i) => (
                <li key={w.label}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm font-bold text-ink">{w.label}</span>
                    <span className="font-display text-lg font-black text-navy-700">{fmt(w.pct)}%</span>
                  </div>
                  <div className="mt-2.5 h-2.5 overflow-hidden rounded-full bg-mist">
                    <motion.div
                      className={`h-full rounded-full ${w.bar}`}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${w.pct}%` }}
                      viewport={inView}
                      transition={{ duration: 0.9, delay: i * 0.14, ease: EASE }}
                    />
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-7 border-t border-rule pt-5 text-xs leading-relaxed text-ink-muted">
              {t('home.thresholdNote')}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ Latest tenders */}
      {tenders.length > 0 && (
        <section className="mx-auto max-w-[1400px] px-3 pb-16 sm:px-5">
          <SectionHead eyebrow={t('tenders.eyebrow')} title={t('tenders.homeTitle')} center />
          <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={inView} className="mt-10 grid gap-5 md:grid-cols-3">
            {tenders.map((tn, i) => (
              <motion.article key={tn._id} variants={fadeUp} custom={i} whileHover={{ y: -8 }} transition={{ duration: 0.3, ease: EASE }} className="card flex flex-col p-6 hover:shadow-lift">
                <div className="flex items-center justify-between">
                  <span className="pill-info">{t(`tenders.${tn.category}`)}</span>
                  <span className="font-mono text-sm font-bold text-ink-soft">#{fmt(tn.refNo)}</span>
                </div>
                <h3 className="mt-4 font-display text-lg font-black leading-snug text-navy-900">{pick(tn, 'title')}</h3>
                <p className="mt-2 text-sm text-ink-muted">{pick(tn, 'orgName')}</p>
                <div className="mt-4 space-y-2 text-xs text-ink-muted">
                  <p className="flex items-center gap-2"><CalendarDays size={14} className="text-navy-400" /> {fmtDate(tn.closingDate)}</p>
                  <p className="flex items-center gap-2"><MapPin size={14} className="text-navy-400" /> {pick(tn, 'location')}</p>
                </div>
                <span className={`mt-5 self-start ${tn.status === 'open' ? 'pill-wait' : 'pill-muted'}`}>
                  {t(`tenders.status${tn.status.charAt(0).toUpperCase()}${tn.status.slice(1)}`)}
                </span>
                <Link to="/tenders" className="btn-quiet mt-5 w-full !py-2.5 text-xs">
                  {t('tenders.viewDetails')} <Arrow size={13} />
                </Link>
              </motion.article>
            ))}
          </motion.div>
          <Reveal className="mt-8 text-center">
            <Link to="/tenders" className="btn-ghost">{t('tenders.viewAll')} <Arrow size={15} /></Link>
          </Reveal>
        </section>
      )}

      {/* --------------------------------------------- Chairman's word */}
      <ChairmanWord />

      {/* ---------------------------------------- Programme benefits */}
      <ProgrammeBenefits />

      {/* ------------------------------------------------- Impact band */}
      <ImpactBand />

      {/* ------------------------------------- Steps to the certificate */}
      <CertificateSteps />

      {/* ------------------------------------------- Oman Vision 2040 */}
      <Vision2040 />

      {/* -------------------------- Directory of certified enterprises */}
      <CertifiedDirectoryCta />

      {/* ----------------------------------------------------- Process */}
      <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
        <SectionHead eyebrow={t('home.step')} title={t('home.howTitle')} center />
        <motion.div variants={stagger(0.1)} initial="hidden" whileInView="show" viewport={inView} className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div key={step.title} variants={fadeUp} custom={i} whileHover={{ y: -8 }} transition={{ duration: 0.3, ease: EASE }} className="card-pad relative overflow-hidden hover:shadow-lift">
              <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-700 text-white shadow-pill">
                <step.icon size={22} strokeWidth={2} />
              </span>
              <h3 className="relative mt-5 font-display text-xl font-black text-navy-900">{step.title}</h3>
              <p className="relative mt-3 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---------------------------------------------------- Partners */}
      <PartnerStrip />

      {/* ------------------------------------------- GCC chamber network */}
      <GccChambers />

      {/* ------------------------------------------- Site audience figures */}
      <VisitorStats />

      {/* -------------------------------------------------------- News */}
      <NewsStrip />

      {/* --------------------------------------------------------- CTA */}
      <section className="mx-auto max-w-[1400px] px-3 pb-16 sm:px-5">
        <Reveal>
          <div className="relative overflow-hidden rounded-4xl bg-wash-navy px-8 py-14 text-center shadow-lift sm:px-14">
            <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-gold-500/10 blur-3xl" />
            <h2 className="relative font-display text-[1.8rem] font-black tracking-tight text-white sm:text-[2.3rem]">
              {t('home.ctaTitle')}
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl leading-relaxed text-navy-100">{t('home.ctaBody')}</p>
            <div className="relative mt-9 flex flex-wrap justify-center gap-3">
              <Link to="/register" className="btn-accent">
                {t('home.ctaRegister')} <Arrow size={16} strokeWidth={2.4} />
              </Link>
              <Link to="/contact" className="btn rounded-full border border-white/25 text-white hover:bg-white/10">
                {t('nav.contact')}
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
