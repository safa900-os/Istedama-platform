import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { EASE } from '../../motion/variants';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Horizontal progress stepper for multi-step forms. The connecting rail fills
 * as steps complete, which gives the user a sense of remaining distance that a
 * plain "Step 2 of 4" label does not.
 */
export default function Stepper({ steps, current }) {
  const { fmt, isRTL } = useLanguage();
  const pct = steps.length > 1 ? (current / (steps.length - 1)) * 100 : 0;

  return (
    <div className="relative">
      {/* rail */}
      <div className="absolute top-4 h-[2px] bg-rule" style={{ insetInlineStart: '1rem', insetInlineEnd: '1rem' }} aria-hidden="true">
        <motion.div
          className="h-full bg-navy-700"
          style={{ transformOrigin: isRTL ? 'right' : 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ duration: 0.45, ease: EASE }}
        />
      </div>

      <ol className="relative flex justify-between">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} className="flex flex-1 flex-col items-center gap-2 text-center">
              <motion.span
                initial={false}
                animate={{
                  backgroundColor: done || active ? '#223E98' : '#FFFFFF',
                  borderColor: done || active ? '#223E98' : '#DFE4F2',
                  scale: active ? 1.1 : 1
                }}
                transition={{ duration: 0.3, ease: EASE }}
                className="flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-xs font-bold"
                style={{ color: done || active ? '#FFFFFF' : '#98A0BC' }}
              >
                {done ? <Check size={15} strokeWidth={3} /> : fmt(i + 1)}
              </motion.span>
              <span className={`max-w-[9rem] text-xs leading-tight ${active ? 'font-bold text-navy-700' : 'text-ink-soft'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
