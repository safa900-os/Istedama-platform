import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import api from '../api/axios';
import SectionHead from './SectionHead';
import MotionCard from './ui/MotionCard';
import { useLanguage } from '../context/LanguageContext';
import { staggerList } from '../motion/variants';

export default function NewsStrip() {
  const { t, pick, lang, isRTL } = useLanguage();

  const [posts, setPosts] = useState([]);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  /*
    Fetch more than the three shown, then keep the first three that carry a
    photograph. Asking the API for exactly three and filtering afterwards would
    leave the strip short whenever one of them had no picture.
  */
  useEffect(() => {
    api
      .get('/content/news', { params: { limit: 12 } })
      .then((res) => setPosts(res.data.data.filter((p) => p.image).slice(0, 3)))
      .catch(() => setPosts([]));
  }, []);

  if (!posts.length) return null;

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-OM' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <SectionHead eyebrow={t('news.eyebrow')} title={t('news.title')} />
      <motion.div variants={staggerList} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }} className="mt-10 grid gap-5 md:grid-cols-3">
        {posts.map((p) => (
          <MotionCard key={p._id} className="flex flex-col overflow-hidden">
            {/* Every post in the strip has one: the fetch keeps only those. */}
            <div className="aspect-[4/3] shrink-0 overflow-hidden bg-mist">
                <img
                  src={p.image}
                  alt={pick(p, 'title')}
                  loading="lazy"
                className="h-full w-full object-cover object-center"
              />
            </div>

            <div className="flex flex-1 flex-col p-6">
              <span className="text-xs text-ink-soft">{fmtDate(p.publishedAt)}</span>
              <h3 className="mt-3 font-display text-base font-bold leading-snug text-navy-900">{pick(p, 'title')}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted">{pick(p, 'excerpt')}</p>
              <motion.span whileHover={{ x: isRTL ? -3 : 3 }} className="mt-5 flex items-center gap-1.5 text-sm font-bold text-navy-700">
                {t('news.readMore')} <Arrow size={14} />
              </motion.span>
            </div>
          </MotionCard>
        ))}
      </motion.div>
    </section>
  );
}
