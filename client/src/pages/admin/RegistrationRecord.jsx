import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BellRing,
  Check,
  CheckCircle2,
  FileText,
  X
} from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

/*
  One registration, on its own page.

  A decision here lets a business into a procurement process or keeps it out,
  so the page shows the whole record at once rather than a summary that has to
  be trusted — the applicant's details, the bank accounts they will be paid
  into, and every document with the date it stops being valid.
*/

const STATUS_CLASS = {
  submitted: 'pill-info',
  under_review: 'pill-wait',
  approved: 'pill-ok',
  rejected: 'bg-red-50 text-red-700 pill',
  draft: 'pill-muted'
};

/** A labelled row. Renders nothing when there is no value, rather than "—". */
function Row({ label, value, mono }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-b border-rule py-2.5 last:border-0">
      <dt className="text-sm text-ink-muted">{label}</dt>
      <dd className={`text-sm font-bold text-navy-900 ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-2xl border border-rule bg-surface p-6">
      <h2 className="font-display text-lg font-bold text-navy-900">{title}</h2>
      <dl className="mt-3">{children}</dl>
    </section>
  );
}

export default function RegistrationRecord() {
  const { entityType, id } = useParams();
  const { t, tGov, pick, fmt, lang, isRTL } = useLanguage();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [slotLabels, setSlotLabels] = useState({});

  const Back = isRTL ? ArrowRight : ArrowLeft;

  /*
    Read from the queue rather than a by-id endpoint, because the review list
    is what the server exposes and it already carries the computed expiry. One
    source for the reviewer's view means the row and the record can never
    disagree about whether a document has lapsed.
  */
  const load = () => {
    setLoading(true);
    api
      .get('/admin/registrations', { params: { status: 'all', entityType } })
      .then((res) => setRecord(res.data.data.find((r) => r._id === id) || null))
      .catch(() => setRecord(null))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id, entityType]);

  /*
    A document's name belongs to the server, which validates against the same
    catalogue. Holding a second copy here is how the label a reviewer reads
    drifts from the slot the record actually holds.
  */
  useEffect(() => {
    api
      .get('/companies/documents/catalogue', { params: { entityType } })
      .then((res) =>
        setSlotLabels(
          Object.fromEntries(res.data.data.slots.map((s) => [s.slot, s.label]))
        )
      )
      .catch(() => setSlotLabels({}));
  }, [entityType]);

  /** The document's published name, falling back to its key rather than blank. */
  const slotName = (slot) => slotLabels[slot]?.[lang === 'ar' ? 'ar' : 'en'] || slot;

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : null;

  const act = async (run, done) => {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await run();
      setNotice(done);
      load();
    } catch (err) {
      setError(err.response?.data?.message || t('rev.errAction'));
    } finally {
      setBusy(false);
    }
  };

  const approve = () => {
    if (!window.confirm(t('rev.confirmApprove'))) return;
    act(() => api.patch(`/admin/registrations/${id}/approve`), t('rev.approved'));
  };

  const reject = () => {
    if (!reason.trim()) {
      setError(t('rev.errReason'));
      return;
    }
    act(
      () => api.patch(`/admin/registrations/${id}/reject`, { reason: reason.trim() }),
      t('rev.rejected')
    ).then(() => setRejecting(false));
  };

  const startReview = () =>
    act(() => api.patch(`/admin/registrations/${id}/review`), t('rev.status.under_review'));

  const notifyExpiry = () =>
    act(() => api.post(`/admin/registrations/${id}/notify-expiry`), t('rev.notifySent'));

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16">
        <div className="h-8 w-1/2 animate-pulse rounded bg-rule" />
        <div className="mt-6 h-72 animate-pulse rounded-2xl border border-rule bg-surface" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-ink-muted">{t('rev.notFound')}</p>
        <Link to={`/admin/registrations/${entityType}`} className="btn-quiet mt-6 inline-flex">
          <Back size={16} /> {t('rev.back')}
        </Link>
      </div>
    );
  }

  const expired = record.expiredDocuments || [];
  const expiring = record.expiringDocuments || [];
  const decided = ['approved', 'rejected'].includes(record.registrationStatus);

  /** How a document's expiry reads, and how urgently. */
  const expiryOf = (doc) => {
    if (!doc.expiryDate) return { text: t('rev.noExpiry'), tone: 'text-ink-soft' };
    const at = new Date(doc.expiryDate).getTime();
    if (at < Date.now()) {
      return { text: `${t('rev.expired')} · ${fmtDate(doc.expiryDate)}`, tone: 'text-red-700 font-bold' };
    }
    if (at < Date.now() + 30 * 864e5) {
      return {
        text: `${t('rev.expiringSoon')} · ${fmtDate(doc.expiryDate)}`,
        tone: 'text-accent-700 font-bold'
      };
    }
    return { text: `${t('rev.expiresOn')} ${fmtDate(doc.expiryDate)}`, tone: 'text-ink-muted' };
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-10">
      <Link
        to={`/admin/registrations/${entityType}`}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-navy-700 hover:text-navy-900"
      >
        <Back size={15} /> {t('rev.back')}
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-3xl font-bold leading-tight text-navy-900">
            {pick(record, 'companyName')}
          </h1>
          <p className="mt-1.5 text-ink-muted">
            {t(`rev.${entityType}`)} · <span className="font-mono">{record.crNumber || '—'}</span>
          </p>
        </div>
        <span className={STATUS_CLASS[record.registrationStatus] || 'pill-muted'}>
          {t(`rev.status.${record.registrationStatus}`)}
        </span>
      </header>

      {/* ------------------------------------------- what has gone out of date */}
      {expired.length > 0 && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="flex items-center gap-2 font-display font-bold text-red-700">
            <AlertTriangle size={18} aria-hidden="true" /> {t('rev.expiryWarning')}
          </p>
          <p className="mt-1.5 text-sm text-red-700">{t('rev.expiryWarningBody')}</p>
          <ul className="mt-3 space-y-1 text-sm text-red-700">
            {expired.map((d) => (
              <li key={d.slot} className="font-bold">
                {slotName(d.slot)} — {fmtDate(d.expiryDate)}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={notifyExpiry}
            disabled={busy}
            className="btn-quiet mt-4 text-sm"
          >
            <BellRing size={15} aria-hidden="true" /> {t('rev.notifyExpiry')}
          </button>
        </div>
      )}

      {notice && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-teal-50 px-4 py-3 text-sm font-medium text-teal-700">
          <CheckCircle2 size={16} aria-hidden="true" /> {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <Section title={t('rev.applicant')}>
        <Row label={t('rw.fullName')} value={record.owner?.name} />
        <Row label={t('auth.email')} value={record.owner?.email} mono />
        <Row label={t('form.contactPhone')} value={record.owner?.phone} mono />
      </Section>

      <Section title={t('rev.theCompany')}>
        <Row label={t('rw.companyArabic')} value={record.companyNameAr} />
        <Row label={t('form.crNumber')} value={record.crNumber} mono />
        <Row label={t('form.governorate')} value={tGov(record.governorate)} />
        <Row label={t('rev.submittedOn')} value={fmtDate(record.submittedAt)} />
        <Row label={t('rev.reviewedOn')} value={fmtDate(record.reviewedAt)} />
        <Row label={t('rev.reason')} value={record.rejectionReason} />
      </Section>

      <Section title={t('rev.documents')}>
        {(record.documents || []).length === 0 ? (
          <p className="text-sm text-ink-muted">{t('rev.noDocuments')}</p>
        ) : (
          <ul className="space-y-2">
            {record.documents.map((doc) => {
              const expiry = expiryOf(doc);
              return (
                <li
                  key={doc._id || doc.storedName}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-rule bg-canvas px-4 py-3"
                >
                  <FileText size={16} className="shrink-0 text-navy-700" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy-900">
                    {slotName(doc.slot)}
                  </span>
                  <span className="truncate text-sm text-ink-muted">{doc.originalName}</span>
                  <span className={`text-sm ${expiry.tone}`}>{expiry.text}</span>
                </li>
              );
            })}
          </ul>
        )}
        {expiring.length > 0 && expired.length === 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-accent-700">
            <AlertTriangle size={15} aria-hidden="true" />
            {t('rev.expiringSoon')} · {fmt(expiring.length)}
          </p>
        )}
      </Section>

      {/* ------------------------------------------------------- the decision */}
      <section className="rounded-2xl border border-rule bg-canvas p-6">
        <h2 className="font-display text-lg font-bold text-navy-900">{t('rev.decide')}</h2>

        {decided ? (
          <p className="mt-3 text-sm text-ink-muted">{t('rev.alreadyDecided')}</p>
        ) : rejecting ? (
          <div className="mt-4">
            <label htmlFor="reason" className="label">
              {t('rev.rejectReason')}
            </label>
            <p className="mb-2 text-sm text-ink-muted">{t('rev.rejectReasonHint')}</p>
            <textarea
              id="reason"
              rows={4}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="field"
            />
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="button" onClick={reject} disabled={busy} className="btn-primary bg-red-700 hover:bg-red-800">
                <X size={16} aria-hidden="true" /> {t('rev.reject')}
              </button>
              <button type="button" onClick={() => setRejecting(false)} className="btn-quiet">
                {t('bid.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex flex-wrap gap-3">
            <button type="button" onClick={approve} disabled={busy} className="btn-accent">
              <Check size={16} aria-hidden="true" /> {t('rev.approve')}
            </button>
            <button type="button" onClick={() => setRejecting(true)} disabled={busy} className="btn-quiet">
              <X size={16} aria-hidden="true" /> {t('rev.reject')}
            </button>
            {record.registrationStatus === 'submitted' && (
              <button type="button" onClick={startReview} disabled={busy} className="btn-ghost">
                {t('rev.startReview')}
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
