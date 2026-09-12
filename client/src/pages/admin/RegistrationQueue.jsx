import { useEffect, useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Building2, Inbox, UserRound, Users } from 'lucide-react';
import api from '../../api/axios';
import { useLanguage } from '../../context/LanguageContext';

/*
  The review queue, one page per kind of applicant.

  Merchants, institutions and permit holders are not variations on a form —
  they are three different reviews. A merchant is checked for a commercial
  registration and a bank account; an institution for its authority to spend;
  a permit holder for a current self-employment permit. Mixing them into one
  list would make the reviewer re-read which kind each row is before they can
  judge it, on every row.
*/

const TYPES = [
  { key: 'merchant', icon: Users },
  { key: 'organization', icon: Building2 },
  { key: 'freelance', icon: UserRound }
];

const STATUS_CLASS = {
  submitted: 'pill-info',
  under_review: 'pill-wait',
  approved: 'pill-ok',
  rejected: 'bg-red-50 text-red-700 pill',
  draft: 'pill-muted'
};

export default function RegistrationQueue() {
  const { entityType = 'merchant' } = useParams();
  const { t, pick, fmt, lang, isRTL } = useLanguage();

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('submitted');
  const [loading, setLoading] = useState(true);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    setLoading(true);
    api
      .get('/admin/registrations', { params: { status, entityType } })
      .then((res) => setRows(res.data.data))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [status, entityType]);

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      : '—';

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl font-bold text-navy-900">{t('rev.title')}</h1>

      {/* One tab per kind of applicant; each is its own page, its own URL. */}
      <nav className="mt-6 flex flex-wrap gap-2" aria-label={t('rev.title')}>
        {TYPES.map(({ key, icon: Icon }) => (
          <NavLink
            key={key}
            to={`/admin/registrations/${key}`}
            className={({ isActive }) =>
              `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition-colors ${
                isActive
                  ? 'border-navy-700 bg-navy-700 text-white'
                  : 'border-rule bg-surface text-ink-muted hover:border-navy-300 hover:text-navy-900'
              }`
            }
          >
            <Icon size={15} aria-hidden="true" />
            {t(`rev.${key}`)}
          </NavLink>
        ))}
      </nav>

      <p className="mt-4 text-sm text-ink-muted">{t(`rev.${entityType}Lead`)}</p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label htmlFor="status" className="text-sm font-bold text-ink">
          {t('rev.filterStatus')}
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="field max-w-[14rem]"
        >
          {['submitted', 'under_review', 'approved', 'rejected', 'all'].map((s) => (
            <option key={s} value={s}>
              {s === 'all' ? t('rev.all') : t(`rev.status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-rule bg-surface" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="mt-10 flex items-center gap-2 text-sm text-ink-muted">
          <Inbox size={16} aria-hidden="true" /> {t('rev.queueEmpty')}
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {rows.map((row, i) => (
            <motion.li
              key={row._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3) }}
            >
              <Link
                to={`/admin/registrations/${entityType}/${row._id}`}
                className="group block rounded-xl border border-rule bg-surface p-5 transition-colors hover:border-navy-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-navy-900">
                      {pick(row, 'companyName')}
                    </p>
                    <p className="mt-0.5 text-sm text-ink-muted">
                      {row.owner?.name} · {row.owner?.email}
                    </p>
                  </div>
                  <span className={STATUS_CLASS[row.registrationStatus] || 'pill-muted'}>
                    {t(`rev.status.${row.registrationStatus}`)}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
                  <span className="font-mono">{row.crNumber || '—'}</span>
                  <span>
                    {t('rev.submittedOn')} {fmtDate(row.submittedAt)}
                  </span>

                  {/*
                    Surfaced on the row, not only inside the record. A reviewer
                    working through a queue should see which ones carry a
                    problem before they open them.
                  */}
                  {row.expiredDocuments?.length > 0 && (
                    <span className="inline-flex items-center gap-1.5 font-bold text-red-700">
                      <AlertTriangle size={14} aria-hidden="true" />
                      {t('rev.expired')} · {fmt(row.expiredDocuments.length)}
                    </span>
                  )}
                </div>

                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-navy-700">
                  {t('rev.openRecord')}
                  <Arrow
                    size={14}
                    className={`transition-transform ${
                      isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'
                    }`}
                  />
                </span>
              </Link>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
