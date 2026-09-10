import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, UploadCloud, CheckCircle2, Sparkles } from 'lucide-react';
import api from '../api/axios';
import SectionHead from '../components/SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/variants';

const EMPTY = {
  orgName: '', applicantName: '', email: '', phone: '',
  placement: 'services_card', durationDays: 7,
  title: '', description: '', targetUrl: '', startDate: ''
};

export default function Advertise() {
  //  resolves the bilingual pair on each rate row (label / labelAr).
  const { t, fmt, pick } = useLanguage();
  const [rates, setRates] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/content/ad-rates').then((res) => setRates(res.data.data)).catch(() => setRates([]));
  }, []);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const selectedRate = useMemo(
    () => rates.find((r) => r.id === form.placement),
    [rates, form.placement]
  );

  // Rates are quoted weekly; price scales with the chosen run length.
  const quoted = useMemo(() => {
    if (!selectedRate) return 0;
    return Math.round(selectedRate.weeklyPrice * (Number(form.durationDays) / 7) * 100) / 100;
  }, [selectedRate, form.durationDays]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await api.post('/content/advertisements', {
        ...form,
        durationDays: Number(form.durationDays),
        quotedPrice: quoted
      });
      setDone(true);
      setForm(EMPTY);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.details?.join('، ') || err.response?.data?.message || 'Error');
    } finally {
      setSending(false);
    }
  };

  const minPrice = rates.length ? Math.min(...rates.map((r) => r.weeklyPrice)) : 15;

  return (
    <div>
      {/* Promotional banner — the one place in the product that uses a
          saturated gradient, because it is literally selling ad space */}
      <section className="relative overflow-hidden border-b border-rule bg-navy-800">
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 opacity-70"
          style={{ background: 'radial-gradient(120% 90% at 85% 15%, #2A47A6 0%, #14255C 60%)' }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-gold-300"
            >
              <Sparkles size={13} /> {t('ads.eyebrow')}
            </motion.span>
            <motion.h1
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08, ease: EASE }}
              className="mt-5 font-display text-[2.4rem] font-black leading-tight tracking-tight text-white sm:text-[3rem]"
            >
              {t('ads.title')}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.16, ease: EASE }}
              className="mt-5 max-w-lg leading-relaxed text-navy-100"
            >
              {t('ads.lead')}
            </motion.p>
            <motion.a
              href="#ad-form"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.24, ease: EASE }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="btn-accent mt-8 px-7 py-3"
            >
              {t('ads.addNow')}
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="rounded-xl bg-white p-7 shadow-pop"
          >
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-navy-700 text-white">
              <Megaphone size={22} strokeWidth={2} />
            </span>
            <h2 className="mt-5 font-display text-xl font-bold text-navy-900">{t('ads.spaceTitle')}</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-muted">{t('ads.spaceBody')}</p>
            <p className="mt-5 font-mono text-lg font-bold text-navy-700">
              {t('ads.from')} {fmt(minPrice)} OMR
            </p>
          </motion.div>
        </div>
      </section>

      {/* Request form */}
      <section id="ad-form" className="mx-auto max-w-3xl px-6 py-14">
        <SectionHead eyebrow={t('ads.eyebrow')} title={t('ads.formTitle')} lead={t('ads.formLead')} />

        <AnimatePresence mode="wait">
          {done ? (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card-pad mt-8 text-center">
              <CheckCircle2 size={46} className="mx-auto text-teal-600" strokeWidth={1.8} />
              <h3 className="mt-4 font-display text-lg font-bold text-navy-900">{t('ads.successTitle')}</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-muted">{t('ads.successBody')}</p>
              <button onClick={() => setDone(false)} className="btn-quiet mt-6">{t('contact.another')}</button>
            </motion.div>
          ) : (
            <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-pad mt-8 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="a-org" className="label">{t('ads.orgName')} *</label>
                  <input id="a-org" required value={form.orgName} onChange={update('orgName')} className="field" />
                </div>
                <div>
                  <label htmlFor="a-app" className="label">{t('ads.applicantName')} *</label>
                  <input id="a-app" required value={form.applicantName} onChange={update('applicantName')} className="field" />
                </div>
                <div>
                  <label htmlFor="a-email" className="label">{t('ads.email')} *</label>
                  <input id="a-email" type="email" required dir="ltr" value={form.email} onChange={update('email')} className="field" />
                </div>
                <div>
                  <label htmlFor="a-phone" className="label">{t('ads.phone')} *</label>
                  <input id="a-phone" required dir="ltr" placeholder="9XXXXXXX" value={form.phone} onChange={update('phone')} className="field" />
                </div>
                <div>
                  <label htmlFor="a-place" className="label">{t('ads.placement')} *</label>
                  <select id="a-place" value={form.placement} onChange={update('placement')} className="field">
                    {rates.map((r) => (
                      <option key={r.id} value={r.id}>
                        {pick(r, 'label')} — {fmt(r.weeklyPrice)} OMR {t('ads.weekly')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="a-dur" className="label">{t('ads.duration')} *</label>
                  <select id="a-dur" value={form.durationDays} onChange={update('durationDays')} className="field">
                    {/* 7, 14 and 30 — the durations on the published
                        advertising page. 60 was offered here but rejected by
                        the model on save. */}
                    {[7, 14, 30].map((d) => (
                      <option key={d} value={d}>{fmt(d)} {t('ads.days')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="a-title" className="label">{t('ads.adTitle')} *</label>
                <input id="a-title" required value={form.title} onChange={update('title')} className="field" />
                <p className="mt-1.5 text-xs text-ink-soft">{t('ads.adTitleHint')}</p>
              </div>

              <div>
                <label htmlFor="a-desc" className="label">{t('ads.description')} *</label>
                <textarea id="a-desc" required rows={4} maxLength={250} value={form.description} onChange={update('description')} className="field resize-y" />
                <div className="mt-1.5 flex justify-between text-xs text-ink-soft">
                  <span>{t('ads.descriptionHint')}</span>
                  <span className="font-mono">{fmt(form.description.length)}/{fmt(250)}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="a-url" className="label">{t('ads.targetUrl')}</label>
                  <input id="a-url" type="url" dir="ltr" placeholder="https://example.com" value={form.targetUrl} onChange={update('targetUrl')} className="field" />
                </div>
                <div>
                  <label htmlFor="a-start" className="label">{t('ads.startDate')} *</label>
                  <input id="a-start" type="date" required dir="ltr" value={form.startDate} onChange={update('startDate')} className="field" />
                </div>
              </div>

              <div>
                <p className="label">{t('ads.image')} *</p>
                <motion.label
                  htmlFor="a-file"
                  whileHover={{ scale: 1.005 }}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-rule bg-canvas px-4 py-8 text-center transition-colors hover:border-navy-400"
                >
                  <motion.span animate={{ y: [0, -4, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
                    <UploadCloud size={26} className="text-navy-700" />
                  </motion.span>
                  <span className="mt-2.5 text-sm font-bold text-ink">{file ? file.name : t('ads.upload')}</span>
                  <span className="mt-1 text-xs text-ink-soft">{t('ads.imageHint')}</span>
                  <input id="a-file" type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                </motion.label>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-navy-50 px-4 py-3">
                <span className="text-sm font-medium text-navy-800">{t('ads.quoted')}</span>
                <motion.span key={quoted} initial={{ scale: 1.12 }} animate={{ scale: 1 }} className="font-mono text-lg font-bold text-navy-900">
                  {fmt(quoted)} OMR
                </motion.span>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button type="submit" disabled={sending} className="btn-primary w-full py-3">
                {sending ? t('ads.submitting') : t('ads.submit')}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
