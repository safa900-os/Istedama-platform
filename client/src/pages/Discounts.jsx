import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Tag, LayoutGrid, Percent, ShieldCheck, Smartphone } from 'lucide-react';
import api from '../api/axios';
import SectionHead from '../components/SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { staggerList, riseItem, EASE } from '../motion/variants';

const CATEGORIES = ['all', 'financial', 'health', 'legal', 'technology', 'insurance'];

// Category tints. Kept desaturated so the page stays within the institutional
// palette rather than turning into a row of primary colours.
const TINT = {
  financial: 'from-navy-700 to-navy-900',
  health: 'from-accent-500 to-accent-700',
  legal: 'from-navy-500 to-navy-700',
  technology: 'from-gold-600 to-gold-800',
  insurance: 'from-navy-400 to-navy-600'
};

const FEATURES = [
  { icon: Tag, titleKey: 'disc.f1t', bodyKey: 'disc.f1b' },
  { icon: LayoutGrid, titleKey: 'disc.f2t', bodyKey: 'disc.f2b' },
  { icon: Percent, titleKey: 'disc.f3t', bodyKey: 'disc.f3b' },
  { icon: ShieldCheck, titleKey: 'disc.f4t', bodyKey: 'disc.f4b' },
  { icon: Smartphone, titleKey: 'disc.f5t', bodyKey: 'disc.f5b' }
];

export default function Discounts() {
  const { t, pick, fmt } = useLanguage();
  const [items, setItems] = useState([]);
  const [category, setCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('/content/discounts', { params: { category: category === 'all' ? undefined : category } })
      .then((res) => setItems(res.data.data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [category]);

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard unavailable — the code stays visible on the card regardless */
    }
  };

  return (
    <div>
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <SectionHead eyebrow={t('disc.eyebrow')} title={t('disc.title')} lead={t('disc.lead')} />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <motion.button
              key={c}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCategory(c)}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === c ? 'text-white' : 'border border-rule bg-surface text-ink-muted hover:text-navy-700'
              }`}
            >
              {category === c && (
                <motion.span layoutId="disc-filter" className="absolute inset-0 rounded-full bg-navy-700"
                  transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
              )}
              <span className="relative">{t(`disc.${c}`)}</span>
            </motion.button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-60 animate-pulse rounded-xl border border-rule bg-surface" />)}
          </div>
        ) : items.length === 0 ? (
          <p className="mt-10 text-sm text-ink-muted">{t('disc.empty')}</p>
        ) : (
          <motion.div key={category} variants={staggerList} initial="hidden" animate="show" className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((d) => (
              <motion.article
                key={d._id}
                variants={riseItem}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.22, ease: EASE }}
                className="overflow-hidden rounded-xl border border-rule bg-surface shadow-card"
              >
                <div className={`relative bg-gradient-to-br ${TINT[d.category] || TINT.financial} p-6`}>
                  <span className="absolute end-3 top-3 rounded-full bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white">
                    {t(`disc.${d.category}`)}
                  </span>
                  <motion.p
                    initial={{ scale: 0.85, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-6 font-display text-4xl font-black text-white"
                  >
                    {fmt(d.percentage)}%
                  </motion.p>
                </div>

                <div className="p-5">
                  <h3 className="font-display text-base font-bold text-navy-900">{pick(d, 'partnerName')}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{pick(d, 'description')}</p>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => copy(d.code)}
                    className="btn-primary mt-4 w-full !px-3"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copied === d.code ? (
                        <motion.span key="c" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2">
                          <Check size={15} strokeWidth={3} /> {t('disc.copied')}
                        </motion.span>
                      ) : (
                        <motion.span key="u" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="flex items-center gap-2">
                          <Copy size={14} /> {t('disc.use')}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>

                  <p className="mt-2.5 text-center font-mono text-xs tracking-wider text-ink-soft">
                    {t('disc.code')}: {d.code}
                  </p>
                </div>
              </motion.article>
            ))}
          </motion.div>
        )}

        <p className="mt-8 text-center text-xs text-ink-soft">{t('disc.membersOnly')}</p>
      </section>
    </div>
  );
}
