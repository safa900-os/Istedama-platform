import { Building2, Lock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * The registration masthead: icon, title, and the two registration types.
 *
 * The types behave differently at the two stages of the journey, which is the
 * whole point of the `onSelect` prop:
 *
 *   - **Creating the account** (`onSelect` given): the type is a real choice,
 *     because nothing has been decided yet. The tabs are buttons.
 *   - **Registering the enterprise** (`onSelect` omitted): the type now follows
 *     the account, and the server enforces that when the record is created,
 *     ignoring whatever the client sends. Working tabs here would either be
 *     decoration the server overrides, or would need that boundary removed — so
 *     the type that does not apply is locked, with the reason stated.
 */
export default function RegistrationHeader({ isMerchant, onSelect, title, subtitle }) {
  const { t } = useLanguage();
  const selectable = typeof onSelect === 'function';

  const types = [
    { id: 'merchant', label: t('reg.merchant'), active: isMerchant },
    { id: 'organization', label: t('reg.organization'), active: !isMerchant }
  ];

  return (
    <header className="relative overflow-hidden rounded-t-4xl border border-b-0 border-rule bg-wash-hero px-6 pb-8 pt-9 sm:px-11">
      {/* Concentric rings. Decorative, and pointer-transparent so they never
          sit between the applicant and a control. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 h-[300px] w-[300px] rounded-full border border-navy-100 ltr:-left-28 rtl:-right-28"
        style={{ boxShadow: '0 0 0 32px rgba(216,227,242,.36), 0 0 0 64px rgba(216,227,242,.20)' }}
      />

      <div className="relative z-10 flex items-center gap-4">
        <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br from-navy-700 to-navy-500 text-white shadow-lift">
          <Building2 size={28} strokeWidth={1.8} />
        </span>
        <div>
          <h1 className="font-display text-[1.75rem] font-black leading-tight text-navy-900 sm:text-[2.1rem]">
            {title || (isMerchant ? t('reg.titleMerchant') : t('reg.titleOrganization'))}
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            {subtitle || (isMerchant ? t('reg.subtitleMerchant') : t('reg.subtitleOrganization'))}
          </p>
        </div>
      </div>

      <div
        role="group"
        aria-label={t('form.entityType')}
        className="relative z-10 mx-auto mt-7 flex w-full max-w-[520px] gap-1.5 rounded-full border border-navy-100 bg-navy-50/70 p-1.5"
      >
        {types.map((type) => {
          const shared = `flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-full text-sm font-black transition-colors ${
            type.active
              ? 'bg-gradient-to-l from-navy-700 to-navy-500 text-white shadow-card'
              : ''
          }`;

          return selectable ? (
            <button
              key={type.id}
              type="button"
              onClick={() => onSelect(type.id)}
              aria-pressed={type.active}
              className={`${shared} ${type.active ? '' : 'text-navy-700 hover:bg-white/70'} focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500`}
            >
              {type.label}
            </button>
          ) : (
            <div
              key={type.id}
              aria-current={type.active ? 'true' : undefined}
              title={type.active ? undefined : t('reg.lockedHint')}
              className={`${shared} ${type.active ? '' : 'cursor-not-allowed text-ink-soft'}`}
            >
              {!type.active && <Lock size={13} aria-hidden="true" />}
              {type.label}
            </div>
          );
        })}
      </div>

      <p className="relative z-10 mt-3 text-center text-xs text-ink-soft">
        {selectable ? t('reg.chooseHint') : t('reg.lockedHint')}
      </p>
    </header>
  );
}
