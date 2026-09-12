import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Leaf,
  MapPin,
  Scale,
  Wrench
} from 'lucide-react';
import api from '../api/axios';
import BidWizard from '../components/BidWizard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const STATUS_KEY = {
  open: 'tenders.statusOpen',
  evaluating: 'tenders.statusEvaluating',
  awarded: 'tenders.statusAwarded',
  closed: 'tenders.statusClosed'
};
const STATUS_CLASS = {
  open: 'bg-accent-500 text-navy-900',
  evaluating: 'bg-navy-100 text-navy-700',
  awarded: 'bg-teal-50 text-teal-700',
  closed: 'bg-canvas text-ink-soft'
};

/* A condition is shown with the glyph for what it asks of the bidder. */
const CONDITION_ICON = {
  local_content: Building2,
  sustainability: Leaf,
  technical: Wrench,
  other: Scale
};

/** A titled block. Renders nothing when the tender has no data for it. */
function Section({ title, lead, children, when = true }) {
  if (!when) return null;
  return (
    <section className="border-t border-rule pt-8">
      <h2 className="font-display text-xl font-bold text-navy-900">{title}</h2>
      {lead && <p className="mt-1.5 max-w-2xl text-sm text-ink-muted">{lead}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function TenderDetail() {
  const { id } = useParams();
  const { t, pick, fmt, lang, isRTL } = useLanguage();
  const { user } = useAuth();

  const [tender, setTender] = useState(null);
  const [bid, setBid] = useState(null);
  const [loading, setLoading] = useState(true);
  const Back = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => {
    setLoading(true);
    api
      .get(`/content/tenders/${id}`)
      .then((res) => setTender(res.data.data))
      .catch(() => setTender(null))
      .finally(() => setLoading(false));
  }, [id]);

  // The bidder's own bid, if they have started one. Anonymous visitors skip
  // this entirely rather than calling an endpoint that would only 401.
  useEffect(() => {
    if (!user) return undefined;
    let live = true;
    api
      .get(`/applications/tender/${id}/mine`)
      .then((res) => live && setBid(res.data.data))
      .catch(() => live && setBid(null));
    return () => {
      live = false;
    };
  }, [id, user]);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  /*
    Whether this tender still takes a bid. The server decides this on every
    write; the page reads the same two conditions so it never offers a form
    that would be refused.
  */
  const isOpen = useMemo(
    () => tender?.status === 'open' && new Date(tender.closingDate) >= new Date(),
    [tender]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-16">
        <div className="h-8 w-2/3 animate-pulse rounded bg-rule" />
        <div className="mt-6 h-64 animate-pulse rounded-xl border border-rule bg-surface" />
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-ink-muted">{t('td.notFound')}</p>
        <Link to="/tenders" className="btn-quiet mt-6 inline-flex">
          <Back size={16} /> {t('td.back')}
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* ---------------------------------------------------------- masthead */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <Link
            to="/tenders"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-700 hover:text-navy-900"
          >
            <Back size={15} /> {t('td.back')}
          </Link>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="pill-info">{t(`tenders.${tender.category}`)}</span>
            <span className={`pill ${STATUS_CLASS[tender.status]}`}>{t(STATUS_KEY[tender.status])}</span>
            <span className="font-mono text-sm font-bold text-ink-soft">
              {t('td.reference')} #{fmt(tender.refNo)}
            </span>
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight text-navy-900 sm:text-4xl">
            {pick(tender, 'title')}
          </h1>
          <p className="mt-2 text-ink-muted">
            {t('td.buyer')} · {pick(tender, 'orgName')}
          </p>

          <dl className="mt-7 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-rule bg-canvas p-4">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
                <CalendarClock size={14} /> {t('td.closingOn')}
              </dt>
              <dd className="mt-1.5 font-bold text-navy-900">{fmtDate(tender.closingDate)}</dd>
            </div>
            <div className="rounded-xl border border-rule bg-canvas p-4">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
                <MapPin size={14} /> {t('td.location')}
              </dt>
              <dd className="mt-1.5 font-bold text-navy-900">
                {pick(tender, 'location') || t('tenders.remote')}
              </dd>
            </div>
            <div className="rounded-xl border border-rule bg-canvas p-4">
              <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
                <Clock3 size={14} /> {t('td.duration')}
              </dt>
              <dd className="mt-1.5 font-bold text-navy-900">
                {tender.durationDays
                  ? `${fmt(tender.durationDays)} ${t('td.days')}`
                  : '—'}
              </dd>
            </div>
          </dl>

          {!isOpen && (
            <p className="mt-6 rounded-xl border border-rule bg-canvas px-4 py-3 text-sm text-ink-muted">
              {t('td.closed')}
            </p>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------ detail */}
      <div className="mx-auto max-w-5xl space-y-9 px-6 py-12">
        <Section title={t('td.scopeOfWork')} when={Boolean(pick(tender, 'description'))}>
          <p className="max-w-3xl leading-relaxed text-ink">{pick(tender, 'description')}</p>
        </Section>

        <Section
          title={t('td.evaluation')}
          lead={t('td.evaluationLead')}
          when={tender.evaluationCriteria?.length > 0}
        >
          <ul className="space-y-3">
            {tender.evaluationCriteria?.map((c) => (
              <li key={c.label}>
                <div className="flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-ink">{pick(c, 'label')}</span>
                  <span className="font-mono font-bold text-navy-700">{fmt(c.weight)}%</span>
                </div>
                {/*
                  A weight is a proportion, so it is drawn as one. Reading four
                  numbers and comparing them mentally is work the page can do.
                */}
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-navy-50">
                  <motion.div
                    className="h-full rounded-full bg-navy-700"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${c.weight}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('td.phases')} when={tender.phases?.length > 0}>
          <ol className="relative space-y-5 ps-6">
            {/* The rule is the timeline; phases are genuinely sequential here. */}
            <span className="absolute inset-y-1 start-[7px] w-px bg-rule" aria-hidden="true" />
            {tender.phases?.map((ph, i) => (
              <li key={ph.name} className="relative">
                <span className="absolute -start-6 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-navy-700 bg-surface" />
                <p className="font-bold text-navy-900">
                  {fmt(i + 1)}. {pick(ph, 'name')}
                </p>
                {ph.durationDays > 0 && (
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {fmt(ph.durationDays)} {t('td.days')}
                  </p>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <Section title={t('td.conditions')} when={tender.requirements?.length > 0}>
          <ul className="grid gap-3 sm:grid-cols-2">
            {tender.requirements?.map((r, i) => {
              const Icon = CONDITION_ICON[r.kind] || Scale;
              return (
                <li key={i} className="flex gap-3 rounded-xl border border-rule bg-surface p-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                    <Icon size={16} />
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                      {t(`td.${r.kind}`)}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink">{pick(r, 'text')}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Section>

        <Section title={t('td.boq')} lead={t('td.boqLead')} when={tender.scopeItems?.length > 0}>
          <div className="overflow-x-auto rounded-xl border border-rule">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-canvas text-xs uppercase tracking-wide text-ink-soft">
                <tr>
                  <th scope="col" className="px-4 py-3 text-start font-bold">
                    {t('td.item')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-start font-bold">
                    {t('td.unit')}
                  </th>
                  <th scope="col" className="px-4 py-3 text-end font-bold">
                    {t('td.quantity')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule bg-surface">
                {tender.scopeItems?.map((item, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 text-ink">{pick(item, 'description')}</td>
                    <td className="px-4 py-3 text-ink-muted">{item.unit || '—'}</td>
                    <td className="px-4 py-3 text-end font-mono font-bold text-navy-900">
                      {fmt(item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* ---------------------------------------------------------- bidding */}
        <section className="border-t border-rule pt-8">
          {!user ? (
            <Link to="/login" className="btn-accent">
              {t('td.signInToBid')}
            </Link>
          ) : bid && bid.status !== 'draft' ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-6">
              <p className="flex items-center gap-2 font-display text-lg font-bold text-teal-700">
                <CheckCircle2 size={18} /> {t('bid.submittedTitle')}
              </p>
              <p className="mt-1.5 text-sm text-teal-700">
                {t('td.bidSubmittedOn')} {fmtDate(bid.submittedAt || bid.updatedAt)}
              </p>
              <p className="mt-3 text-sm text-ink-muted">{t('bid.submittedBody')}</p>
            </div>
          ) : isOpen ? (
            <BidWizard tender={tender} bid={bid} onChange={setBid} />
          ) : null}
        </section>
      </div>
    </div>
  );
}
