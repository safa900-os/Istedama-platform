import { Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * The numbered progress track for a multi-step form.
 *
 * A step is one of three states, and each is distinguishable without relying on
 * colour: completed carries a tick, current is filled and labelled as current
 * through `aria-current`, and upcoming stays outlined. The connector between
 * steps is dashed until the pair is reached and solid once passed, so progress
 * reads along the line as well as in the circles.
 *
 * The whole track is an ordered list, so assistive technology announces both
 * the position and the total rather than a row of loose numbers.
 */
export default function StepTrack({ steps, current }) {
  const { t, fmt } = useLanguage();

  return (
    <nav aria-label={t('wiz.progress')}>
      <ol className="flex items-start gap-1 overflow-x-auto pb-1">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li
              key={label}
              aria-current={active ? 'step' : undefined}
              className="relative flex min-w-[92px] flex-1 flex-col items-center text-center"
            >
              {/* Connector to the next step, drawn from this circle's centre
                  outward. Hidden on the last step, where it would point at
                  nothing. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className={`absolute top-[18px] h-0 w-full ltr:left-1/2 rtl:right-1/2 ${
                    done ? 'border-t-2 border-navy-300' : 'border-t-2 border-dashed border-navy-100'
                  }`}
                />
              )}

              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full font-display text-[13px] font-black transition-colors ${
                  active
                    ? 'bg-navy-700 text-white shadow-card'
                    : done
                      ? 'bg-navy-500 text-white'
                      : 'bg-mist text-ink-muted'
                }`}
              >
                {done ? <Check size={16} strokeWidth={3} /> : fmt(i + 1)}
              </span>

              <span
                className={`mt-2 px-1 text-[11px] leading-tight ${
                  active ? 'font-black text-navy-700' : 'font-bold text-ink-soft'
                }`}
              >
                {label}
              </span>

              {/* Announced only to assistive tech; the visual position is
                  already carried by the track itself. */}
              {active && (
                <span className="sr-only">
                  {t('wiz.stepOf')} {fmt(i + 1)}/{fmt(steps.length)}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
