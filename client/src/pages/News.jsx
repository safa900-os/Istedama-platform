import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Newspaper } from 'lucide-react';
import api from '../api/axios';
import SectionHead from '../components/SectionHead';
import { useLanguage } from '../context/LanguageContext';

export default function News() {
  const { t, pick, fmt, lang } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/content/news', { params: { limit: 24 } })
      .then((res) => setPosts(res.data.data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  /*
    Only posts that carry a photograph. The page is a wall of pictures now, so
    a post without one would sit in it as a gap rather than as a card — and the
    gold rule that used to stand in for a missing picture was standing in for
    nothing.

    This hides content: three of the six posts on the register have no image.
    Adding one to a post brings it straight back.
  */
  const visible = useMemo(() => posts.filter((p) => p.image), [posts]);


  const formatDate = (iso) =>
    new Intl.DateTimeFormat(lang === 'ar' ? 'ar-OM' : 'en-GB', {
      day: 'numeric', month: 'long', year: 'numeric'
    }).format(new Date(iso));

  return (
    <div>
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="eyebrow">{t('news.eyebrow')}</p>
          <h1 className="mt-3 font-display text-[2.25rem] font-black tracking-tight text-navy-900 sm:text-[2.75rem]">
            {t('news.title')}
          </h1>
          <div className="mt-4 h-[3px] w-14 rounded bg-gold-500" />
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-ink-muted">{t('news.pageLead')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        {loading ? (
          <p className="text-sm text-ink-soft">{t('news.loading')}</p>
        ) : visible.length === 0 ? (
          <div className="card-pad text-center">
            <Newspaper size={34} className="mx-auto text-ink-soft" strokeWidth={1.6} />
            <p className="mt-3 text-sm text-ink-muted">{t('news.empty')}</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {visible.map((post, i) => (
              <motion.article
                key={post._id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
                className="card flex flex-col overflow-hidden"
              >
                {/* 4:3, because the press shots themselves run about 4:3 —
                    the fixed 176px band this replaced letterboxed them and
                    took the tops of heads off. Every post here has a picture:
                    the list keeps only those. */}
                <div className="aspect-[4/3] shrink-0 overflow-hidden bg-mist">
                  <img
                    src={post.image}
                    alt={pick(post, 'title')}
                    loading="lazy"
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-display text-lg font-bold leading-snug text-navy-900">
                    {pick(post, 'title')}
                  </h2>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{pick(post, 'excerpt')}</p>
                  <p className="mt-5 flex items-center gap-1.5 border-t border-rule pt-4 text-xs text-ink-soft">
                    <CalendarDays size={13} /> {t('news.published')} {formatDate(post.publishedAt)}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
