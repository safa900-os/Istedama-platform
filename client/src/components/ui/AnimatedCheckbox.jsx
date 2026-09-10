import { motion } from 'framer-motion';
import { EASE } from '../../motion/variants';

/**
 * Checkbox with a drawn tick. The path animates its own stroke rather than
 * fading in, so the check reads as being *written* — the same gesture the
 * platform's logo mark makes. Wraps a real <input> so keyboard, form
 * submission and screen readers behave natively.
 */
export default function AnimatedCheckbox({ checked, onChange, label, hint, id, required, className = '' }) {
  return (
    <label htmlFor={id} className={`group flex cursor-pointer items-start gap-3 ${className}`}>
      <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(e) => onChange(e.target.checked)}
          className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{
            backgroundColor: checked ? '#223E98' : '#FFFFFF',
            borderColor: checked ? '#223E98' : '#DFE4F2',
            scale: checked ? [1, 0.86, 1] : 1
          }}
          transition={{ duration: 0.28, ease: EASE }}
          className="pointer-events-none absolute inset-0 rounded-[5px] border-2 peer-focus-visible:ring-2 peer-focus-visible:ring-navy-500/40 peer-focus-visible:ring-offset-2"
        />
        <svg viewBox="0 0 24 24" className="pointer-events-none relative h-3.5 w-3.5" aria-hidden="true">
          <motion.path
            d="M4 12.5 L9.5 18 L20 6.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
            transition={{ duration: 0.3, ease: EASE }}
          />
        </svg>
      </span>

      <span className="min-w-0">
        <span className="block text-sm leading-relaxed text-ink transition-colors group-hover:text-navy-700">
          {label}
        </span>
        {hint && <span className="mt-0.5 block text-xs text-ink-soft">{hint}</span>}
      </span>
    </label>
  );
}
