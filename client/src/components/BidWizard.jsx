import { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Info,
  Paperclip,
  Plus,
  Trash2,
  Upload
} from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

/*
  A bid, in three steps: the documents, the prices, and a last read before it
  becomes a commitment.

  Two rules shape the whole component.

  First, the server owns the money. The totals below are computed here too,
  because a bidder typing rates has to see the effect immediately — but every
  figure is recomputed on save, and it is the saved one that is shown
  afterwards. Nothing this file calculates is ever what gets stored.

  Second, nothing is lost. Each step saves a draft on the way forward, so a
  closed laptop, a dropped connection or a change of mind costs the bidder
  nothing. Submitting is the only irreversible act, and it is the only one that
  asks for confirmation.
*/

const STEPS = ['bid.step1', 'bid.step2', 'bid.step3'];
const VAT_RATE = 5;
const PLATFORM_FEE_RATE = 5;

/** Rials to whole baisa and back, mirroring the server's arithmetic exactly. */
const toBaisa = (rials) => Math.round(Number(rials || 0) * 1000);
const percentOf = (baisa, rate) => Math.round((baisa * rate) / 100);

const emptyLine = () => ({ description: '', unit: '', quantity: 1, unitPrice: 0 });

/** The bid as the form holds it: prices in rials, because that is what is typed. */
const fromBid = (bid, tender) => ({
  contactName: bid?.contactName || '',
  contactEmail: bid?.contactEmail || '',
  contactPhone: bid?.contactPhone || '',
  proposalSummary: bid?.proposalSummary || '',
  validityDays: bid?.validityDays ?? 90,
  hasExceptions: Boolean(bid?.hasExceptions),
  exceptionsNote: bid?.exceptionsNote || '',
  lineItems: bid?.lineItems?.length
    ? bid.lineItems.map((li) => ({
        description: li.description,
        unit: li.unit || '',
        quantity: li.quantity,
        unitPrice: (li.unitPriceBaisa || 0) / 1000
      }))
    : // No draft yet: start from the buyer's scope, unpriced, so the bidder
      // fills in rates against the same lines every other bidder sees.
      (tender.scopeItems || []).map((item) => ({
        description: item.description,
        unit: item.unit || '',
        quantity: item.quantity,
        unitPrice: 0
      }))
});

export default function BidWizard({ tender, bid, onChange }) {
  const { t, pick, fmt, isRTL } = useLanguage();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(() => fromBid(bid, tender));
  const [documents, setDocuments] = useState(bid?.documents || []);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(null); // 'saving' | 'submitting' | slot key
  const [notice, setNotice] = useState('');
  const [confirming, setConfirming] = useState(false);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    setNotice('');
  };

  const setLine = (i, key, value) =>
    setForm((f) => ({
      ...f,
      lineItems: f.lineItems.map((li, n) => (n === i ? { ...li, [key]: value } : li))
    }));

  /* ------------------------------------------------------------- the money */

  const money = useMemo(() => {
    const subtotal = form.lineItems.reduce(
      (sum, li) => sum + Math.max(0, Number(li.quantity) || 0) * Math.max(0, toBaisa(li.unitPrice)),
      0
    );
    const vat = percentOf(subtotal, VAT_RATE);
    const fee = percentOf(subtotal, PLATFORM_FEE_RATE);
    return {
      subtotal,
      vat,
      total: subtotal + vat,
      fee,
      net: subtotal + vat - fee
    };
  }, [form.lineItems]);

  /*
    Always three decimals. A rial has 1000 baisa, and the default number format
    trims trailing zeros — which would print 1200.000 as "1,200" and quietly
    turn a precise figure into a rounded-looking one on an offer document.
  */
  const omr = (baisa) =>
    `${fmt(baisa / 1000, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} ${t('bid.omr')}`;

  /* ------------------------------------------------------------ validation */

  const validateStep = (which) => {
    const next = {};
    if (which === 0) {
      if (!form.contactName.trim()) next.contactName = t('bid.errRequired');
      if (!/^\S+@\S+\.\S+$/.test(form.contactEmail.trim())) next.contactEmail = t('bid.errEmail');
      if (!documents.some((d) => d.slot === 'technical')) next.technical = t('bid.errTechnical');
    }
    if (which === 1) {
      const priced = form.lineItems.filter(
        (li) => li.description.trim() && Number(li.unitPrice) > 0
      );
      if (!priced.length) next.lineItems = t('bid.errNoLines');
    }
    if (which === 2) {
      if (!form.proposalSummary.trim()) next.proposalSummary = t('bid.errRequired');
      const days = Number(form.validityDays);
      if (!Number.isInteger(days) || days < 1 || days > 365) next.validityDays = t('bid.errValidity');
      if (form.hasExceptions && !form.exceptionsNote.trim()) {
        next.exceptionsNote = t('bid.errException');
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* -------------------------------------------------------------- the wire */

  const payload = () => ({
    ...form,
    validityDays: Number(form.validityDays),
    lineItems: form.lineItems
      .filter((li) => li.description.trim())
      .map((li) => ({
        description: li.description,
        unit: li.unit,
        quantity: Number(li.quantity) || 0,
        unitPrice: Number(li.unitPrice) || 0
      }))
  });

  /** Saves the draft. Returns true when it stuck. */
  const save = async ({ quiet = false } = {}) => {
    setBusy('saving');
    try {
      const res = await api.put(`/applications/tender/${tender._id}/draft`, payload());
      onChange?.(res.data.data);
      setDocuments(res.data.data.documents || []);
      if (!quiet) setNotice(t('bid.saved'));
      return true;
    } catch (err) {
      setErrors({ form: err.response?.data?.message || t('bid.errSave') });
      return false;
    } finally {
      setBusy(null);
    }
  };

  const next = async () => {
    if (!validateStep(step)) return;
    // The draft is saved on the way forward, so stepping back and forth never
    // risks the work already done.
    if (await save({ quiet: true })) setStep((n) => Math.min(n + 1, STEPS.length - 1));
  };

  const submit = async () => {
    if (!validateStep(2)) return;
    setBusy('submitting');
    try {
      const res = await api.post(`/applications/tender/${tender._id}/submit`, payload());
      onChange?.(res.data.data);
    } catch (err) {
      setConfirming(false);
      setErrors({ form: err.response?.data?.message || t('bid.errSave') });
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------ attachments */

  const inputs = useRef({});

  const attach = async (slot, file) => {
    if (!file) return;
    setErrors((e) => ({ ...e, [slot]: undefined }));

    // A file needs a bid to hang on, and on a first visit there is not one yet.
    if (!bid) {
      const saved = await save({ quiet: true });
      if (!saved) return;
    }

    setBusy(slot);
    const body = new FormData();
    body.append('file', file);
    try {
      const res = await api.post(
        `/applications/tender/${tender._id}/documents/${slot}`,
        body,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      onChange?.(res.data.data);
      setDocuments(res.data.data.documents || []);
    } catch (err) {
      setErrors((e) => ({ ...e, [slot]: err.response?.data?.message || t('bid.errSave') }));
    } finally {
      setBusy(null);
      if (inputs.current[slot]) inputs.current[slot].value = '';
    }
  };

  const detach = async (docId) => {
    setBusy(docId);
    try {
      const res = await api.delete(`/applications/tender/${tender._id}/documents/${docId}`);
      onChange?.(res.data.data);
      setDocuments(res.data.data.documents || []);
    } catch {
      /* leaving the file listed is the safe failure: nothing was removed */
    } finally {
      setBusy(null);
    }
  };

  /** One upload row. `multiple` slots list every file; the others list one. */
  const Slot = ({ slot, label, hint, required }) => {
    const held = documents.filter((d) => d.slot === slot);
    const uploading = busy === slot;

    return (
      <div className="rounded-xl border border-rule bg-surface p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="font-bold text-navy-900">{label}</p>
          <span className={required ? 'pill-wait' : 'pill-muted'}>
            {required ? t('bid.required') : t('bid.optional')}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-muted">{hint}</p>

        <ul className="mt-3 space-y-2">
          {held.map((d) => (
            <li
              key={d._id}
              className="flex items-center gap-2 rounded-lg border border-rule bg-canvas px-3 py-2 text-sm"
            >
              <FileText size={15} className="shrink-0 text-navy-700" />
              <span className="min-w-0 flex-1 truncate text-ink">{d.originalName}</span>
              <button
                type="button"
                onClick={() => detach(d._id)}
                disabled={busy === d._id}
                className="inline-flex items-center gap-1 text-xs font-bold text-ink-muted hover:text-navy-900 disabled:opacity-50"
              >
                <Trash2 size={13} /> {t('bid.remove')}
              </button>
            </li>
          ))}
          {held.length === 0 && <li className="text-sm text-ink-soft">{t('bid.noFile')}</li>}
        </ul>

        <label className="btn-quiet mt-3 inline-flex cursor-pointer text-sm">
          <Upload size={15} />
          {uploading ? t('bid.uploading') : held.length && slot !== 'other' ? t('bid.replace') : t('bid.choose')}
          <input
            ref={(el) => {
              inputs.current[slot] = el;
            }}
            type="file"
            accept={slot === 'other' ? '.pdf,.jpg,.jpeg,.png' : '.pdf'}
            className="sr-only"
            disabled={uploading}
            onChange={(e) => attach(slot, e.target.files?.[0])}
          />
        </label>

        {errors[slot] && <p className="mt-2 text-sm font-medium text-red-600">{errors[slot]}</p>}
      </div>
    );
  };

  /* ------------------------------------------------------------------ view */

  const Err = ({ name }) =>
    errors[name] ? (
      <p id={`${name}-error`} className="mt-1.5 text-sm font-medium text-red-600">
        {errors[name]}
      </p>
    ) : null;

  const fieldProps = (name) => ({
    id: name,
    value: form[name],
    onChange: (e) => set(name, e.target.value),
    'aria-invalid': Boolean(errors[name]),
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    className: `field ${errors[name] ? 'border-red-400' : ''}`
  });

  return (
    <div className="rounded-2xl border border-rule bg-canvas p-6 sm:p-8">
      <h2 className="font-display text-2xl font-bold text-navy-900">{t('bid.title')}</h2>

      {/* ------------------------------------------------------ step track */}
      <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
        {STEPS.map((key, i) => (
          <li key={key} className="flex items-center gap-2 text-sm">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                i < step
                  ? 'bg-teal-600 text-white'
                  : i === step
                    ? 'bg-navy-700 text-white'
                    : 'bg-navy-50 text-ink-soft'
              }`}
            >
              {i < step ? <CheckCircle2 size={14} /> : fmt(i + 1)}
            </span>
            <span className={i === step ? 'font-bold text-navy-900' : 'text-ink-muted'}>
              {t(key)}
            </span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: isRTL ? -12 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: isRTL ? 12 : -12 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="mt-8"
        >
          {/* ------------------------------------------- 1 · documents */}
          {step === 0 && (
            <div className="space-y-6">
              <fieldset>
                <legend className="font-display text-lg font-bold text-navy-900">
                  {t('bid.contact')}
                </legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="contactName" className="label">
                      {t('bid.contactName')}
                    </label>
                    <input {...fieldProps('contactName')} type="text" autoComplete="name" />
                    <Err name="contactName" />
                  </div>
                  <div>
                    <label htmlFor="contactEmail" className="label">
                      {t('bid.contactEmail')}
                    </label>
                    <input {...fieldProps('contactEmail')} type="email" autoComplete="email" dir="ltr" />
                    <Err name="contactEmail" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="contactPhone" className="label">
                      {t('bid.contactPhone')}
                    </label>
                    <input {...fieldProps('contactPhone')} type="tel" autoComplete="tel" dir="ltr" />
                  </div>
                </div>
              </fieldset>

              <div>
                <h3 className="font-display text-lg font-bold text-navy-900">{t('bid.documents')}</h3>
                <p className="mt-1 text-sm text-ink-muted">{t('bid.documentsLead')}</p>
                <div className="mt-4 grid gap-4">
                  <Slot
                    slot="technical"
                    label={t('bid.technical')}
                    hint={t('bid.technicalHint')}
                    required
                  />
                  <Slot slot="commercial" label={t('bid.commercial')} hint={t('bid.commercialHint')} />
                  <Slot slot="other" label={t('bid.otherDocs')} hint={t('bid.otherHint')} />
                </div>
                {errors.technical && (
                  <p className="mt-2 text-sm font-medium text-red-600">{errors.technical}</p>
                )}
              </div>
            </div>
          )}

          {/* --------------------------------------------- 2 · pricing */}
          {step === 1 && (
            <div>
              <h3 className="font-display text-lg font-bold text-navy-900">{t('bid.pricing')}</h3>
              <p className="mt-1 text-sm text-ink-muted">{t('td.boqLead')}</p>

              <div className="mt-5 space-y-3">
                {form.lineItems.map((li, i) => (
                  <div
                    key={i}
                    className="grid gap-3 rounded-xl border border-rule bg-surface p-4 sm:grid-cols-[1fr_5rem_7rem_auto] sm:items-end"
                  >
                    <div>
                      <label htmlFor={`line-${i}-desc`} className="label">
                        {t('bid.describeLine')}
                      </label>
                      <input
                        id={`line-${i}-desc`}
                        type="text"
                        className="field"
                        value={li.description}
                        onChange={(e) => setLine(i, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`line-${i}-qty`} className="label">
                        {t('td.quantity')}
                      </label>
                      <input
                        id={`line-${i}-qty`}
                        type="number"
                        min="0"
                        step="any"
                        className="field"
                        value={li.quantity}
                        onChange={(e) => setLine(i, 'quantity', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`line-${i}-price`} className="label">
                        {t('bid.unitPrice')}
                      </label>
                      <input
                        id={`line-${i}-price`}
                        type="number"
                        min="0"
                        step="0.001"
                        className="field"
                        value={li.unitPrice}
                        onChange={(e) => setLine(i, 'unitPrice', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span className="font-mono text-sm font-bold text-navy-900">
                        {omr(Math.max(0, Number(li.quantity) || 0) * Math.max(0, toBaisa(li.unitPrice)))}
                      </span>
                      <button
                        type="button"
                        aria-label={t('bid.removeLine')}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            lineItems: f.lineItems.filter((_, n) => n !== i)
                          }))
                        }
                        className="rounded-lg p-2 text-ink-soft hover:bg-navy-50 hover:text-navy-900"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, lineItems: [...f.lineItems, emptyLine()] }))}
                className="btn-quiet mt-4 text-sm"
              >
                <Plus size={15} /> {t('bid.addLine')}
              </button>
              {errors.lineItems && (
                <p className="mt-2 text-sm font-medium text-red-600">{errors.lineItems}</p>
              )}

              {/* ------------------------------------------ the totals */}
              <dl className="mt-7 space-y-2.5 rounded-xl border border-rule bg-surface p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{t('bid.subtotal')}</dt>
                  <dd className="font-mono font-bold text-navy-900">{omr(money.subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">
                    {t('bid.vat')} ({fmt(VAT_RATE)}%)
                  </dt>
                  <dd className="font-mono font-bold text-navy-900">{omr(money.vat)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-rule pt-2.5">
                  <dt className="font-bold text-ink">{t('bid.total')}</dt>
                  <dd className="font-mono text-base font-bold text-navy-900">{omr(money.total)}</dd>
                </div>
                <div className="flex justify-between gap-4 pt-1">
                  <dt className="text-ink-muted">
                    {t('bid.platformFee')} ({fmt(PLATFORM_FEE_RATE)}%)
                  </dt>
                  <dd className="font-mono font-bold text-accent-700">−{omr(money.fee)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-rule pt-2.5">
                  <dt className="font-bold text-ink">{t('bid.net')}</dt>
                  <dd className="font-mono text-base font-bold text-teal-700">{omr(money.net)}</dd>
                </div>
              </dl>

              <p className="mt-3 flex gap-2 text-sm text-ink-muted">
                <Info size={15} className="mt-0.5 shrink-0 text-navy-700" />
                {t('bid.feeNotice')}
              </p>
            </div>
          )}

          {/* ---------------------------------- 3 · review and submit */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="proposalSummary" className="label">
                  {t('bid.summary')}
                </label>
                <p className="mb-2 text-sm text-ink-muted">{t('bid.summaryHint')}</p>
                <textarea
                  {...fieldProps('proposalSummary')}
                  rows={5}
                  maxLength={2000}
                  className={`field ${errors.proposalSummary ? 'border-red-400' : ''}`}
                />
                <Err name="proposalSummary" />
              </div>

              <div className="max-w-xs">
                <label htmlFor="validityDays" className="label">
                  {t('bid.validity')}
                </label>
                <p className="mb-2 text-sm text-ink-muted">{t('bid.validityHint')}</p>
                <input {...fieldProps('validityDays')} type="number" min="1" max="365" />
                <Err name="validityDays" />
              </div>

              <fieldset>
                <legend className="label">{t('bid.exceptions')}</legend>
                <div className="mt-2 space-y-2">
                  {[false, true].map((value) => (
                    <label
                      key={String(value)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-rule bg-surface px-4 py-3 text-sm has-[:checked]:border-navy-300 has-[:checked]:bg-navy-50"
                    >
                      <input
                        type="radio"
                        name="hasExceptions"
                        className="h-4 w-4 accent-navy-700"
                        checked={form.hasExceptions === value}
                        onChange={() => set('hasExceptions', value)}
                      />
                      <span className="text-ink">
                        {t(value ? 'bid.yesExceptions' : 'bid.noExceptions')}
                      </span>
                    </label>
                  ))}
                </div>

                {form.hasExceptions && (
                  <div className="mt-4">
                    <label htmlFor="exceptionsNote" className="label">
                      {t('bid.exceptionsNote')}
                    </label>
                    <p className="mb-2 text-sm text-ink-muted">{t('bid.exceptionsHint')}</p>
                    <textarea
                      {...fieldProps('exceptionsNote')}
                      rows={3}
                      maxLength={2000}
                      className={`field ${errors.exceptionsNote ? 'border-red-400' : ''}`}
                    />
                    <Err name="exceptionsNote" />
                  </div>
                )}
              </fieldset>

              {/* -------------------------------------- what is being sent */}
              <div className="rounded-xl border border-rule bg-surface p-5">
                <p className="font-bold text-navy-900">{pick(tender, 'title')}</p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">{t('bid.total')}</dt>
                    <dd className="font-mono font-bold text-navy-900">{omr(money.total)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">{t('bid.net')}</dt>
                    <dd className="font-mono font-bold text-teal-700">{omr(money.net)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-ink-muted">{t('bid.documents')}</dt>
                    <dd className="flex items-center gap-1.5 font-bold text-navy-900">
                      <Paperclip size={13} /> {fmt(documents.length)}
                    </dd>
                  </div>
                </dl>
              </div>

              <p className="flex gap-2 rounded-xl border border-accent-200 bg-accent-50 p-4 text-sm text-ink">
                <AlertTriangle size={16} className="mt-0.5 shrink-0 text-accent-700" />
                {t('bid.finalWarning')}
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {errors.form && (
        <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {errors.form}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-5 flex items-center gap-2 text-sm font-medium text-teal-700">
          <CheckCircle2 size={15} /> {notice}
        </p>
      )}

      {/* ------------------------------------------------------- the controls */}
      <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
        {step > 0 && (
          <button type="button" onClick={() => setStep((n) => n - 1)} className="btn-quiet">
            {t('bid.prev')}
          </button>
        )}

        <button type="button" onClick={() => save()} disabled={busy === 'saving'} className="btn-ghost">
          {busy === 'saving' ? t('bid.saving') : t('bid.saveDraft')}
        </button>

        <div className="ms-auto">
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} disabled={Boolean(busy)} className="btn-primary">
              {t('bid.next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (validateStep(2) ? setConfirming(true) : null)}
              disabled={Boolean(busy)}
              className="btn-accent"
            >
              {busy === 'submitting' ? t('bid.submitting') : t('bid.submit')}
            </button>
          )}
        </div>
      </div>

      {/* A bid cannot be edited once sent, so the send is confirmed. */}
      <AnimatePresence>
        {confirming && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-navy-900/40 p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
          >
            <motion.div
              initial={{ scale: 0.96, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              className="w-full max-w-md rounded-2xl bg-surface p-7 shadow-lift"
            >
              <h3 id="confirm-title" className="font-display text-xl font-bold text-navy-900">
                {t('bid.submit')}
              </h3>
              <p className="mt-2 text-sm text-ink-muted">{t('bid.finalWarning')}</p>
              <dl className="mt-4 space-y-2 rounded-xl border border-rule bg-canvas p-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{t('bid.total')}</dt>
                  <dd className="font-mono font-bold text-navy-900">{omr(money.total)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-ink-muted">{t('bid.net')}</dt>
                  <dd className="font-mono font-bold text-teal-700">{omr(money.net)}</dd>
                </div>
              </dl>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" className="btn-quiet" onClick={() => setConfirming(false)}>
                  {t('bid.cancel')}
                </button>
                <button
                  type="button"
                  className="btn-accent"
                  onClick={submit}
                  disabled={busy === 'submitting'}
                >
                  {busy === 'submitting' ? t('bid.submitting') : t('bid.submit')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
