import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink, MapPin } from 'lucide-react';
import SectionHead from './SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { GCC_CHAMBERS, flagFor } from '../data/programme';
import { fadeUp, inView, EASE } from '../motion/presets';

/**
 * Chambers of commerce across the GCC.
 *
 * The map carries the whole section: each chamber's name appears on the map
 * itself when its pin is pointed at, focused, or tapped. There is deliberately
 * no list of cards beside it — the partners section a little further up the
 * page is already a map paired with a card list, and repeating that layout made
 * the two read as the same component twice rather than as two different things.
 *
 * Showing one name at a time is also what makes labelling on the map possible:
 * six permanent pills would overlap around the Gulf, where four of the six
 * capitals sit within a few hundred kilometres of each other.
 *
 * Each pin is a link, not a decoration — it carries the chamber's full name as
 * its accessible name and opens that chamber's own site.
 */

/*
 * Boundaries projected into the viewBox below from the same public-domain
 * geometry used elsewhere in the app. Bahrain is absent from that dataset —
 * it is a small island group and the source has no polygon for it — so it
 * carries a pin without a landmass. Said plainly here so the omission is not
 * mistaken for an oversight.
 */
const VIEW = { w: 760, h: 520 };

const LAND = {
  SAU:
    'M250.8,497.1 L247.1,484.1 L238.5,474.9 L236.3,462.7 L221.6,451.7 L206.3,426.0 L198.3,401.1 ' +
    'L178.5,380.1 L165.8,375.0 L146.8,345.9 L143.5,324.6 L144.8,306.5 L128.4,272.6 L115.0,260.7 ' +
    'L99.5,254.3 L90.1,236.8 L91.7,229.9 L83.8,214.0 L75.4,207.2 L64.3,184.4 L46.9,159.8 ' +
    'L32.3,138.8 L18.1,138.9 L22.5,122.1 L23.8,111.4 L27.3,99.2 L59.1,104.1 L71.5,94.7 ' +
    'L78.3,83.7 L100.1,79.4 L104.8,69.2 L114.3,64.0 L85.8,33.4 L143.0,18.0 L148.4,13.4 ' +
    'L182.9,21.7 L225.4,43.1 L306.0,104.6 L359.1,107.1 L384.6,110.0 L391.7,124.6 L411.9,123.8 ' +
    'L423.1,150.2 L437.1,157.2 L442.0,167.9 L461.5,180.8 L463.2,193.4 L460.4,203.6 L464.0,213.9 ' +
    'L472.2,222.4 L476.0,232.5 L480.3,240.0 L488.9,246.0 L496.8,243.9 L502.3,255.5 L503.4,262.6 ' +
    'L514.3,293.6 L600.2,309.0 L606.0,302.6 L619.0,324.2 L600.0,385.4 L514.3,416.0 L431.9,427.7 ' +
    'L405.2,441.5 L384.8,473.6 L371.4,478.7 L364.3,468.5 L353.3,470.0 L325.7,467.0 L320.5,463.9 ' +
    'L287.5,464.6 L279.8,467.4 L268.0,459.4 L260.5,474.5 L263.4,487.4 Z',
  KWT:
    'M399.3,80.3 L405.2,93.8 L402.7,100.7 L411.9,123.8 L391.7,124.6 L384.6,110.0 L359.1,107.1 ' +
    'L380.1,77.7 Z',
  QAT:
    'M480.3,240.0 L478.4,217.7 L486.1,201.7 L493.9,198.4 L502.5,208.0 L503.0,225.9 L496.8,243.9 ' +
    'L488.9,246.0 Z',
  ARE:
    'M502.3,255.5 L507.4,254.1 L508.4,262.5 L530.8,257.6 L554.4,258.4 L571.7,259.3 L591.2,238.7 ' +
    'L612.5,219.0 L630.6,200.2 L636.0,210.6 L639.9,234.8 L625.3,234.9 L623.0,254.8 L628.0,259.1 ' +
    'L615.1,265.1 L615.0,277.6 L606.7,290.3 L606.0,302.6 L600.2,309.0 L514.3,293.6 L503.4,262.6 Z',
  OMN:
    'M710.3,351.3 L699.7,372.3 L686.7,370.7 L680.8,378.0 L676.2,393.5 L679.7,413.9 L677.0,417.7 ' +
    'L663.8,417.6 L646.0,429.0 L643.2,443.9 L636.7,450.4 L618.9,450.1 L607.7,457.8 L607.9,470.2 ' +
    'L594.0,478.7 L578.3,475.8 L559.2,486.1 L546.0,487.9 L536.6,466.5 L514.3,416.0 L600.0,385.4 ' +
    'L619.0,324.2 L606.0,302.6 L606.7,290.3 L615.0,277.6 L615.1,265.1 L628.0,259.1 L623.0,254.8 ' +
    'L625.3,234.9 L639.9,234.8 L652.7,255.7 L668.7,266.8 L689.6,270.8 L706.5,276.3 L719.4,293.9 ' +
    'L727.1,304.0 L737.4,307.9 L737.3,314.7 L726.9,333.0 L722.4,341.6 Z',
  OMN_MUSANDAM: 'M639.8,205.1 L636.0,210.6 L630.6,200.2 L638.9,189.8 L642.4,192.4 Z'
};

/** Which silhouette belongs to which chamber, for the highlight. */
const LAND_FOR = {
  saudi: ['SAU'],
  kuwait: ['KWT'],
  qatar: ['QAT'],
  uae: ['ARE'],
  oman: ['OMN', 'OMN_MUSANDAM'],
  bahrain: []
};

/** Pin positions, projected from each chamber's headquarters coordinate. */
const PINS = {
  oman: { x: 696.7, y: 275.7 },
  saudi: { x: 362.2, y: 241.2 },
  uae: { x: 607.7, y: 226.2 },
  qatar: { x: 500.9, y: 223.7 },
  bahrain: { x: 473.9, y: 194.9 },
  kuwait: { x: 399.4, y: 98.6 }
};

/**
 * Which side of its pin a label sits on.
 *
 * A label anchored on the same side for every pin runs off the map for the
 * ones near an edge — Oman sits at 92% of the width. Each label opens toward
 * the middle of the map instead, so it always has room.
 */
const labelSide = (x) => (x / VIEW.w > 0.55 ? 'end' : 'start');

export default function GccChambers() {
  const { t, lang } = useLanguage();
  // Nothing is highlighted until the reader points at something. Opening with
  // a pin pre-selected would suggest a choice had already been made for them.
  const [activeId, setActiveId] = useState(null);
  const activeLand = new Set(LAND_FOR[activeId] || []);

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      <SectionHead
        eyebrow={t('gcc.eyebrow')}
        title={t('gcc.title')}
        lead={t('gcc.lead')}
        center
      />

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="relative mx-auto mt-12 w-full max-w-4xl"
        onMouseLeave={() => setActiveId(null)}
      >
        {/* The landmass. Purely decorative: every chamber is reachable through
            the links layered over it, so the drawing itself is hidden from
            assistive technology rather than described twice. */}
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          className="h-auto w-full"
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <linearGradient id="gcc-land" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#D8DFF5" />
              <stop offset="100%" stopColor="#B0BEEE" />
            </linearGradient>
            <linearGradient id="gcc-land-on" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#506ED2" />
              <stop offset="100%" stopColor="#223E98" />
            </linearGradient>
          </defs>

          {Object.entries(LAND).map(([key, d]) => (
            <path
              key={key}
              d={d}
              fill={activeLand.has(key) ? 'url(#gcc-land-on)' : 'url(#gcc-land)'}
              stroke="#8299E4"
              strokeWidth="1.5"
              strokeLinejoin="round"
              className="transition-[fill] duration-300"
            />
          ))}
        </svg>

        {/*
          Pins and their labels are HTML laid over the drawing rather than SVG
          text. A pill has to size itself to the name inside it, and the names
          are Arabic — both of which HTML does correctly and SVG text does not
          without measuring glyphs by hand.
        */}
        <ul className="absolute inset-0">
          {GCC_CHAMBERS.map((c) => {
            const pin = PINS[c.id];
            const isActive = c.id === activeId;
            const side = labelSide(pin.x);

            return (
              <li
                key={c.id}
                className="absolute"
                style={{
                  left: `${(pin.x / VIEW.w) * 100}%`,
                  top: `${(pin.y / VIEW.h) * 100}%`
                }}
              >
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onMouseEnter={() => setActiveId(c.id)}
                  onFocus={() => setActiveId(c.id)}
                  onBlur={() => setActiveId(null)}
                  aria-label={`${c.country[lang]} — ${c.chamber[lang]}`}
                  className="absolute -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                >
                  {/* The dot. Its ring grows on hover rather than the dot
                      itself, so the point on the map never moves. */}
                  <span
                    className={`relative block rounded-full border-[3px] border-white transition-all duration-200 ${
                      isActive
                        ? 'h-[18px] w-[18px] bg-accent-500 shadow-lift ring-4 ring-accent-500/25'
                        : c.home
                          ? 'h-3.5 w-3.5 bg-navy-700 shadow-card'
                          : 'h-3.5 w-3.5 bg-navy-400 shadow-card'
                    }`}
                  />

                  <AnimatePresence>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.16, ease: EASE }}
                        /* `whitespace-nowrap` keeps the pill on one line; the
                           map is wide enough for the longest chamber name at
                           this size, and a wrapped pill would cover the coast
                           it is pointing at. */
                        className={`pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center gap-2 whitespace-nowrap rounded-xl bg-navy-800 px-3.5 py-2 text-xs font-black text-white shadow-lift ${
                          side === 'end' ? 'right-[calc(100%+14px)]' : 'left-[calc(100%+14px)]'
                        }`}
                      >
                        <span aria-hidden="true" className="text-base leading-none">
                          {flagFor(c.code)}
                        </span>
                        {c.chamber[lang]}
                        <ExternalLink size={11} className="shrink-0 opacity-70" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </a>
              </li>
            );
          })}
        </ul>
      </motion.div>

      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-ink-soft">
        <MapPin size={12} /> {t('gcc.mapHint')}
      </p>
    </section>
  );
}
