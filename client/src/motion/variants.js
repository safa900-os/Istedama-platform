/**
 * Shared motion vocabulary.
 *
 * One easing curve and one distance scale across the whole product, so
 * animation reads as a single system rather than per-component decoration.
 * Everything here is short (0.2–0.6s) and travels a small distance — motion
 * should confirm an action, not perform for the user.
 */
export const EASE = [0.22, 1, 0.36, 1];

/** Page-level fade for route transitions. */
export const pageIn = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: EASE } }
};

/** Staggered container — pair with `riseItem` on children. */
export const staggerList = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } }
};

export const riseItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } }
};

/** Indexed rise, for lists that aren't wrapped in a stagger container. */
export const rise = {
  hidden: { opacity: 0, y: 12 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.06, ease: EASE }
  })
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.96 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: EASE } }
};

/** Standard interactive feedback applied to cards and buttons. */
export const hoverLift = {
  rest: { y: 0, transition: { duration: 0.2, ease: EASE } },
  hover: { y: -4, transition: { duration: 0.2, ease: EASE } }
};

export const tapPress = { scale: 0.97 };

/** Slide-over / drawer panels. */
export const drawer = (fromRight = true) => ({
  hidden: { x: fromRight ? '100%' : '-100%', opacity: 0.6 },
  show: { x: 0, opacity: 1, transition: { duration: 0.32, ease: EASE } },
  exit: { x: fromRight ? '100%' : '-100%', opacity: 0.6, transition: { duration: 0.24, ease: EASE } }
});

export const backdrop = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.18 } }
};
