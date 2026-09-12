import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellOff, CheckCheck, CheckCircle2, FileWarning, Info, XCircle } from 'lucide-react';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

/*
  What the platform has told this user.

  A registration decision is the moment somebody learns whether they may trade,
  and the notice carries the moment it was made — an applicant's second
  question, after "was I approved?", is always "when?". So the date and time
  are shown in full rather than as "3 days ago", which answers a different
  question and stops being true as you read it.
*/

const GLYPH = {
  registration_approved: { Icon: CheckCircle2, tone: 'bg-teal-50 text-teal-700' },
  registration_rejected: { Icon: XCircle, tone: 'bg-red-50 text-red-700' },
  registration_under_review: { Icon: Info, tone: 'bg-navy-50 text-navy-700' },
  document_expired: { Icon: FileWarning, tone: 'bg-red-50 text-red-700' },
  document_expiring: { Icon: FileWarning, tone: 'bg-accent-100 text-accent-700' },
  bid_awarded: { Icon: CheckCircle2, tone: 'bg-teal-50 text-teal-700' },
  bid_rejected: { Icon: XCircle, tone: 'bg-navy-50 text-navy-700' },
  general: { Icon: Info, tone: 'bg-navy-50 text-navy-700' }
};

export default function Notifications() {
  const { t, pick, fmt, lang } = useLanguage();

  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/notifications')
      .then((res) => {
        setItems(res.data.data);
        setUnread(res.data.unreadCount);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const stamp = (d) =>
    new Date(d).toLocaleString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const markAll = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    load();
  };

  const markOne = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    load();
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold text-navy-900">{t('notif.title')}</h1>
        {unread > 0 && (
          <button type="button" onClick={markAll} className="btn-quiet text-sm">
            <CheckCheck size={15} aria-hidden="true" /> {t('notif.markAllRead')}
          </button>
        )}
      </div>

      {unread > 0 && (
        <p className="mt-2 text-sm font-bold text-navy-700">
          {fmt(unread)} {t('notif.unread')}
        </p>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl border border-rule bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="mt-12 flex items-center gap-2 text-sm text-ink-muted">
          <BellOff size={16} aria-hidden="true" /> {t('notif.empty')}
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((n, i) => {
            const { Icon, tone } = GLYPH[n.kind] || GLYPH.general;
            return (
              <motion.li
                key={n._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className={`rounded-xl border p-5 ${
                  n.isRead ? 'border-rule bg-surface' : 'border-navy-200 bg-navy-50'
                }`}
              >
                <div className="flex gap-4">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                    <Icon size={17} aria-hidden="true" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-display font-bold text-navy-900">{pick(n, 'title')}</p>
                      {!n.isRead && <span className="pill-info">{t('notif.new')}</span>}
                    </div>

                    <p className="mt-1.5 text-sm leading-relaxed text-ink">{pick(n, 'body')}</p>

                    {/* The moment it was decided, in full. */}
                    <p className="mt-2.5 font-mono text-xs text-ink-soft">{stamp(n.createdAt)}</p>

                    {!n.isRead && (
                      <button
                        type="button"
                        onClick={() => markOne(n._id)}
                        className="mt-3 text-sm font-bold text-navy-700 hover:text-navy-900"
                      >
                        {t('notif.markAllRead')}
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
