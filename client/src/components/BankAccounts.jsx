import { CreditCard, Landmark, Plus, Star, Trash2, UserRound } from 'lucide-react';
import Field from './ui/Field';
import { useLanguage } from '../context/LanguageContext';

const BANKS = [
  'بنك مسقط',
  'البنك الوطني العماني',
  'صحار الدولي',
  'بنك ظفار',
  'بنك عمان العربي',
  'البنك الأهلي',
  'بنك نزوى',
  'بنك العز الإسلامي'
];

const MAX_ACCOUNTS = 5;

export const emptyAccount = () => ({
  bankName: '',
  accountHolder: '',
  accountNumber: '',
  confirmAccountNumber: '',
  iban: '',
  isPrimary: false
});

/**
 * The accounts a merchant is paid into.
 *
 * More than one, because a supplier holding a rial account for local contracts
 * and another for imports is ordinary. Exactly one is marked primary — that is
 * the account the platform pays by default, and the control is a radio rather
 * than a checkbox so the interface cannot express "both" or "neither". The
 * server enforces the same rule; this only makes it visible.
 */
export default function BankAccounts({ accounts, onChange, errors = {} }) {
  const { t } = useLanguage();

  const setField = (i, key, value) =>
    onChange(accounts.map((a, n) => (n === i ? { ...a, [key]: value } : a)));

  const setPrimary = (i) => onChange(accounts.map((a, n) => ({ ...a, isPrimary: n === i })));

  const add = () => {
    if (accounts.length >= MAX_ACCOUNTS) return;
    onChange([...accounts, emptyAccount()]);
  };

  const remove = (i) => {
    const left = accounts.filter((_, n) => n !== i);
    // Removing the primary leaves no answer to which account gets paid, so the
    // first remaining one takes it rather than the field silently emptying.
    if (left.length && !left.some((a) => a.isPrimary)) left[0].isPrimary = true;
    onChange(left);
  };

  const err = (i, key) => errors[`bankAccounts.${i}.${key}`];

  return (
    <div className="space-y-5">
      {accounts.map((acct, i) => (
        <div key={i} className="rounded-3xl border border-rule bg-surface p-5 shadow-soft sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-base font-black text-navy-900">
              {t('form.bankAccountN').replace('{n}', i + 1)}
            </h3>

            <div className="flex items-center gap-2">
              <label
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                  acct.isPrimary
                    ? 'bg-accent-500 text-navy-900'
                    : 'border border-rule text-ink-muted hover:border-navy-300'
                }`}
              >
                <input
                  type="radio"
                  name="primaryAccount"
                  className="sr-only"
                  checked={Boolean(acct.isPrimary)}
                  onChange={() => setPrimary(i)}
                />
                <Star size={12} fill={acct.isPrimary ? 'currentColor' : 'none'} aria-hidden="true" />
                {acct.isPrimary ? t('form.primaryAccount') : t('form.makePrimary')}
              </label>

              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-full p-2 text-ink-soft transition-colors hover:bg-navy-50 hover:text-navy-900"
                >
                  <Trash2 size={15} aria-hidden="true" />
                  <span className="sr-only">{t('form.removeAccount')}</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id={`bankName-${i}`} as="select" icon={Landmark} required
              label={t('form.bankName')} value={acct.bankName}
              onChange={(e) => setField(i, 'bankName', e.target.value)}
              error={err(i, 'bankName')}
            >
              <option value="">{t('form.selectBank')}</option>
              {BANKS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </Field>

            <Field
              id={`accountHolder-${i}`} icon={UserRound} required
              hint={t('form.accountHolderHint')}
              label={t('form.accountHolder')} value={acct.accountHolder}
              onChange={(e) => setField(i, 'accountHolder', e.target.value)}
              error={err(i, 'accountHolder')}
            />

            <Field
              id={`accountNumber-${i}`} dir="ltr" icon={CreditCard} required className="font-mono"
              label={t('form.accountNumber')} value={acct.accountNumber}
              onChange={(e) => setField(i, 'accountNumber', e.target.value)}
              error={err(i, 'accountNumber')}
            />

            <Field
              id={`confirmAccountNumber-${i}`} dir="ltr" icon={CreditCard} required className="font-mono"
              // Pasting the same wrong number twice defeats the check.
              onPaste={(e) => e.preventDefault()}
              label={t('form.confirmAccountNumber')} value={acct.confirmAccountNumber}
              onChange={(e) => setField(i, 'confirmAccountNumber', e.target.value)}
              error={err(i, 'confirmAccountNumber')}
            />

            <Field
              id={`iban-${i}`} dir="ltr" icon={CreditCard} required
              className="font-mono sm:col-span-2" hint={t('form.ibanHint')}
              placeholder="OM12 0001 0000 0000 0000 000"
              label={t('form.iban')} value={acct.iban}
              onChange={(e) => setField(i, 'iban', e.target.value)}
              error={err(i, 'iban')}
            />
          </div>
        </div>
      ))}

      {accounts.length < MAX_ACCOUNTS && (
        <button type="button" onClick={add} className="btn-quiet">
          <Plus size={16} aria-hidden="true" /> {t('form.addAccount')}
        </button>
      )}
    </div>
  );
}

export { BANKS, MAX_ACCOUNTS };
