import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, FileText, ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import SectionHead from '../components/SectionHead';
import MotionCard from '../components/ui/MotionCard';
import { useLanguage } from '../context/LanguageContext';
import { staggerList } from '../motion/variants';

const CATEGORIES = ['all', 'maintenance', 'supply', 'consulting', 'construction', 'technology'];
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

export default function Tenders() {
  const { t, pick, fmt, lang, isRTL } = useLanguage();
  const [tenders, setTenders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    setLoading(true);
    api
      .get('/content/tenders', { params: { category: filter === 'all' ? undefined : filter } })
      .then((res) => setTenders(res.data.data))
      .catch(() => setTenders([]))
      .finally(() => setLoading(false));
  }, [filter]);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

  return (
    <div>
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <SectionHead eyebrow={t('tenders.eyebrow')} title={t('tenders.title')} lead={t('tenders.lead')} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <motion.button
              key={c}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(c)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                filter === c ? 'text-white' : 'border border-rule bg-surface text-ink-muted hover:text-navy-700'
              }`}
            >
              {filter === c && (
                <motion.span
                  layoutId="tender-filter"
                  className="absolute inset-0 rounded-full bg-navy-700"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                />
              )}
              <span className="relative">{t(c === 'all' ? 'tenders.all' : `tenders.${c}`)}</span>
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl border border-rule bg-surface" />
            ))}
          </div>
        ) : tenders.length === 0 ? (
          <p className="mt-10 text-sm text-ink-muted">{t('tenders.empty')}</p>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={filter}
              variants={staggerList}
              initial="hidden"
              animate="show"
              className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {tenders.map((tender) => (
                <MotionCard key={tender._id} className="flex flex-col p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="pill-info">{t(`tenders.${tender.category}`)}</span>
                    <span className="font-mono text-sm font-bold text-ink-soft">#{fmt(tender.refNo)}</span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-bold leading-snug text-navy-900">
                    {pick(tender, 'title')}
                  </h3>
                  <p className="mt-1.5 text-sm text-ink-muted">{pick(tender, 'orgName')}</p>

                  <ul className="mt-4 space-y-2 text-sm text-ink-muted">
                    <li className="flex items-center gap-2">
                      <Calendar size={14} className="shrink-0 text-ink-soft" />
                      {fmtDate(tender.closingDate)}
                    </li>
                    <li className="flex items-center gap-2">
                      <MapPin size={14} className="shrink-0 text-ink-soft" />
                      {pick(tender, 'location') || t('tenders.remote')}
                    </li>
                    <li className="flex items-center gap-2">
                      <FileText size={14} className="shrink-0 text-ink-soft" />
                      {tender.documentsRequired ? t('tenders.docsRequired') : t('tenders.docsNotRequired')}
                    </li>
                  </ul>

                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-rule pt-4">
                    <span className={`pill ${STATUS_CLASS[tender.status]}`}>{t(STATUS_KEY[tender.status])}</span>
                    <Link
                      to={`/tenders/${tender._id}`}
                      className="group flex items-center gap-1.5 text-sm font-bold text-navy-700 hover:text-navy-900"
                    >
                      {t('tenders.viewDetails')}
                      <Arrow
                        size={14}
                        className={`transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`}
                      />
                    </Link>
                  </div>
                </MotionCard>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </section>
    </div>
  );
}
