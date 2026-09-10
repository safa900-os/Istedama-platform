import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Users, Monitor, Wifi, Mic, CheckCircle2, AlertCircle,
  User, Phone, Mail, Building2, Calendar, Clock, FileText
} from 'lucide-react';
import api from '../api/axios';
import SectionHead from '../components/SectionHead';
import MotionCard from '../components/ui/MotionCard';
import Modal from '../components/ui/Modal';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import Field from '../components/ui/Field';
import { useLanguage } from '../context/LanguageContext';
import { staggerList, riseItem } from '../motion/variants';

const TYPES = ['all', 'meeting', 'delegation', 'training', 'conference', 'business_centre'];
const EXTRAS = [
  { id: 'catering', key: 'fac.extraCatering', rate: 5 },
  { id: 'av', key: 'fac.extraAv', rate: 8 },
  { id: 'recording', key: 'fac.extraRecording', rate: 6 },
  { id: 'interpretation', key: 'fac.extraInterpretation', rate: 15 }
];

const EMPTY = {
  fullName: '', phone: '', email: '', orgName: '',
  bookingDate: '', attendees: '', startTime: '', endTime: '', purpose: ''
};

export default function Facilities() {
  const { t, pick, fmt } = useLanguage();
  const [facilities, setFacilities] = useState([]);
  const [type, setType] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  // The facility whose details panel is open. Separate from `selected`, which
  // drives the booking form — a reader may want to read about a room without
  // starting to book it.
  const [details, setDetails] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [extras, setExtras] = useState([]);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .get('/content/facilities', { params: { type: type === 'all' ? undefined : type } })
      .then((res) => setFacilities(res.data.data))
      .catch(() => setFacilities([]))
      .finally(() => setLoading(false));
  }, [type]);

  const visible = useMemo(() => {
    if (!query.trim()) return facilities;
    const q = query.toLowerCase();
    return facilities.filter(
      (f) => pick(f, 'name').toLowerCase().includes(q) || pick(f, 'description').toLowerCase().includes(q)
    );
  }, [facilities, query, pick]);

  // Live estimate: hall rate × hours, plus any per-hour extras.
  const hours = useMemo(() => {
    if (!form.startTime || !form.endTime) return 0;
    const [sh, sm] = form.startTime.split(':').map(Number);
    const [eh, em] = form.endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
  }, [form.startTime, form.endTime]);

  const estimate = useMemo(() => {
    if (!selected || !hours) return 0;
    const extraRate = EXTRAS.filter((e) => extras.includes(e.id)).reduce((s, e) => s + e.rate, 0);
    return Math.round((selected.pricePerHour + extraRate) * hours * 100) / 100;
  }, [selected, hours, extras]);

  const openBooking = (facility) => {
    setSelected(facility);
    setForm(EMPTY);
    setExtras([]);
    setError('');
    setDone(false);
  };

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (hours <= 0) {
      setError(t('fac.errorTime'));
      return;
    }
    setSending(true);
    try {
      await api.post('/content/bookings', {
        facilityId: selected._id,
        ...form,
        attendees: Number(form.attendees),
        extras,
        estimatedCost: estimate
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.details?.join('، ') || err.response?.data?.message || 'Error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {/* ------------------------------------------------------------ hero */}
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-14 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
          <SectionHead eyebrow={t('fac.eyebrow')} title={t('fac.title')} lead={t('fac.lead')} />

          {/* The counters are derived from the facilities actually loaded, not
              written down — a hard-coded "12+" would drift the moment a room
              was added or retired. */}
          <aside className="card-pad">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy-700 text-white">
              <Building2 size={24} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-xl font-black text-navy-900">
              {t('fac.heroCardTitle')}
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{t('fac.heroCardBody')}</p>

            <dl className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-mist/70 p-4 text-center">
                <dt className="sr-only">{t('fac.statFacilities')}</dt>
                <dd>
                  <span className="block font-display text-2xl font-black text-navy-700">
                    {fmt(facilities.length)}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">{t('fac.statFacilities')}</span>
                </dd>
              </div>
              <div className="rounded-2xl bg-mist/70 p-4 text-center">
                <dt className="sr-only">{t('fac.statTypes')}</dt>
                <dd>
                  <span className="block font-display text-2xl font-black text-navy-700">
                    {fmt(new Set(facilities.map((f) => f.type)).size)}
                  </span>
                  <span className="mt-1 block text-xs text-ink-muted">{t('fac.statTypes')}</span>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((ty) => (
              <motion.button
                key={ty}
                whileTap={{ scale: 0.95 }}
                onClick={() => setType(ty)}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  type === ty ? 'text-white' : 'border border-rule bg-surface text-ink-muted hover:text-navy-700'
                }`}
              >
                {type === ty && (
                  <motion.span layoutId="fac-filter" className="absolute inset-0 rounded-full bg-navy-700"
                    transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
                )}
                <span className="relative">{t(ty === 'all' ? 'fac.all' : `fac.${ty}`)}</span>
              </motion.button>
            ))}
          </div>

          <div className="flex w-full items-center gap-2 rounded-md border border-rule bg-surface px-3 py-2 lg:w-72">
            <Search size={15} className="shrink-0 text-ink-soft" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('fac.search')}
              aria-label={t('fac.search')}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {[0, 1].map((i) => <div key={i} className="h-64 animate-pulse rounded-xl border border-rule bg-surface" />)}
          </div>
        ) : visible.length === 0 ? (
          <p className="mt-10 text-sm text-ink-muted">{t('fac.empty')}</p>
        ) : (
          <motion.div key={type} variants={staggerList} initial="hidden" animate="show" className="mt-8 grid gap-5 md:grid-cols-2">
            {visible.map((f) => (
              <MotionCard key={f._id} className="flex flex-col">
                {/*
                  The room's own photograph, taken from the programme's
                  facilities page. The drawn band is kept as the fallback for a
                  room with no photograph, so a facility added later without
                  one does not render a broken image.
                */}
                <div className="relative h-40 overflow-hidden bg-navy-800">
                  {f.image ? (
                    <img
                      src={f.image}
                      alt={pick(f, 'name')}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <svg viewBox="0 0 400 128" className="absolute inset-0 h-full w-full" aria-hidden="true">
                      <defs>
                        <linearGradient id={`g-${f._id}`} x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#223E98" />
                          <stop offset="100%" stopColor="#14255C" />
                        </linearGradient>
                      </defs>
                      <rect width="400" height="128" fill={`url(#g-${f._id})`} />
                      <g opacity="0.16" fill="none" stroke="#fff" strokeWidth="1.5">
                        {Array.from({ length: 9 }, (_, i) => (
                          <circle key={i} cx={40 + i * 42} cy={64} r={14 + (i % 3) * 6} />
                        ))}
                      </g>
                    </svg>
                  )}
                  <span className={`absolute end-3 top-3 ${f.available ? 'pill-ok' : 'pill-wait'}`}>
                    {f.available ? t('fac.available') : t('fac.unavailable')}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{t(`fac.${f.type}`)}</p>
                      <h3 className="mt-1 font-display text-lg font-bold text-navy-900">{pick(f, 'name')}</h3>
                    </div>
                    <div className="shrink-0 text-end">
                      <p className="font-mono text-xl font-bold text-navy-900">{fmt(f.pricePerHour)}</p>
                      <p className="text-[11px] text-ink-soft">{t('fac.perHour')}</p>
                    </div>
                  </div>

                  <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{pick(f, 'description')}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="pill bg-canvas text-ink-muted"><Users size={12} /> {fmt(f.capacity)}</span>
                    {(pick(f, 'features') || f.features || []).slice(0, 2).map((feat, i) => (
                      <span key={feat} className="pill bg-canvas text-ink-muted">
                        {i === 0 ? <Monitor size={12} /> : <Wifi size={12} />} {feat}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-rule pt-4">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      disabled={!f.available}
                      onClick={() => openBooking(f)}
                      className="btn-primary flex-1 disabled:cursor-not-allowed"
                    >
                      {t('fac.bookNow')}
                    </motion.button>
                    {/* This button had no handler at all — it looked like a
                        control and did nothing when pressed. */}
                    <button
                      type="button"
                      onClick={() => setDetails(f)}
                      className="btn-quiet flex-1"
                    >
                      {t('fac.details')}
                    </button>
                  </div>
                </div>
              </MotionCard>
            ))}
          </motion.div>
        )}
      </section>

      {/* Booking modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title={t('fac.bookingTitle')} size="lg">
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="py-8 text-center">
              <CheckCircle2 size={46} className="mx-auto text-teal-600" strokeWidth={1.8} />
              <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{t('fac.successTitle')}</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{t('fac.successBody')}</p>
              <button onClick={() => setSelected(null)} className="btn-quiet mt-6">{t('detail.back')}</button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <p className="text-sm text-ink-muted">{t('fac.bookingLead')}</p>

              {/*
                Said before the form, not after it. Someone filling in a date
                and a time reasonably assumes they are reserving the room; the
                request is reviewed for availability first, and finding that
                out only on the confirmation screen is too late to be fair.
              */}
              <div className="flex items-start gap-3 rounded-2xl border border-gold-200 bg-gold-50 p-4">
                <AlertCircle
                  size={18}
                  className="mt-0.5 shrink-0 text-gold-600"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-bold text-gold-700">{t('fac.reviewNoticeTitle')}</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-gold-700/90">
                    {t('fac.reviewNotice')}
                  </p>
                </div>
              </div>

              {/* What happens to the request, in the same three lines the
                  programme's own booking page states. */}
              <dl className="grid gap-2 rounded-2xl bg-mist/70 p-4 text-[13px] sm:grid-cols-3">
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-ink-muted">{t('fac.requestType')}</dt>
                  <dd className="font-bold text-ink sm:mt-1">{t('fac.requestTypeValue')}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-ink-muted">{t('fac.requestState')}</dt>
                  <dd className="font-bold text-ink sm:mt-1">{t('fac.requestStateValue')}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-ink-muted">{t('fac.confirmBy')}</dt>
                  <dd className="font-bold text-ink sm:mt-1">{t('fac.confirmChannel')}</dd>
                </div>
              </dl>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field
                  id="b-name" icon={User} required label={t('fac.fullName')}
                  value={form.fullName} onChange={update('fullName')}
                />
                <Field
                  id="b-phone" icon={Phone} required dir="ltr" placeholder="91234567"
                  label={t('fac.phone')} value={form.phone} onChange={update('phone')}
                />
                <Field
                  id="b-email" icon={Mail} type="email" required dir="ltr"
                  label={t('fac.email')} value={form.email} onChange={update('email')}
                />
                <Field
                  id="b-org" icon={Building2} label={t('fac.orgName')}
                  value={form.orgName} onChange={update('orgName')}
                />
                <Field
                  id="b-date" icon={Calendar} type="date" required dir="ltr"
                  label={t('fac.date')} value={form.bookingDate} onChange={update('bookingDate')}
                />
                <Field
                  id="b-att" icon={Users} type="number" min="1" max={selected?.capacity} required dir="ltr"
                  label={t('fac.attendees')} value={form.attendees} onChange={update('attendees')}
                  hint={selected ? `${t('fac.capacity')}: ${selected.capacity}` : undefined}
                />
                <Field
                  id="b-start" icon={Clock} type="time" required dir="ltr"
                  label={t('fac.startTime')} value={form.startTime} onChange={update('startTime')}
                />
                <Field
                  id="b-end" icon={Clock} type="time" required dir="ltr"
                  label={t('fac.endTime')} value={form.endTime} onChange={update('endTime')}
                />
              </div>

              <Field
                as="textarea" id="b-purpose" icon={FileText} required rows={3}
                label={t('fac.purpose')} value={form.purpose} onChange={update('purpose')}
                hint={t('fac.purposeHint')}
              />

              <fieldset>
                <legend className="label">{t('fac.extras')}</legend>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {EXTRAS.map((ex) => (
                    <AnimatedCheckbox
                      key={ex.id}
                      id={`ex-${ex.id}`}
                      checked={extras.includes(ex.id)}
                      onChange={(on) => setExtras((prev) => (on ? [...prev, ex.id] : prev.filter((x) => x !== ex.id)))}
                      label={t(ex.key)}
                      hint={`+${fmt(ex.rate)} / ${t('fac.perHour')}`}
                      className="rounded-lg border border-rule p-3 transition-colors hover:border-navy-300"
                    />
                  ))}
                </div>
              </fieldset>

              {/* Live estimate */}
              <AnimatePresence>
                {estimate > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-3">
                      <span className="text-sm font-medium text-navy-800">
                        {t('fac.estimated')} · {fmt(hours, { maximumFractionDigits: 1 })} h
                      </span>
                      <motion.span
                        key={estimate}
                        initial={{ scale: 1.15 }}
                        animate={{ scale: 1 }}
                        className="font-mono text-lg font-bold text-navy-900"
                      >
                        {fmt(estimate)} OMR
                      </motion.span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setSelected(null)} className="btn-quiet flex-1">{t('wiz.back')}</button>
                <button type="submit" disabled={sending} className="btn-primary flex-[2]">
                  {sending ? t('fac.submitting') : t('fac.submit')}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </Modal>

      {/*
        The details panel behind "view details", which until now was a button
        with no handler — it looked like a control and did nothing.

        Everything here is already on the facility record; the card simply had
        no room for it. The photograph runs full width, the rate is stated with
        what it does and does not include, and every listed feature appears
        rather than the first two the card can fit.
      */}
      <Modal
        open={!!details}
        onClose={() => setDetails(null)}
        title={t('fac.detailsTitle')}
        size="lg"
      >
        {details && (
          <div className="space-y-6">
            {details.image && (
              <img
                src={details.image}
                alt={pick(details, 'name')}
                className="h-56 w-full rounded-2xl object-cover"
              />
            )}

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">
                  {t(`fac.${details.type}`)}
                </p>
                <h3 className="mt-1 font-display text-2xl font-black text-navy-900">
                  {pick(details, 'name')}
                </h3>
              </div>
              <span className={details.available ? 'pill-ok' : 'pill-wait'}>
                {details.available ? t('fac.available') : t('fac.unavailable')}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-black text-navy-900">{t('fac.aboutRoom')}</h4>
              <p className="mt-2 text-sm leading-loose text-ink-muted">
                {pick(details, 'description')}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-mist/70 p-4">
                <p className="flex items-center gap-2 text-sm font-black text-navy-900">
                  <Users size={15} aria-hidden="true" />
                  {t('fac.capacityFull', { count: fmt(details.capacity) })}
                </p>
              </div>
              <div className="rounded-2xl bg-mist/70 p-4">
                <p className="font-display text-xl font-black text-navy-900">
                  {fmt(details.pricePerHour)} <span className="text-sm">{t('fac.perHour')}</span>
                </p>
                {/* The estimate on the booking form adds the extras on top, so
                    the rate is labelled rather than left to be assumed total. */}
                <p className="mt-1 text-[11px] leading-relaxed text-ink-soft">
                  {t('fac.rateNote')}
                </p>
              </div>
            </div>

            {(pick(details, 'features') || details.features || []).length > 0 && (
              <div>
                <h4 className="text-sm font-black text-navy-900">{t('fac.equipment')}</h4>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {(pick(details, 'features') || details.features || []).map((feat) => (
                    <li key={feat} className="pill bg-navy-50 text-navy-700">
                      <CheckCircle2 size={12} aria-hidden="true" /> {feat}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap gap-3 border-t border-rule pt-5">
              {details.available ? (
                <button
                  type="button"
                  onClick={() => {
                    const room = details;
                    setDetails(null);
                    openBooking(room);
                  }}
                  className="btn-primary flex-1"
                >
                  {t('fac.detailsBook')}
                </button>
              ) : (
                <p className="flex-1 text-sm text-ink-muted">{t('fac.unavailableNote')}</p>
              )}
              <button type="button" onClick={() => setDetails(null)} className="btn-quiet">
                {t('detail.back')}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/*
        How a booking actually proceeds. The programme's facilities page sets
        this out in four steps and the platform did not say it anywhere — a
        visitor pressing "book" had no way to know the request is reviewed
        before anything is confirmed.
      */}
      <section className="border-t border-rule bg-navy-50/60">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <SectionHead eyebrow={t('fac.stepsEyebrow')} title={t('fac.stepsTitle')} center />

          <motion.ol
            variants={staggerList}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-60px' }}
            className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[1, 2, 3, 4].map((n) => (
              <motion.li key={n} variants={riseItem} className="card-pad h-full">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy-700 font-display text-sm font-black text-white">
                  {fmt(n)}
                </span>
                <h3 className="mt-5 font-display text-base font-black text-navy-900">
                  {t(`fac.step${n}Title`)}
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">
                  {t(`fac.step${n}Body`)}
                </p>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>
    </div>
  );
}
