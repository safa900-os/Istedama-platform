import { motion, useReducedMotion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';

/**
 * Signature element: the Istedama Score as an official certificate seal.
 *
 * A government platform's core act is issuing a certificate, so the score is
 * presented as a stamped rosette rather than a dashboard gauge. The outer
 * ring is a progress arc (0-100); a notch marks the 70-point certification
 * threshold, so a company can see at a glance how far it sits from being
 * certified. Below the threshold the seal renders in gold (pending); at or
 * above it, teal (issued).
 */
const R = 78;
const CIRC = 2 * Math.PI * R;
const THRESHOLD = 70;

export default function ScoreSeal({ score = 0, label, caption, size = 'lg' }) {
  const { fmt, t } = useLanguage();
  const reduce = useReducedMotion();
  const value = Math.max(0, Math.min(100, score));
  const certified = value >= THRESHOLD;

  const stroke = certified ? '#223E98' : '#EC9D51';
  const track = certified ? '#D8DFF5' : '#F9E2CB';
  const dash = (value / 100) * CIRC;
  const thresholdAngle = (THRESHOLD / 100) * 360 - 90;

  const box = size === 'lg' ? 'h-[212px] w-[212px]' : 'h-[150px] w-[150px]';

  // Scalloped rosette edge, drawn as 48 alternating notches
  const teeth = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    const rr = i % 2 === 0 ? 94 : 89;
    return `${100 + rr * Math.cos(a)},${100 + rr * Math.sin(a)}`;
  }).join(' ');

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${box}`}>
        <svg viewBox="0 0 200 200" className="h-full w-full" role="img" aria-label={`${label}: ${value}`}>
          <polygon points={teeth} fill={certified ? '#EEF1FA' : '#FEF7F0'} />
          <circle cx="100" cy="100" r="86" fill="none" stroke={track} strokeWidth="1.5" />
          <circle cx="100" cy="100" r={R} fill="none" stroke={track} strokeWidth="9" />

          <motion.circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke={stroke}
            strokeWidth="9"
            strokeLinecap="butt"
            transform="rotate(-90 100 100)"
            strokeDasharray={CIRC}
            initial={reduce ? { strokeDashoffset: CIRC - dash } : { strokeDashoffset: CIRC }}
            animate={{ strokeDashoffset: CIRC - dash }}
            transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Certification threshold notch at 70 */}
          <g transform={`rotate(${thresholdAngle} 100 100)`}>
            <line x1={100 + R - 8} y1="100" x2={100 + R + 8} y2="100" stroke="#14255C" strokeWidth="2.5" />
          </g>

          <circle cx="100" cy="100" r="64" fill="#FFFFFF" stroke="#DFE4F2" strokeWidth="1" />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-[2.6rem] font-black leading-none tracking-tight text-navy-900">
            {fmt(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
          </span>
          <span className="mt-0.5 font-mono text-[11px] font-medium text-ink-soft">/ {fmt(100)}</span>
          <span className={`mt-2 ${certified ? 'pill-ok' : 'pill-wait'}`}>
            {certified ? t('seal.issued') : t('seal.pending')}
          </span>
        </div>
      </div>

      {label && <p className="mt-4 text-sm font-bold text-ink">{label}</p>}
      {caption && <p className="mt-1 text-center text-xs text-ink-muted">{caption}</p>}
    </div>
  );
}
