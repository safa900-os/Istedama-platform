import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Wallet, Factory, ShieldCheck, Building2, Award, Clock, Network,
  BarChart3, Leaf, Database, Target, PackageSearch, Handshake,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import api from '../api/axios';
import SectionHead from '../components/SectionHead';
import StatCard from '../components/StatCard';
import ScoreSeal from '../components/ScoreSeal';
import { useLanguage } from '../context/LanguageContext';
import { fadeUp, stagger, inView } from '../motion/presets';

/**
 * About the programme.
 *
 * The page previously carried a third of what the programme's own "عن استدامة"
 * material says: it opened straight into the scoring methodology, with no
 * account of what Istedama is, what it is trying to achieve, or what it says it
 * stands for. Those three sections — what it is, the objectives, the values —
 * are restored here in the programme's own words.
 *
 * Two headings were also being printed twice each: `SectionHead` was handed the
 * same string as both its eyebrow and its title, so "الحوكمة والنزاهة" and
 * "البرنامج بالأرقام" each appeared stacked on top of themselves. The eyebrow
 * now names the theme and the heading names the section.
 */
export default function About() {
  const { t, fmt, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/companies/stats/overview')
      .then((res) => setStats(res.data.data))
      .catch(() => setStats(null));
  }, []);

  const measures = [
    { icon: Users, weight: 60, title: t('about.m1Title'), body: t('about.m1Body'), accent: 'bg-navy-700' },
    { icon: Wallet, weight: 30, title: t('about.m2Title'), body: t('about.m2Body'), accent: 'bg-navy-400' },
    { icon: Factory, weight: 10, title: t('about.m3Title'), body: t('about.m3Body'), accent: 'bg-gold-500' }
  ];

  const governance = [t('about.g1'), t('about.g2'), t('about.g3'), t('about.g4')];

  /*
    Each point gets the icon that means it — a clock for speed, a network for
    the connections, a shield for trustworthy data. Three identical ticks said
    only "this is a list", which the bullet already said.
  */
  const highlights = [
    { icon: Clock, text: t('about.whatB1') },
    { icon: Network, text: t('about.whatB2') },
    { icon: ShieldCheck, text: t('about.whatB3') }
  ];

  const objectives = [
    { icon: BarChart3, title: t('about.obj1Title'), body: t('about.obj1Body') },
    { icon: Leaf, title: t('about.obj2Title'), body: t('about.obj2Body') },
    { icon: Database, title: t('about.obj3Title'), body: t('about.obj3Body') },
    { icon: Target, title: t('about.obj4Title'), body: t('about.obj4Body') },
    { icon: PackageSearch, title: t('about.obj5Title'), body: t('about.obj5Body') },
    { icon: Handshake, title: t('about.obj6Title'), body: t('about.obj6Body') }
  ];

  /*
   * The programme's published headline figures, transcribed from its own
   * material. Kept as numbers with a separate suffix so the language
   * formatter renders the digits — «٥٠٠٠+» in Arabic, not a literal string
   * that would stay Latin whatever the reader chose.
   */
  const published = [
    { value: 5000, suffix: '+', label: t('about.imp1Label') },
    { value: 120, suffix: '+', label: t('about.imp2Label') },
    { value: 40, suffix: '+', label: t('about.imp3Label') },
    { value: 95, suffix: '%', label: t('about.imp4Label') }
  ];

  const values = [
    { title: t('about.val1Title'), body: t('about.val1Body') },
    { title: t('about.val2Title'), body: t('about.val2Body') },
    { title: t('about.val3Title'), body: t('about.val3Body') },
    { title: t('about.val4Title'), body: t('about.val4Body') }
  ];

  return (
    <div>
      {/* ------------------------------------------------- page header */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="eyebrow">{t('home.heroEyebrow')}</p>
          <h1 className="mt-3 font-display text-[2.25rem] font-black tracking-tight text-navy-900 sm:text-[2.75rem]">
            {t('about.title')}
          </h1>
          <div className="mt-4 h-[3px] w-14 rounded bg-gold-500" />
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-ink-muted">{t('about.lead')}</p>
        </div>
      </section>

      {/* ------------------------------------------------- who we are */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHead
          eyebrow={t('about.whoEyebrow')}
          title={t('about.whoTitle')}
          lead={t('about.whoLead')}
          center
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <motion.article
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="card-pad"
          >
            <h2 className="font-display text-2xl font-black text-navy-900">{t('about.whatTitle')}</h2>
            <p className="mt-5 leading-loose text-ink-muted">{t('about.whatP1')}</p>
            <p className="mt-4 leading-loose text-ink-muted">{t('about.whatP2')}</p>

            <ul className="mt-7 space-y-3">
              {highlights.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="group flex items-start gap-3.5 rounded-2xl border border-gold-200/70 bg-surface p-4 transition-colors duration-300 hover:border-gold-400 hover:bg-gold-50/50"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold-50 text-gold-600 ring-1 ring-gold-200 transition-colors duration-300 group-hover:bg-gold-100">
                    <Icon size={17} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="self-center text-sm font-bold leading-relaxed text-navy-900">{text}</span>
                </li>
              ))}
            </ul>
          </motion.article>

          <motion.article
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={inView}
            className="relative min-h-[24rem] overflow-hidden rounded-2xl bg-navy-900 shadow-card"
          >
            {/*
              The picture carries this panel now. It was an icon on a plain navy
              field describing a national system in words — the illustration
              shows the thing the words were reaching for, so the words move on
              top of it and stop working alone.
            */}
            <img
              src="/about/unified-platform.jpg"
              alt={t('about.systemAlt')}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Scrim so the copy holds its contrast wherever the art is light. */}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/70 to-navy-900/10"
            />

            <div className="relative flex h-full flex-col justify-end p-8 sm:p-10">
              <h3 className="font-display text-2xl font-black text-white">{t('about.systemTitle')}</h3>
              <p className="mt-3 max-w-md text-[15px] leading-loose text-navy-100">
                {t('about.systemBody')}
              </p>
            </div>
          </motion.article>
        </div>
      </section>

      {/* --------------------------------------------- vision & mission */}
      <section className="border-y border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="card-pad">
              <h2 className="font-display text-xl font-bold text-navy-900">{t('about.visionTitle')}</h2>
              <div className="mt-3 h-[3px] w-10 rounded bg-gold-500" />
              <p className="mt-4 leading-loose text-ink-muted">{t('about.visionBody')}</p>
            </div>
            <div className="card-pad">
              <h2 className="font-display text-xl font-bold text-navy-900">{t('about.missionTitle')}</h2>
              <div className="mt-3 h-[3px] w-10 rounded bg-navy-700" />
              <p className="mt-4 leading-loose text-ink-muted">{t('about.missionBody')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- objectives */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHead eyebrow={t('about.objEyebrow')} title={t('about.objTitle')} center />

        <motion.ul
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {objectives.map((o, i) => (
            <motion.li
              key={o.title}
              variants={fadeUp}
              custom={i % 3}
              className="card-pad h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                  i % 3 === 1 ? 'bg-accent-500' : 'bg-navy-700'
                }`}
              >
                <o.icon size={21} strokeWidth={1.9} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-black text-navy-900">{o.title}</h3>
              <p className="mt-3 text-sm leading-loose text-ink-muted">{o.body}</p>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      {/* ------------------------------------------- assessment method */}
      <section className="border-y border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHead eyebrow={t('home.formulaTitle')} title={t('about.methodTitle')} lead={t('about.methodBody')} />

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {measures.map((m) => (
              <article key={m.title} className="card overflow-hidden">
                <div className={`h-1 w-full ${m.accent}`} />
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-canvas text-navy-700">
                      <m.icon size={19} strokeWidth={2} />
                    </span>
                    <span className="font-mono text-2xl font-bold text-navy-900">{fmt(m.weight)}%</span>
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-navy-900">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{m.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------- values */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="relative overflow-hidden rounded-4xl bg-wash-navy p-8 shadow-lift sm:p-12"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -start-24 h-80 w-80 rounded-full border border-white/10"
          />
          <div className="relative grid gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div>
              <p className="eyebrow !text-navy-200">{t('about.valuesEyebrow')}</p>
              <h2 className="mt-3 font-display text-[1.8rem] font-black leading-tight text-white sm:text-[2.2rem]">
                {t('about.valuesTitle')}
              </h2>
              <p className="mt-5 leading-loose text-navy-100">{t('about.valuesLead')}</p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <li
                  key={v.title}
                  className="rounded-2xl bg-white/[0.08] p-5 ring-1 ring-white/15 backdrop-blur-sm"
                >
                  <p className="font-display text-lg font-black text-white">{v.title}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-navy-100">{v.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      </section>

      {/*
        ------------------------------------------- published impact figures

        These are the programme's own published numbers, and one of them —
        enterprises served — answers the same question as the live company
        count further down this page. Rather than print two totals and leave a
        reader to guess, the block says outright which kind of number it is and
        points at the other. The live panel keeps the last word.
      */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <SectionHead
          eyebrow={t('about.impactEyebrow')}
          title={t('about.impactTitle')}
          center
        />

        <motion.dl
          variants={stagger(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {published.map((s, i) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              custom={i}
              /*
                Reversed so the figure reads above its label without the label
                being written twice. Naming it in a visually-hidden `dt` and
                again in the `dd` made a screen reader announce every figure's
                name twice over.
              */
              className="card-pad flex flex-col-reverse text-center"
            >
              <dt className="mt-3 text-sm font-bold leading-snug text-ink-muted">{s.label}</dt>
              <dd className="font-display text-[2.1rem] font-black leading-none text-navy-700">
                {fmt(s.value)}{s.suffix}
              </dd>
            </motion.div>
          ))}
        </motion.dl>

        <p className="mx-auto mt-8 max-w-2xl text-center text-xs leading-relaxed text-ink-soft">
          {t('about.impactNote')}
        </p>
      </section>

      {/* ------------------------------------------- governance + seal */}
      <section className="border-t border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-[1.3fr,auto] lg:items-start">
            <div>
              {/* The eyebrow names the theme; the heading names the section.
                  Passing the same string to both printed it twice. */}
              <SectionHead eyebrow={t('about.governanceEyebrow')} title={t('about.governanceTitle')} />
              <ul className="mt-8 space-y-4">
                {governance.map((g) => (
                  <li key={g} className="flex items-start gap-3">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal-600" strokeWidth={2} />
                    <span className="text-sm leading-relaxed text-ink-muted">{g}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="justify-self-center">
              <ScoreSeal score={77.5} label={t('detail.score')} caption={t('home.thresholdNote')} />
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------- the programme in numbers */}
      <section className="border-t border-rule bg-canvas">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHead eyebrow={t('about.statsEyebrow')} title={t('about.statsTitle')} />
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <StatCard icon={Building2} label={t('home.statCompanies')} value={stats ? fmt(stats.totalCompanies) : '—'} accent="navy" />
            <StatCard icon={Users} label={t('home.statOmanization')} value={stats ? `${fmt(stats.avgOmanizationRate)}%` : '—'} accent="teal" />
            <StatCard icon={Award} label={t('home.statThreshold')} value={`${fmt(70)}/${fmt(100)}`} accent="gold" />
          </div>
          <div className="mt-10">
            <Link to="/register" className="btn-primary px-6 py-3">{t('home.ctaRegister')}</Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ closing invitation */}
      <section className="mx-auto max-w-7xl px-6 pb-16 pt-4">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          /*
            A warm tint with a navy voice, not a full sheet of
            saturated orange. Orange is the accent of this palette —
            one action, one status — and a whole band of it fought
            every card above it and dropped the white text to about
            3:1 against the ground.
          */
          className="relative overflow-hidden rounded-4xl border border-accent-100 bg-gradient-to-br from-accent-50 via-surface to-navy-50 px-8 py-14 text-center shadow-card sm:px-14"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -start-20 h-72 w-72 rounded-full border border-accent-200/50"
          />
          <h2 className="relative font-display text-[1.8rem] font-black tracking-tight text-navy-900 sm:text-[2.2rem]">
            {t('about.ctaTitle')}
          </h2>
          <p className="relative mx-auto mt-4 max-w-2xl leading-loose text-ink-muted">
            {t('about.ctaBody')}
          </p>
          <div className="relative mt-8">
            <Link
              to="/services"
              className="btn-accent"
            >
              {t('about.ctaAction')} <Arrow size={16} strokeWidth={2.4} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
