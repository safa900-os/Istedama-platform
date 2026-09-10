/**
 * One motion vocabulary for the whole product.
 *
 * Every animated surface pulls from these presets rather than inventing its
 * own timing, which is what keeps a site with this much movement feeling
 * coordinated instead of noisy. The easing curve is the same everywhere.
 */
export const EASE = [0.22, 1, 0.36, 1];

export const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: EASE }
  })
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show: (i = 0) => ({ opacity: 1, transition: { duration: 0.5, delay: i * 0.06, ease: EASE } })
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: (i = 0) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, delay: i * 0.07, ease: EASE }
  })
};

/** Slides in from the reading edge; pass isRTL so it mirrors correctly. */
export const slideFromEdge = (isRTL) => ({
  hidden: { opacity: 0, x: isRTL ? 28 : -28 },
  show: (i = 0) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.55, delay: i * 0.07, ease: EASE }
  })
});

/** Parent that staggers its children without animating itself. */
export const stagger = (gap = 0.08, delay = 0) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: delay } }
});

/** Standard scroll trigger — fires once, slightly before the element lands. */
export const inView = { once: true, margin: '-60px' };

/** Page-level route transition. */
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: 'easeIn' } }
};

export const hoverLift = {
  rest: { y: 0 },
  hover: { y: -6, transition: { duration: 0.28, ease: EASE } }
};
