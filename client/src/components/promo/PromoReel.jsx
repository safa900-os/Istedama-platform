import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import './PromoReel.css';

/**
 * The brand promo reel.
 *
 * Adapted from the static site, where it lived as `promo.html` loaded through
 * an `<iframe>`. Three things made that worth rebuilding rather than embedding:
 *
 *   - An iframe is a second document. It cannot read the language context, so
 *     the reel stayed Arabic even in English, and it could not see the
 *     accessibility settings, so "reduce motion" did not reach it.
 *   - Its logos were ~220KB of base64 inlined into the markup, re-parsed on
 *     every load. They are now three files under `public/promo/`, cached
 *     normally and preloaded before the reel starts.
 *   - It played the moment the page loaded, with no way to stop it.
 *
 * It is decorative, so it is deliberately not a `<video>`: there is no audio,
 * no timeline to scrub, and nothing to caption. What it does owe the user is a
 * way to stop it, which the controls below provide.
 */

const ASSETS = ['/promo/icon.png', '/promo/wordmark.png', '/promo/lockup.png'];

/** Ambient specks. Fixed positions so the composition is stable per loop. */
const PARTICLES = [
  { size: 6, top: '20%', left: '14%', color: 'var(--promo-accent)', delay: '0.4s' },
  { size: 5, top: '70%', left: '80%', color: 'var(--promo-navy)', delay: '1.3s' },
  { size: 4, top: '36%', left: '86%', color: 'var(--promo-accent)', delay: '2.1s' },
  { size: 5, top: '78%', left: '20%', color: 'var(--promo-navy)', delay: '0.8s' }
];

const PILLAR_KEYS = ['measure', 'verify', 'grow'];

export default function PromoReel() {
  const { t } = useLanguage();
  const { reduceMotion } = useAccessibility();

  const [systemReduced, setSystemReduced] = useState(false);
  const [ready, setReady] = useState(false);
  // The reel runs continuously: it starts as soon as its frames are decoded and
  // keeps looping until the viewer stops it themselves. It is a brand loop, not
  // a video, so there is no poster to click through and nothing to miss by
  // arriving late. The controls remain, because "cannot be stopped at all"
  // would be a worse page than "loops by default".
  const [playing, setPlaying] = useState(true);
  const stageRef = useRef(null);

  // The OS-level preference is honoured alongside the in-app toggle, so a user
  // who set it once system-wide does not have to set it again here.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setSystemReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const still = reduceMotion || systemReduced;

  /**
   * Decode the three frames before the first play. Without this the icon pops
   * in against an empty stage on a cold cache, which is exactly the moment the
   * animation is trying to look composed.
   */
  useEffect(() => {
    let cancelled = false;
    Promise.all(
      ASSETS.map(
        (src) =>
          new Promise((resolve) => {
            const img = new Image();
            img.onload = img.onerror = resolve;
            img.src = src;
          })
      )
    ).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /**
   * Restarting means restarting the clock, not just unpausing it. Removing the
   * element from the flow and forcing a reflow before re-adding it is the one
   * reliable way to rewind a CSS animation to 0%.
   */
  const replay = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const animated = stage.querySelectorAll('[class*="promo-"]');
    // Suppress every animation, flush once, then release them together. One
    // reflow for the whole set — reflowing per element would restart each on a
    // slightly different frame and shear the scenes apart.
    animated.forEach((el) => {
      el.style.animation = 'none';
    });
    void stage.offsetHeight;
    animated.forEach((el) => {
      el.style.animation = '';
    });
    setPlaying(true);
  }, []);

  const toggle = useCallback(() => setPlaying((p) => !p), []);

  /*
   * There is deliberately no pause-when-off-screen here.
   *
   * An earlier version stopped the loop once it scrolled past, to save battery.
   * That made the reel appear frozen whenever the viewer scrolled back to it
   * mid-scene, which read as broken. The animation is composited entirely on
   * the GPU (opacity and transform only, no layout properties), so leaving it
   * running is cheap; browsers also throttle animations in background tabs on
   * their own.
   */

  /* ------------------------------------------------------------- still */

  // With motion reduced, the animated stage would sit at its resting state —
  // every scene at opacity 0, i.e. blank. Show the closing frame instead: it
  // is the one that carries the mark and the line together.
  if (still) {
    return (
      <figure>
        <div className="promo-stage flex aspect-video w-full flex-col items-center justify-center gap-4 rounded-3xl border border-rule px-6 shadow-card">
          <img
            src="/promo/lockup.png"
            alt={t('promo.alt')}
            className="h-[26%] w-auto max-w-[70%] object-contain"
          />
          {/* Scaled against the frame, like the animated scenes — a fixed
              `text-lg` here was a different size relative to the box at every
              width the reel is used at. */}
          <p className="font-display text-[clamp(1.05rem,5.2cqw,2.2rem)] font-black leading-tight text-ink">
            {t('promo.tagline')}
          </p>
          <p className="text-[clamp(0.75rem,2.1cqw,0.95rem)] text-ink-muted">{t('promo.taglineSub')}</p>
          <span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-navy-700 to-accent-500" />
        </div>
        <figcaption className="mt-3 text-center text-xs text-ink-soft">{t('promo.stillNote')}</figcaption>
      </figure>
    );
  }

  /* ------------------------------------------------------------ motion */

  return (
    <figure>
      <div
        ref={stageRef}
        data-playing={playing ? 'true' : 'false'}
        className="promo-stage group relative aspect-video w-full rounded-3xl border border-rule shadow-card"
        role="img"
        aria-label={t('promo.alt')}
      >
        <div className="promo-glow" aria-hidden="true" />
        <div className="promo-streak" aria-hidden="true" />

        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className="promo-particle"
            aria-hidden="true"
            style={{
              width: p.size,
              height: p.size,
              top: p.top,
              left: p.left,
              background: p.color,
              animationDelay: p.delay
            }}
          />
        ))}

        {/* Scene 1 — the mark assembles.
            `flex-row-reverse` on a physical row keeps icon-left / wordmark-right
            in both languages, matching the printed lockup. */}
        <div className="promo-scene promo-scene-reveal" aria-hidden="true">
          <div className="flex flex-row-reverse items-center gap-[3%]" dir="ltr">
            <img
              src="/promo/wordmark.png"
              alt=""
              className="promo-wordmark h-[15%] max-h-20 w-auto object-contain"
            />
            <img
              src="/promo/icon.png"
              alt=""
              className="promo-icon h-[24%] max-h-32 w-auto object-contain drop-shadow-[0_16px_30px_rgba(15,50,96,0.28)]"
            />
          </div>
        </div>

        {/* Scene 2 — tagline */}
        <div className="promo-scene promo-scene-tagline" aria-hidden="true">
          <h3 className="font-display text-[clamp(1.05rem,5.2cqw,2.2rem)] font-black leading-tight text-ink">
            {t('promo.tagline')}
          </h3>
          <p className="text-[clamp(0.75rem,2.1cqw,0.95rem)] font-medium text-navy-700/85">
            {t('promo.taglineSub')}
          </p>
        </div>

        {/* Scene 3 — pillars (absent from the source file; see PromoReel.css) */}
        <div className="promo-scene promo-scene-pillars" aria-hidden="true">
          <div className="flex w-full max-w-[80%] items-stretch justify-center gap-[2.5%]">
            {PILLAR_KEYS.map((key) => (
              <div
                key={key}
                className="promo-pillar flex flex-1 flex-col items-center gap-[6%] rounded-2xl border border-white/85 bg-white/60 px-[4%] py-[5%] shadow-[0_18px_40px_rgba(15,50,96,0.14)] backdrop-blur"
              >
                <span className="flex h-[clamp(1.15rem,4.4cqw,2.1rem)] w-[clamp(1.15rem,4.4cqw,2.1rem)] items-center justify-center rounded-xl bg-navy-50 font-display text-[clamp(0.65rem,2cqw,0.85rem)] font-black text-navy-700">
                  {t(`promo.pillar.${key}.badge`)}
                </span>
                <h4 className="font-display text-[clamp(0.7rem,2cqw,0.82rem)] font-bold leading-tight text-ink">
                  {t(`promo.pillar.${key}.title`)}
                </h4>
                <p className="text-[clamp(0.6rem,1.5cqw,0.68rem)] leading-snug text-ink-muted">
                  {t(`promo.pillar.${key}.body`)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Scene 4 — closing lockup */}
        <div className="promo-scene promo-scene-closing" aria-hidden="true">
          <img
            src="/promo/lockup.png"
            alt=""
            className="h-[22%] w-auto max-w-[62%] object-contain drop-shadow-[0_16px_30px_rgba(15,50,96,0.24)]"
          />
          <span className="text-[clamp(0.6rem,1.5cqw,0.68rem)] font-medium uppercase tracking-[0.2em] text-ink-muted">
            {t('promo.closing')}
          </span>
        </div>

        <div className="promo-flare" aria-hidden="true" />
        <span
          className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-navy-700 to-accent-500"
          aria-hidden="true"
        />

        {/*
          Controls. Revealed on hover or keyboard focus rather than sitting on
          the artwork permanently — the reel plays on its own, so the buttons
          are an escape hatch, not the primary affordance. They stay in the tab
          order at all times, so a keyboard user can always reach them.
        */}
        <div className="absolute bottom-4 z-20 flex items-center gap-2 opacity-0 transition-opacity duration-200 focus-within:opacity-100 group-hover:opacity-100 ltr:right-4 rtl:left-4">
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? t('promo.pause') : t('promo.play')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-navy-700 shadow-card ring-1 ring-rule backdrop-blur transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            {playing ? <Pause size={15} /> : <Play size={15} className="ms-0.5" />}
          </button>
          <button
            type="button"
            onClick={replay}
            aria-label={t('promo.replay')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/90 text-navy-700 shadow-card ring-1 ring-rule backdrop-blur transition-colors hover:bg-surface focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
          >
            <RotateCcw size={15} />
          </button>
        </div>

        {/* Scene indicator, driven by the same 9s clock as the scenes. */}
        <div className="absolute bottom-5 z-20 flex gap-1.5 ltr:left-5 rtl:right-5" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="promo-tick h-1 w-5 rounded-full bg-navy-700/60" />
          ))}
        </div>

        {/* A thin veil until the frames decode, so the first loop does not
            begin against an empty stage on a cold cache. */}
        {!ready && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-3xl bg-canvas/70 backdrop-blur-[2px]">
            <span className="text-sm font-bold text-ink-muted">{t('promo.loading')}</span>
          </div>
        )}
      </div>
    </figure>
  );
}
