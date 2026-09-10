import { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, Handshake, Scale, Calculator, Stethoscope,
  Landmark, Banknote, Cpu, ShieldCheck, Building2, BadgePercent
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { pluralise } from '../utils/plural';
import { EASE } from '../motion/presets';

/**
 * One group of partners, as a disclosure.
 *
 * Every kind of partner on the page is drawn by this: the institutions behind
 * the programme and the eight categories of the published roster alike. They
 * used to be two different layouts — an open band of plates above a set of
 * cards — so one page read as two pages stapled together, and the eye had to
 * relearn what a partner group looked like halfway down.
 *
 * The card is one row: a tinted tile carrying the group's own glyph, the name
 * and its count, and a chevron. A coloured bar down the leading edge gives the
 * group an identity at a glance without a second row of anything.
 *
 * Built on the real disclosure pattern rather than a div that toggles a class:
 * the heading contains the button, `aria-expanded` says which way it is, and
 * `aria-controls` points at a region labelled by that heading. A screen reader
 * therefore announces "الشريك القانوني, collapsed, button" and, on opening,
 * lands in a region with the same name. The chevron is decorative — it turns,
 * but the state it conveys is already in `aria-expanded`.
 */

/*
 * The icons are drawn, not fetched.
 *
 * The programme ships each category as a PNG of a filled navy circle with a
 * white glyph inside it. Dropped into a pale tile that reads as a dark blob
 * with something in the middle — and at 28px the glyph itself is mush. A line
 * icon in the tile's own hue is sharp at any size, weighs nothing, and takes
 * the tint with it. `data/partnerDirectory.js` already names one per category
 * in its `glyph` field.
 *
 * Five tones, drawn from the two brand hues so the page still belongs to the
 * mark. The bar, the tile and the glyph always agree, and none of them ever
 * carries meaning on its own — every group is named in words beside them.
 */
const GLYPHS = {
  Handshake, Scale, Calculator, Stethoscope, HeartPulse: Stethoscope,
  Landmark, Banknote, Cpu, ShieldCheck, Building2, BadgePercent
};
const TONES = [
  { bar: 'from-navy-700 to-navy-400', tile: 'bg-navy-50', ring: 'ring-navy-100', ink: 'text-navy-700', chev: 'bg-navy-50 text-navy-700' },
  { bar: 'from-accent-600 to-accent-300', tile: 'bg-accent-50', ring: 'ring-accent-200', ink: 'text-accent-700', chev: 'bg-accent-50 text-accent-700' },
  { bar: 'from-navy-500 to-navy-300', tile: 'bg-navy-100', ring: 'ring-navy-200', ink: 'text-navy-600', chev: 'bg-navy-100 text-navy-600' },
  { bar: 'from-accent-700 to-accent-400', tile: 'bg-accent-100', ring: 'ring-accent-300', ink: 'text-accent-700', chev: 'bg-accent-100 text-accent-700' },
  { bar: 'from-navy-900 to-navy-500', tile: 'bg-navy-50', ring: 'ring-navy-300', ink: 'text-navy-900', chev: 'bg-navy-50 text-navy-900' }
];

export default function PartnerAccordion({ category, open, onToggle, onSelect, count, index = 0 }) {
  const { lang, fmt, t, isRTL } = useLanguage();
  const uid = useId();
  const panelId = `pa-panel-${uid}`;
  const headId = `pa-head-${uid}`;

  const members = category.members;
  const shown = count ?? members.length;
  // Keyed to position, so the cycle uses every tone and stays put while the
  // list is being filtered. A hash over the ids clumped onto three of the five.
  const tone = TONES[index % TONES.length];
  const Chevron = isRTL ? ChevronLeft : ChevronRight;
  const Glyph = GLYPHS[category.glyph] || Handshake;

  return (
    <section
      /*
        `break-inside-avoid` keeps a group whole when the page lays these out in
        columns; `mb-4` is the vertical spacing, because multi-column has no row
        gap to set. `scroll-mt` so opening one near the top of the viewport does
        not tuck its heading under the sticky bar.
      */
      className={`group/card relative mb-4 scroll-mt-28 break-inside-avoid overflow-hidden rounded-2xl border bg-surface transition-all duration-300 ${
        open
          ? 'border-navy-200 shadow-lift'
          : 'border-rule shadow-soft hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift'
      }`}
    >
      {/* The group's colour, down the leading edge. */}
      <span
        aria-hidden="true"
        className={`absolute inset-y-0 start-0 w-1.5 bg-gradient-to-b ${tone.bar}`}
      />

      <h3 id={headId} className="relative m-0">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex w-full items-center gap-4 py-4 pe-5 ps-7 text-start sm:gap-5 sm:py-5 sm:pe-6 sm:ps-8"
        >
          <span
            className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ring-1 transition-transform duration-300 group-hover/card:scale-105 ${tone.tile} ${tone.ring}`}
          >
            <Glyph size={25} strokeWidth={1.8} aria-hidden="true" className={tone.ink} />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block font-display text-[15px] font-black leading-snug text-navy-900 sm:text-base">
              {category.name[lang]}
            </span>
            <span className="mt-1 block text-xs text-ink-soft">
              {pluralise(shown, lang, t, fmt, 'directory.count')}
            </span>
          </span>

          {/*
            Turned by CSS, not by the animation library. `animate={{ rotate }}`
            needs an animation frame, and there are contexts that never grant
            one — a background tab, a suspended preview — where the chevron then
            sits at 0deg for ever while the panel underneath is open. A class
            swap cannot desynchronise from the state that sets it, and the
            reduced-motion setting already strips the transition.
          */}
          <span
            aria-hidden="true"
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${tone.chev} ${
              open ? (isRTL ? '-rotate-90' : 'rotate-90') : 'rotate-0'
            }`}
          >
            <Chevron size={18} strokeWidth={2.4} />
          </span>
        </button>
      </h3>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            role="region"
            aria-labelledby={headId}
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: EASE }}
            className="relative overflow-hidden"
          >
            <div className="border-t border-rule py-5 pe-5 ps-7 sm:pe-6 sm:ps-8">
              {category.blurb && (
                <p className="mb-5 text-[13px] leading-relaxed text-ink-muted">{category.blurb[lang]}</p>
              )}

              {/* A group may bring its own panel — the offers group draws a map
                  and a filterable list rather than a grid of marks. */}
              {category.panel ? (
                category.panel
              ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-3">
                {members.map((m) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(m, category)}
                      className="group flex h-full w-full flex-col items-center rounded-2xl border border-rule/70 bg-canvas p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-navy-200 hover:bg-surface hover:shadow-card"
                    >
                      {/*
                        White plate behind every mark. These logos arrive with
                        their own white backgrounds already; on a tinted card
                        each one showed as a pale rectangle of a slightly
                        different white.
                      */}
                      <span className="flex h-16 w-full items-center justify-center overflow-hidden rounded-xl bg-white p-2 ring-1 ring-rule/70">
                        <img
                          src={m.logo}
                          alt=""
                          loading="lazy"
                          className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                      </span>
                      <span className="mt-2.5 line-clamp-3 text-[11px] font-bold leading-snug text-navy-700 transition-colors group-hover:text-navy-900">
                        {m.name[lang]}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
