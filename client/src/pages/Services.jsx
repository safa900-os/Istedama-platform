import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BadgeCheck, FileCheck2, CalendarCheck, Briefcase, GraduationCap,
  Wallet, Scale, Cpu, Users, Search, ArrowRight, ArrowLeft, Clock, X, ChevronDown
} from 'lucide-react';
import ServiceVisual from '../components/ServiceVisual';
import { useLanguage } from '../context/LanguageContext';
import { SERVICE_CATEGORIES } from '../data/services';
import { fadeUp, stagger } from '../motion/presets';

const ICONS = { BadgeCheck, FileCheck2, CalendarCheck, Briefcase, GraduationCap, Wallet, Scale, Cpu, Users };

/** Solid tile behind each category's icon, in that category's accent. */
/*
 * `gold` carried `text-white` until now — a white glyph on the mark's orange
 * is 2.2:1, under the 3:1 an icon needs. Navy on that same fill is 7.8:1, and
 * it is the pairing the logo itself uses.
 */
const TILE = {
  navy: 'bg-navy-700 text-white',
  sky: 'bg-navy-500 text-white',
  gold: 'bg-accent-500 text-navy-900'
};

/**
 * The service catalogue.
 *
 * Nine categories, each holding three to five services — read as one long
 * scroll of nine full-width sections before, which meant the shape of the
 * catalogue was invisible: you could not tell how much there was, or which
 * category held what, without scrolling through all of it.
 *
 * So each category is now one card, and every card carries its whole service
 * list. Nine cards land in three rows, which is the entire programme in about
 * a screen — the question "what does this platform actually do" gets answered
 * at a glance instead of by scrolling.
 *
 * Two ways to narrow it, and they compose: a dropdown picks one category, the
 * search box filters across every category at once. Both sit at the top of the
 * page, directly under the heading, so the page opens on its controls and its
 * cards rather than on a paragraph about itself.
 *
 * The category filter was a row of nine chips that scrolled sideways: on any
 * screen narrower than about 1500px most of the categories were off the edge,
 * so the list of what exists was itself hidden behind a horizontal scroll. A
 * native select shows all nine at once, is one tap on a phone, and needs no
 * arrow-key handling of ours to work with a keyboard or a screen reader.
 *
 * A service is announced whether or not it is built yet, but a planned one is
 * drawn as a dead row with a clock rather than as a link that would go nowhere.
 */
export default function Services() {
  const { t, lang, fmt, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  // `translateX` is physical, not logical, so the direction of the nudge on
  // hover is picked here rather than through an `rtl:` utility.
  const nudge = isRTL ? 'group-hover/row:-translate-x-1' : 'group-hover/row:translate-x-1';

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SERVICE_CATEGORIES
      .filter((c) => categoryId === 'all' || c.id === categoryId)
      .map((c) =>
        q
          ? {
              ...c,
              items: c.items.filter(
                (i) =>
                  i.title[lang].toLowerCase().includes(q) ||
                  i.body[lang].toLowerCase().includes(q)
              )
            }
          : c
      )
      .filter((c) => c.items.length > 0);
  }, [query, categoryId, lang]);

  const resultCount = useMemo(
    () => visible.reduce((n, c) => n + c.items.length, 0),
    [visible]
  );

  const isNarrowed = Boolean(query.trim()) || categoryId !== 'all';

  return (
    <div className="pb-6">
      {/* -------------------------------------------- heading + controls */}
      <section className="border-b border-rule bg-wash-hero">
        <div className="mx-auto max-w-[1400px] px-3 py-10 sm:px-5 sm:py-12">
          <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="eyebrow">{t('svc.eyebrow')}</motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-3 font-display text-[2.25rem] font-black tracking-tight text-navy-900 sm:text-[2.75rem]"
            >
              {t('svc.title')}
            </motion.h1>

            {/*
              The controls, immediately under the heading. The lead paragraph
              and the two count pills that used to sit here are gone: the page
              is a catalogue, and the catalogue itself says what is in it.
            */}
            <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="field-shell flex-1">
                <Search size={16} className="field-glyph" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t('svc.search')}
                  aria-label={t('svc.search')}
                  className="field field-icon"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label={t('svc.clear')}
                    className="absolute inset-y-0 flex items-center px-3 text-ink-soft transition-colors hover:text-ink ltr:right-0 rtl:left-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              {/*
                A native select rather than a listbox of our own: it opens as
                the platform's own picker on a phone, it is already keyboard
                and screen-reader complete, and it does not need nine chips'
                worth of horizontal room. Each option carries its count, so
                the size of a category is known before it is chosen.
              */}
              <div className="relative sm:w-[19rem]">
                <label htmlFor="svc-category" className="sr-only">{t('svc.filter')}</label>
                <select
                  id="svc-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-[46px] w-full cursor-pointer appearance-none rounded-xl border border-rule bg-surface ps-4 pe-10 text-sm font-bold text-navy-900 shadow-soft transition-colors hover:border-navy-200 focus:border-navy-300 focus:outline-none"
                >
                  <option value="all">{t('svc.all')}</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title[lang]} ({fmt(c.items.length)})
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-muted"
                  style={isRTL ? { left: 14 } : { right: 14 }}
                />
              </div>
            </motion.div>

            {isNarrowed && (
              <p role="status" className="mt-3 text-xs text-ink-muted">
                {t('svc.results', { count: fmt(resultCount) })}
              </p>
            )}
          </motion.div>
        </div>
      </section>

      {/* -------------------------------------------------- category grid */}
      <div className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
        {visible.length === 0 ? (
          <p className="py-20 text-center text-sm text-ink-soft">{t('svc.none')}</p>
        ) : (
          <div
            /*
              A plain container, not a motion one: each card runs its own
              entrance, so a card the filter adds behaves exactly like one
              that was there from the start.

              A single card is centred rather than left stranded in the first
              cell of a three-column grid.
            */
            className={
              visible.length === 1
                ? 'mx-auto max-w-xl'
                : 'grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3'
            }
          >
            {visible.map((cat, index) => {
                const Icon = ICONS[cat.icon] || Briefcase;
                const liveCount = cat.items.filter((i) => i.status === 'live').length;

                // No exit animation and no `layout` on the card, deliberately.
                // Both were tried: with the parent driving these through
                // variants, an exiting card was re-asserted into its shown
                // state and left behind at `position: absolute`, so filtering
                // appeared to do nothing at all. A card that is filtered out
                // simply goes; one that arrives fades up, which is the half
                // worth animating.
                return (
                  <motion.article
                    key={cat.id}
                    variants={fadeUp}
                    initial="hidden"
                    animate="show"
                    /* On mount, not on scroll, unlike the rest of the site.
                       These cards appear in response to a click on a filter
                       chip, which means they mount already inside the
                       viewport — their appearance would then hang on a scroll
                       observer firing for an element that will never be
                       scrolled to. The reader asked for this card; nothing
                       about showing it should be conditional. */
                    custom={index % 3}
                    aria-labelledby={`cat-${cat.id}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-surface shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-2 hover:border-navy-200 hover:shadow-lift"
                  >
                    {/* Coloured band carrying the category's own glyph, so a
                        card is recognisable before its title is read. */}
                    <div className="relative">
                      <ServiceVisual icon={cat.icon} accent={cat.accent} className="h-16" />
                      <span
                        className={`absolute -bottom-6 start-5 flex h-14 w-14 items-center justify-center rounded-2xl border-4 border-surface shadow-card transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 ${TILE[cat.accent]}`}
                      >
                        <Icon size={22} strokeWidth={2} aria-hidden="true" />
                      </span>
                    </div>

                    <header className="px-5 pb-4 pt-9">
                      <h2
                        id={`cat-${cat.id}`}
                        className="font-display text-lg font-black leading-snug text-navy-900"
                      >
                        {cat.title[lang]}
                      </h2>
                      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                        {cat.blurb[lang]}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-ink-muted">
                        {t('svc.catCount', { live: fmt(liveCount), total: fmt(cat.items.length) })}
                      </span>
                    </header>

                    {/* `mt-auto` pins the service list to the bottom of the
                        card, so the lists line up across a row of cards whose
                        headings run to different lengths. */}
                    <ul className="mt-auto space-y-2 border-t border-rule/70 p-4">
                      {cat.items.map((item) => {
                        const isLive = item.status === 'live';

                        return (
                          <li key={item.id}>
                            {isLive ? (
                              <Link
                                to={item.to}
                                /*
                                  The row lifts a little and warms on
                                  hover. Colour alone said "this one is
                                  live" and "you are pointing at this" in
                                  the same two shades of the same blue.
                                */
                                className="group/row flex min-h-[48px] items-center gap-3 rounded-xl bg-mist/60 px-3.5 py-2.5 ring-1 ring-transparent transition-all duration-200 hover:bg-navy-50 hover:ring-navy-100"
                              >
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-bold leading-snug text-navy-900">
                                    {item.title[lang]}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-muted">
                                    {item.body[lang]}
                                  </span>
                                </span>
                                <Arrow
                                  size={14}
                                  aria-hidden="true"
                                  className={`shrink-0 text-navy-400 transition-transform duration-200 ${nudge}`}
                                />
                              </Link>
                            ) : (
                              /* Dashed, unclickable, and labelled in words —
                                 a planned service styled like a link would be
                                 a promise the page cannot keep. */
                              <div className="flex min-h-[48px] items-center gap-3 rounded-xl border border-dashed border-rule/80 bg-canvas/40 px-3.5 py-2.5">
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[13px] font-bold leading-snug text-ink-muted">
                                    {item.title[lang]}
                                  </span>
                                  <span className="mt-0.5 block text-[11px] leading-relaxed text-ink-soft">
                                    {item.body[lang]}
                                  </span>
                                </span>
                                <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold text-ink-soft">
                                  <Clock size={11} aria-hidden="true" /> {t('svc.soon')}
                                </span>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </motion.article>
                );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
