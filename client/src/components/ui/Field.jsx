import { useId } from 'react';

/**
 * A labelled form control with an optional leading icon.
 *
 * The icon sits inside the field rather than beside the label, so a long form
 * reads as a single column of inputs the eye can run down. Padding is cleared
 * on the leading side only, and `ps-*` keeps that correct in both directions
 * without a separate RTL rule.
 *
 * Renders an input by default; pass `as="textarea"` or `as="select"` (with
 * `options` or children) for the other two controls.
 */
export default function Field({
  label,
  icon: Icon,
  as = 'input',
  hint,
  error,
  required = false,
  options,
  className = '',
  children,
  id,
  ...props
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;

  /*
   * Date and time inputs never take a leading icon.
   *
   * The browser draws its own picker button inside them, and these controls are
   * forced to `dir="ltr"` so the format reads correctly — while the glyph is
   * placed by the surrounding direction. On an Arabic page that puts the
   * padding on one side and the icon on the other, so the icon lands on top of
   * the date text and beside the native button. Dropping it leaves the control
   * with the one affordance it already has.
   */
  const isNativePicker = ['date', 'time', 'datetime-local', 'month', 'week'].includes(props.type);
  const showIcon = Boolean(Icon) && !isNativePicker;

  const control = {
    className: `field ${showIcon ? 'field-icon' : ''} ${
      as === 'textarea' ? 'resize-y leading-relaxed' : ''
    } ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10' : ''} ${className}`,
    id: fieldId,
    required,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    ...props
  };

  return (
    <div>
      {label && (
        <label htmlFor={fieldId} className="label">
          {label}
          {required && <span className="ms-1 text-accent-600">*</span>}
        </label>
      )}

      <div className="field-shell">
        {showIcon && (
          <span className="field-glyph" aria-hidden="true">
            <Icon size={17} strokeWidth={2} />
          </span>
        )}

        {as === 'textarea' && <textarea rows={props.rows || 4} {...control} />}

        {as === 'select' && (
          <select {...control}>
            {options
              ? options.map((o) =>
                  typeof o === 'string' ? (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ) : (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  )
                )
              : children}
          </select>
        )}

        {as === 'input' && <input {...control} />}
      </div>

      {error ? (
        <p id={`${fieldId}-error`} className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${fieldId}-hint`} className="hint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
