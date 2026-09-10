import { useEffect, useRef, useState } from 'react';
import { useInView } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Counts a statistic up when it first scrolls into view. Uses the language
 * formatter so Arabic renders Arabic-Indic digits while counting, and skips
 * the animation entirely under prefers-reduced-motion.
 */
export default function CountUp({ value = 0, decimals = 0, duration = 1200, suffix = '', prefix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const { fmt } = useLanguage();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setDisplay(value);
      return undefined;
    }

    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      // easeOutCubic — fast start, settled finish
      setDisplay(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {fmt(display, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </span>
  );
}
