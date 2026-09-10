import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import SectionHead from './SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { STRATEGIC_PARTNERS } from '../data/partners';
import { fadeUp, inView, EASE } from '../motion/presets';
import './PartnerStrip.css';

/**
 * Strategic partners, as a strip of marks that keeps moving.
 *
 * This replaced a map of Oman with a card list beside it. Two things were
 * wrong with that: the chambers section further down the page is also a map,
 * so the two read as one component rendered twice; and the partners' location
 * was never the interesting fact about them — all six are national bodies, and
 * five of them are headquartered in the same city. What a visitor is actually
 * reading this section for is *who backs the programme*, which is a roster of
 * marks, not a geography.
 *
 * Each partner is a logo in a circle and nothing else. Six cards each carrying
 * a name, a role and a city put three lines of Arabic on every one of them,
 * wrapping to different depths, which made the strip read as a wall of text
 * rather than as a row of credentials. The details belong to whichever partner
 * is being asked about, so they appear on demand instead.
 *
 * Movement is never the only route to a partner: the strip pauses on hover and
 * on focus, the details open on pointer, keyboard focus *and* tap, and the
 * whole thing becomes a plain scroller when the reader has asked for reduced
 * motion.
 */

/** Seconds of travel per partner, so speed stays put as the roster grows. */
const SECONDS_PER_PARTNER = 4;

/**
 * How many times the roster is laid end to end inside the track.
 *
 * The loop jumps back by exactly one copy, so at that instant the remaining
 * copies have to still fill the strip — otherwise a blank gap swings through
 * once per pass. Six circles at 128px make a copy 768px wide; three copies
 * behind the jump cover 2304px, comfortably more than this section can ever be
 * (the page caps at 1400px). Two copies would leave 768px against a strip up
 * to 1360px wide, which is exactly that gap.
 */
const TRACK_COPIES = 4;

/** Width of the detail panel; also what keeps it clear of the strip's ends. */
const PANEL_W = 300;

export default function PartnerStrip() {
  const { t, lang, isRTL } = useLanguage();
  const Arrow = isRTL ? ArrowLeft : ArrowRight;
  const stripRef = useRef(null);
  // `{ id, x }` — x is where the panel points, in pixels across the strip.
  const [active, setActive] = useState(null);
  const activePartner = STRATEGIC_PARTNERS.find((p) => p.id === active?.id) || null;

  /**
   * Open the details for a partner, anchored under the logo asked about.
   *
   * The panel lives below the strip rather than floating over it: the strip
   * clips its own overflow to hide the circles waiting off-screen, so a
   * tooltip drawn inside it would be cut off at the edge it needs to cross.
   */
  const open = (partner) => (event) => {
    const strip = stripRef.current;
    const target = event.currentTarget.getBoundingClientRect();
    let x = null;

    if (strip) {
      const bounds = strip.getBoundingClientRect();
      if (bounds.width > PANEL_W) {
        const centre = target.left - bounds.left + target.width / 2;
        // Clamped, so a logo near either end still gets a panel that sits
        // fully inside the section instead of hanging off it.
        x = Math.min(Math.max(centre, PANEL_W / 2), bounds.width - PANEL_W / 2);
      }
    }

    setActive({ id: partner.id, x });
  };

  const close = () => setActive(null);

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      <SectionHead
        eyebrow={t('partnerMap.eyebrow')}
        title={t('partnerMap.title')}
        lead={t('partnerMap.lead')}
        center
      />

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={inView} className="mt-11">
        <div
          ref={stripRef}
          className="pstrip-viewport py-3"
          style={{
            '--pstrip-duration': `${STRATEGIC_PARTNERS.length * SECONDS_PER_PARTNER}s`,
            /* Physical, not logical: `translateX` is unaffected by direction,
               but a flex row in Arabic starts at the right edge, so the strip
               has to travel the other way to keep bringing marks in from
               off-screen rather than pushing them off it. */
            '--pstrip-shift': `${isRTL ? '' : '-'}${100 / TRACK_COPIES}%`
          }}
        >
          {/* No gap on the track itself: the jump is a fraction of the track's
              whole width, which only equals one copy when the copies are the
              entire track. Each copy carries its own trailing space instead,
              so the join looks like every other gap. */}
          <div className="pstrip-track">
            {Array.from({ length: TRACK_COPIES }, (_, copy) => (
              <ul
                key={copy}
                /* Only the first copy is announced. The rest exist so the loop
                   has something to run into, and hearing the same six partners
                   four times over would read as a bug to anyone listening
                   rather than looking. */
                aria-hidden={copy > 0 ? 'true' : undefined}
                className="flex shrink-0 items-center gap-8 pe-8"
              >
                {STRATEGIC_PARTNERS.map((p) => {
                  const isActive = active?.id === p.id;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        onMouseEnter={open(p)}
                        onFocus={open(p)}
                        onMouseLeave={close}
                        onBlur={close}
                        /* Tapping is the point of the click handler: a touch
                           screen has no hover, so without it the details would
                           be unreachable on a phone. */
                        onClick={(e) => (isActive ? close() : open(p)(e))}
                        aria-pressed={isActive}
                        /* The full details ride on the accessible name, so a
                           screen reader gets them without having to trigger
                           the visual panel at all. */
                        aria-label={`${p.name[lang]} — ${p.kind[lang]} — ${p.city[lang]}`}
                        className={`flex h-24 w-24 items-center justify-center rounded-full border bg-surface p-4 transition-all duration-300 ${
                          isActive
                            ? '-translate-y-1 border-navy-300 shadow-lift'
                            : 'border-rule shadow-soft hover:-translate-y-1 hover:border-navy-200 hover:shadow-card'
                        } ${
                          /* The lead partner is ringed, so it is placed before
                             anyone points at anything. */
                          p.primary ? 'ring-2 ring-accent-500/60 ring-offset-2 ring-offset-canvas' : ''
                        }`}
                      >
                        <img
                          src={p.logo}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ))}
          </div>
        </div>

        {/*
          A reserved band under the strip holding either the hint or the
          details. Reserved, because a panel appearing out of nothing would
          shove the rest of the page down every time the pointer crossed a
          logo; and the hint means the space is never simply blank.

          Measured in `rem`, not pixels: the tallest partner panel comes to
          123px against a 124px band, and the site's own text-size control
          scales the root font by up to 124% — which would have burst a fixed
          band and pushed the button below it down the page. In `rem` the
          reservation grows with the text it is holding.
        */}
        <div className="relative mt-5 min-h-[9.5rem]">
          {/*
            No `mode="wait"` here: hover is a fast, repeated gesture, and
            holding the incoming panel until the outgoing one has finished
            leaving puts a visible stall on every single pass across the
            strip. Both are absolutely positioned in this band, so letting
            them overlap for a moment costs nothing and crossfades instead.
          */}
          <AnimatePresence>
            {activePartner ? (
              <motion.div
                key={activePartner.id}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: EASE }}
                /* Centred by subtracting half its own width, not by a
                   `-translate-x-1/2` class: this element is animated, so
                   framer-motion writes its own inline `transform` and a
                   Tailwind translate on the same element is simply
                   overwritten — which left the panel hanging off the end of
                   the strip and 150px adrift of the logo it belongs to. */
                style={{
                  width: PANEL_W,
                  left:
                    active?.x == null
                      ? `calc(50% - ${PANEL_W / 2}px)`
                      : active.x - PANEL_W / 2
                }}
                className="pointer-events-none absolute top-0 rounded-2xl border border-rule bg-surface p-4 text-center shadow-lift"
              >
                <p className="font-display text-sm font-black leading-snug text-navy-900">
                  {activePartner.name[lang]}
                </p>
                <p className="mt-1.5 text-xs font-semibold text-ink-muted">
                  {activePartner.primary ? t('partnerMap.lead2') : activePartner.kind[lang]}
                </p>
                <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-ink-soft">
                  <MapPin size={11} aria-hidden="true" /> {activePartner.city[lang]}
                </p>
              </motion.div>
            ) : (
              <motion.p
                key="hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: EASE }}
                className="absolute inset-x-0 top-3 text-center text-xs text-ink-soft"
              >
                {t('partnerMap.hint')}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="text-center">
          <Link to="/partners" className="btn-quiet">
            {t('partnerMap.viewAll')} <Arrow size={15} strokeWidth={2.4} />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
