import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Landmark, Handshake, Search, X, Phone, MapPin, ChevronsDownUp, ChevronsUpDown
} from 'lucide-react';
import PartnerFinder from '../components/PartnerFinder';
import PartnerAccordion from '../components/PartnerAccordion';
import Modal from '../components/ui/Modal';
import { useLanguage } from '../context/LanguageContext';
import { STRATEGIC_PARTNERS, SERVICE_PARTNERS } from '../data/partners';
import { PARTNER_CATEGORIES, ALL_DIRECTORY_PARTNERS } from '../data/partnerDirectory';
import { pluralise } from '../utils/plural';
import { fadeUp, stagger, EASE } from '../motion/presets';

/**
 * The partners page.
 *
 * The roster used to be bands of logos stacked down the page: thirty-three
 * firms, all open, all at once. You could not see what categories existed
 * without scrolling through every member of every one of them, and the page had
 * no way to answer the question people actually arrive with — "is my bank on
 * here?".
 *
 * So the roster is now a set of disclosures, two to a row, with a search across
 * every firm in it. Searching opens the categories that match and hides the ones
 * that do not, so a query is answered on one screen rather than by scrolling.
 *
 * Every kind of partner is drawn by the same card — the six institutions behind
 * the programme included. They used to sit above the roster in a layout of
 * their own, which made one page read as two. They are the first group in the
 * list now, and the only one open when the page loads, so the question a
 * visitor arrives with is still answered without a click.
 *
 * Nothing here declares a partner of its own; both registries live in `data/`.
 */
export default function Partners() {
  const { t, lang, fmt, isRTL } = useLanguage();
  const [detail, setDetail] = useState(null);
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState(() => ['strategic']);

  /*
    One list, every kind of partner in it.

    The institutions behind the programme used to sit above the roster in a
    layout of their own — an open band of plates, then a set of cards. Two
    languages for the same thing on one page. They are the first group here
    now, drawn by the same card as the other eight.
  */
  const GROUPS = useMemo(
    () => [
      {
        id: 'strategic',
        glyph: 'Building2',
        name: { ar: 'الشركاء الاستراتيجيون', en: 'Strategic partners' },
        blurb: {
          ar: 'الجهات الوطنية والمصرفية التي يقوم عليها البرنامج ويصدر باسمها الاعتماد.',
          en: 'The national and banking bodies the programme rests on, and in whose name it certifies.'
        },
        members: STRATEGIC_PARTNERS
      },
      ...PARTNER_CATEGORIES,
      {
        /*
          The offers used to be a section of their own below the list, with its
          own heading and its own layout — the last thing on the page still
          insisting it was a different kind of thing. It is a group of partners
          like the rest, so it is a card like the rest; what differs is only
          what its panel draws, which is a map and a filterable list rather
          than a grid of marks.
        */
        id: 'offers',
        glyph: 'BadgePercent',
        name: { ar: t('partners.title'), en: t('partners.title') },
        blurb: { ar: t('partners.subtitle'), en: t('partners.subtitle') },
        members: SERVICE_PARTNERS,
        panel: <PartnerFinder />
      }
    ],
    [t]
  );

  const q = query.trim().toLowerCase();

  /*
    Matching runs over both languages at once. Someone typing "nizwa" on the
    Arabic page should still find بنك نزوى — the roster is bilingual and the
    keyboard in front of them may not be.
  */
  const results = useMemo(() => {
    if (!q) return GROUPS.map((c) => ({ cat: c, members: c.members }));
    return GROUPS.map((c) => {
      const catHit = `${c.name.ar} ${c.name.en}`.toLowerCase().includes(q);
      const members = c.members.filter((m) =>
        `${m.name.ar} ${m.name.en}`.toLowerCase().includes(q)
      );
      /*
        A group that draws its own panel is all-or-nothing: its panel shows
        everything it has whatever the query, so reporting "1 matching" over a
        list of twenty-four would be a lie. It matches whole or not at all.
      */
      if (c.panel) return { cat: c, members: catHit || members.length ? c.members : [] };
      return { cat: c, members: catHit && members.length === 0 ? c.members : members };
    }).filter((r) => r.members.length > 0);
  }, [q, GROUPS]);

  const hitCount = results.reduce((n, r) => n + r.members.length, 0);
  const allOpen = openIds.length === GROUPS.length;

  const toggle = (id) =>
    setOpenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));

  return (
    <div className="pb-4">
      {/*
        One panel, not two.

        The heading sat in a card and the roster sat on the page below it, so a
        visitor crossed a seam between the page introducing itself and the page
        doing its job. They are the same thing, so they are the same panel now.

        The totals moved to the foot of it: they summarise the list, and a
        summary reads better after the thing it summarises than before it.
      */}
      <section className="px-3 py-5 sm:px-5">
        <div className="mx-auto max-w-[1400px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="rounded-4xl border border-white/80 bg-wash-hero px-4 py-12 shadow-card sm:px-10 sm:py-14"
          >
            <motion.div variants={stagger(0.09)} initial="hidden" animate="show">
              <div className="max-w-3xl px-2">
                <motion.p variants={fadeUp} className="eyebrow">
                  {t('partnerMap.eyebrow')}
                </motion.p>
                <motion.h1
                  variants={fadeUp}
                  className="mt-4 font-display text-[2.2rem] font-black leading-[1.15] tracking-tight text-navy-900 sm:text-[2.9rem]"
                >
                  {t('partners.pageTitle')}
                </motion.h1>
                <motion.p variants={fadeUp} className="mt-6 text-[17px] leading-loose text-ink-muted">
                  {t('partners.pageLead')}
                </motion.p>
              </div>

              {/* ---------------------------------------------------- search */}
              <motion.div variants={fadeUp} className="mb-8 mt-10 px-2">
                <div className="relative">
                  <Search
                    size={17}
                    aria-hidden="true"
                    className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-soft"
                    style={isRTL ? { right: 18 } : { left: 18 }}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('directory.searchPlaceholder')}
                    aria-label={t('directory.searchLabel')}
                    className="h-[52px] w-full rounded-full border border-rule bg-surface ps-12 pe-12 text-sm text-ink shadow-soft transition-all duration-200 placeholder:text-ink-soft focus:border-navy-300 focus:shadow-card focus:outline-none"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label={t('directory.clearSearch')}
                      className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-mist hover:text-navy-700"
                      style={isRTL ? { left: 8 } : { right: 8 }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                  {/*
                    The count is a live region: with the list filtering as you
                    type, someone not seeing it gets no signal that anything
                    happened.
                  */}
                  <p aria-live="polite" className="text-xs text-ink-muted">
                    {q
                      ? t('directory.matchCount', { count: fmt(hitCount) })
                      : pluralise(ALL_DIRECTORY_PARTNERS.length, lang, t, fmt, 'directory.count')}
                  </p>

                  <button
                    type="button"
                    onClick={() => setOpenIds(allOpen ? [] : GROUPS.map((c) => c.id))}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-navy-700 transition-colors hover:bg-navy-50"
                  >
                    {allOpen ? <ChevronsDownUp size={14} /> : <ChevronsUpDown size={14} />}
                    {allOpen ? t('directory.collapseAll') : t('directory.expandAll')}
                  </button>
                </div>
              </motion.div>

              {/*
                Columns, not a grid.

                A two-column grid ties the two cards in a row to one row height.
                Open everything and the twelve financial partners sit beside a
                group of one, leaving most of a screen of white space under the
                short one.

                CSS multi-column has no rows to tie anything to: each card is as
                tall as its own contents and the next starts immediately below
                it, so the holes cannot occur. It also keeps the cards in
                document order, so Tab still walks the groups top to bottom —
                two hand-split columns would have sent it 1, 3, 5, 7, 2, 4, 6.
              */}
              {results.length === 0 ? (
                <div className="mx-auto max-w-md rounded-3xl border border-rule bg-surface p-10 text-center shadow-soft">
                  <Search size={30} className="mx-auto text-ink-soft" strokeWidth={1.5} />
                  <p className="mt-4 text-sm text-ink-muted">{t('directory.noResults')}</p>
                </div>
              ) : (
                <div className="columns-1 gap-5 px-2 xl:columns-2">
                  {results.map(({ cat, members }) => (
                    <PartnerAccordion
                      key={cat.id}
                      /* The position in the full list, not in the filtered one,
                         so a group keeps its colour while search narrows it. */
                      index={GROUPS.findIndex((g) => g.id === cat.id)}
                      category={q ? { ...cat, members } : cat}
                      count={members.length}
                      open={Boolean(q) || openIds.includes(cat.id)}
                      onToggle={() => toggle(cat.id)}
                      onSelect={(m, c) => setDetail({ ...m, category: c })}
                    />
                  ))}
                </div>
              )}

              {/*
                The same anatomy as the cards above: a tinted tile carrying a
                line icon, then the figure with its label under it. They were
                three loose icon-and-number pairs floating on the panel, at a
                different alignment and a different rhythm from everything else
                on the page — three equal cells in the grid the cards already
                use makes them part of the page rather than a footnote to it.
              */}
              <motion.dl
                variants={fadeUp}
                className="mx-2 mt-10 grid gap-4 border-t border-white/70 pt-8 sm:grid-cols-3"
              >
                {[
                  [fmt(STRATEGIC_PARTNERS.length), t('partners.countStrategic'), Building2],
                  [fmt(ALL_DIRECTORY_PARTNERS.length), t('partners.countRoster'), Handshake],
                  [fmt(SERVICE_PARTNERS.length), t('partners.countService'), Landmark]
                ].map(([value, label, Icon]) => (
                  <div
                    key={label}
                    className="flex items-center gap-3.5 rounded-2xl border border-rule bg-surface/70 p-4 shadow-soft"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                      <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <dt className="font-display text-2xl font-black leading-none text-navy-900">
                        {value}
                      </dt>
                      <dd className="mt-1.5 text-xs font-bold leading-snug text-ink-muted">{label}</dd>
                    </div>
                  </div>
                ))}
              </motion.dl>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/*
        Detail panel. Uses the shared Modal rather than a bespoke overlay so it
        inherits Escape-to-close, the focus trap and focus restoration — a
        hand-rolled dialog here would silently lose all three.
      */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? detail.name[lang] : ''}
        size="sm"
      >
        {detail && (
          <div>
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-rule">
                <img src={detail.logo} alt="" className="h-full w-full object-contain" />
              </span>
              <span className={detail.primary ? 'pill-info' : 'pill-muted'}>
                {detail.kind ? detail.kind[lang] : detail.category?.name[lang]}
              </span>
            </div>

            <dl className="mt-6 space-y-px overflow-hidden rounded-2xl border border-rule bg-rule">
              {[
                detail.city && [t('partners.location'), detail.city[lang], MapPin],
                detail.address && [t('directory.address'), detail.address[lang], MapPin],
                detail.phone && [t('directory.phone'), detail.phone, Phone],
                detail.lat != null && [
                  t('partners.coordinates'),
                  `${fmt(detail.lat, { maximumFractionDigits: 3 })}, ${fmt(detail.lng, { maximumFractionDigits: 3 })}`,
                  MapPin
                ]
              ]
                .filter(Boolean)
                .map(([label, value, Icon]) => (
                  <div key={label} className="flex items-start gap-4 bg-surface px-4 py-3 text-sm">
                    <dt className="flex shrink-0 items-center gap-2 text-ink-muted">
                      <Icon size={14} aria-hidden="true" /> {label}
                    </dt>
                    <dd
                      className="ms-auto text-end font-bold text-ink"
                      dir={label === t('partners.coordinates') ? 'ltr' : undefined}
                    >
                      {/* A published telephone number should be dialable from a
                          phone rather than something to copy out by hand. */}
                      {label === t('directory.phone') ? (
                        <a
                          href={`tel:+968${String(value).split(/[^0-9]+/)[0]}`}
                          dir="ltr"
                          className="text-navy-700 underline decoration-navy-200 underline-offset-4 hover:decoration-navy-700"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
            </dl>

            {!detail.phone && !detail.city && !detail.address && (
              <p className="mt-5 text-center text-xs leading-relaxed text-ink-soft">
                {t('directory.noDetails')}
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
