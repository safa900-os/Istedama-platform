import { useAccessibility } from '../context/AccessibilityContext';

/**
 * Ambient page decoration: soft colour blooms plus a few drifting sparkles,
 * matching the reference screens. Purely decorative, so it is hidden from
 * assistive technology and disabled entirely under reduce-motion.
 */
const SPARKS = [
  { top: '12%', left: '6%', size: 14, delay: '0s' },
  { top: '26%', left: '92%', size: 10, delay: '1.1s' },
  { top: '58%', left: '4%', size: 11, delay: '2.2s' },
  { top: '72%', left: '88%', size: 15, delay: '0.6s' },
  { top: '42%', left: '48%', size: 9, delay: '1.7s' }
];

export default function Decor() {
  const { reduceMotion } = useAccessibility();

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-32 top-[-10%] h-[30rem] w-[30rem] rounded-full bg-navy-200/35 blur-[110px]" />
      <div className="absolute -right-40 top-[18%] h-[26rem] w-[26rem] rounded-full bg-gold-200/30 blur-[110px]" />
      <div className="absolute bottom-[-12%] left-1/3 h-[28rem] w-[28rem] rounded-full bg-navy-100/45 blur-[120px]" />

      {!reduceMotion &&
        SPARKS.map((s, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            className="absolute animate-twinkle text-navy-300/60"
            style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
          >
            <path
              d="M12 0c.6 6.2 5.2 10.8 11.4 11.4C17.2 12 12.6 16.6 12 22.8 11.4 16.6 6.8 12 .6 11.4 6.8 10.8 11.4 6.2 12 0Z"
              fill="currentColor"
            />
          </svg>
        ))}
    </div>
  );
}
