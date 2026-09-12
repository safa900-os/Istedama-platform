import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import BankAccounts, { emptyAccount } from '../components/BankAccounts';
import CategoryPicker from '../components/CategoryPicker';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

/*
  Two things a merchant gives that have to be right: the account we pay, and
  the categories a buyer finds them under. Both are lists, and a list in a form
  is where half-finished rows and lost selections hide.
*/

const CATALOGUE = [
  { key: 'it', en: 'Information technology', ar: 'تقنية المعلومات' },
  { key: 'consulting', en: 'Consulting and advisory', ar: 'الاستشارات' },
  { key: 'training', en: 'Training and education', ar: 'التدريب والتعليم' },
  { key: 'logistics', en: 'Transport and logistics', ar: 'النقل والخدمات اللوجستية' }
];

let maxCategories;

vi.mock('../api/axios', () => ({
  default: {
    get: () =>
      Promise.resolve({ data: { data: { categories: CATALOGUE, max: maxCategories } } })
  }
}));

const en = (key) => translations.en[key];

/** Renders a component against live state, and exposes the latest value. */
function Harness({ children }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

beforeEach(() => {
  maxCategories = 3;
  localStorage.clear();
});

/* ------------------------------------------------------- bank accounts */

function renderAccounts(initial) {
  const state = { accounts: initial };
  const { rerender } = render(
    <Harness>
      <BankAccounts accounts={state.accounts} onChange={() => {}} />
    </Harness>
  );

  const update = (accounts) => {
    state.accounts = accounts;
    rerender(
      <Harness>
        <BankAccounts accounts={state.accounts} onChange={update} />
      </Harness>
    );
  };
  update(initial);
  return state;
}

describe('The accounts a merchant is paid into', () => {
  test('opens with one account, already primary', () => {
    renderAccounts([{ ...emptyAccount(), isPrimary: true }]);

    expect(screen.getByText('Bank account 1')).toBeInTheDocument();
    expect(screen.getByText(en('form.primaryAccount'))).toBeInTheDocument();
    // Nothing to remove when there is only one — removing it would leave the
    // merchant with no account at all.
    expect(screen.queryByText(en('form.removeAccount'))).not.toBeInTheDocument();
  });

  test('a second account can be added and removed', () => {
    const state = renderAccounts([{ ...emptyAccount(), isPrimary: true }]);

    fireEvent.click(screen.getByRole('button', { name: en('form.addAccount') }));
    expect(state.accounts).toHaveLength(2);
    expect(screen.getByText('Bank account 2')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: en('form.removeAccount') })[1]);
    expect(state.accounts).toHaveLength(1);
  });

  test('exactly one account is primary, and choosing another moves it', () => {
    const state = renderAccounts([
      { ...emptyAccount(), bankName: 'Bank Muscat', isPrimary: true },
      { ...emptyAccount(), bankName: 'Bank Dhofar' }
    ]);

    // A radio, not a checkbox: the control itself cannot express "both".
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(2);
    expect(radios[0]).toBeChecked();

    fireEvent.click(radios[1]);

    expect(state.accounts.filter((a) => a.isPrimary)).toHaveLength(1);
    expect(state.accounts[1].isPrimary).toBe(true);
  });

  test('removing the primary account hands it to the one that is left', () => {
    const state = renderAccounts([
      { ...emptyAccount(), bankName: 'Bank Muscat', isPrimary: true },
      { ...emptyAccount(), bankName: 'Bank Dhofar' }
    ]);

    fireEvent.click(screen.getAllByRole('button', { name: en('form.removeAccount') })[0]);

    expect(state.accounts).toHaveLength(1);
    // Never "no account is primary" — there is always an answer to who we pay.
    expect(state.accounts[0].isPrimary).toBe(true);
    expect(state.accounts[0].bankName).toBe('Bank Dhofar');
  });

  test('stops at five accounts', () => {
    const five = Array.from({ length: 5 }, (_, i) => ({ ...emptyAccount(), isPrimary: i === 0 }));
    renderAccounts(five);

    expect(screen.queryByRole('button', { name: en('form.addAccount') })).not.toBeInTheDocument();
  });

  test('each account keeps its own fields, so typing in one does not move the other', () => {
    const state = renderAccounts([
      { ...emptyAccount(), isPrimary: true },
      { ...emptyAccount() }
    ]);

    // A required field's label carries a trailing '*', so match on the stem.
    const ibans = screen.getAllByLabelText(new RegExp(en('form.iban')));
    fireEvent.change(ibans[1], { target: { value: 'OM810180000001299123456' } });

    expect(state.accounts[1].iban).toBe('OM810180000001299123456');
    expect(state.accounts[0].iban).toBe('');
  });

  test('the confirmation field refuses a paste, so a wrong number cannot be copied twice', () => {
    renderAccounts([{ ...emptyAccount(), isPrimary: true }]);

    const confirm = screen.getByLabelText(new RegExp(en('form.confirmAccountNumber')));
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    confirm.dispatchEvent(paste);

    expect(paste.defaultPrevented).toBe(true);
  });

  test('an error is shown against the account it belongs to', () => {
    render(
      <Harness>
        <BankAccounts
          accounts={[{ ...emptyAccount(), isPrimary: true }, { ...emptyAccount() }]}
          onChange={() => {}}
          errors={{ 'bankAccounts.1.iban': 'IBAN must start with OM' }}
        />
      </Harness>
    );

    expect(screen.getByText('IBAN must start with OM')).toBeInTheDocument();
    // and only once — not repeated against the first account
    expect(screen.getAllByText('IBAN must start with OM')).toHaveLength(1);
  });
});

/* ---------------------------------------------------- category picker */

function renderPicker(initial = []) {
  const state = { value: initial };
  const onChange = (value) => {
    state.value = value;
    rerender();
  };
  const view = render(
    <Harness>
      <CategoryPicker value={state.value} onChange={onChange} />
    </Harness>
  );
  function rerender() {
    view.rerender(
      <Harness>
        <CategoryPicker value={state.value} onChange={onChange} />
      </Harness>
    );
  }
  return state;
}

describe('What a merchant sells', () => {
  test('offers the list the server published, not a copy of its own', async () => {
    renderPicker();

    await screen.findByRole('button', { name: 'Information technology' });
    for (const c of CATALOGUE) {
      expect(screen.getByRole('button', { name: c.en })).toBeInTheDocument();
    }
  });

  test('more than one category can be chosen', async () => {
    const state = renderPicker();
    await screen.findByRole('button', { name: 'Information technology' });

    fireEvent.click(screen.getByRole('button', { name: 'Information technology' }));
    fireEvent.click(screen.getByRole('button', { name: 'Consulting and advisory' }));

    expect(state.value).toEqual(['it', 'consulting']);
    expect(screen.getByText('2 of 3 chosen')).toBeInTheDocument();
  });

  test('a chosen category can be taken back off', async () => {
    const state = renderPicker(['it']);
    await screen.findByRole('button', { name: 'Consulting and advisory' });

    // From the chip above the list, which is the obvious place to look. It is
    // the one whose accessible name says what clicking it does.
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`Information technology.*${en('form.removeCategory')}`)
      })
    );

    expect(state.value).toEqual([]);
  });

  test('the cap is enforced, and only blocks what is not already chosen', async () => {
    const state = renderPicker(['it', 'consulting', 'training']);
    await screen.findByRole('button', { name: 'Transport and logistics' });

    // At the cap: an unchosen category is disabled...
    expect(screen.getByRole('button', { name: 'Transport and logistics' })).toBeDisabled();
    // ...but a chosen one stays clickable, or there would be no way back.
    const chosen = screen
      .getAllByRole('button', { name: /Consulting and advisory/ })
      .find((b) => !b.disabled);
    expect(chosen).toBeTruthy();

    fireEvent.click(chosen);
    expect(state.value).toEqual(['it', 'training']);
  });

  test('search finds a category by either language', async () => {
    renderPicker();
    await screen.findByRole('button', { name: 'Information technology' });

    const box = screen.getByLabelText(en('form.searchCategories'));

    fireEvent.change(box, { target: { value: 'consult' } });
    expect(screen.getByRole('button', { name: 'Consulting and advisory' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Transport and logistics' })).not.toBeInTheDocument();

    // An Arabic term works on the English page too, because a merchant may
    // know their sector by its Arabic name only.
    fireEvent.change(box, { target: { value: 'النقل' } });
    expect(screen.getByRole('button', { name: 'Transport and logistics' })).toBeInTheDocument();
  });

  test('says so rather than showing an empty box when nothing matches', async () => {
    renderPicker();
    await screen.findByRole('button', { name: 'Information technology' });

    fireEvent.change(screen.getByLabelText(en('form.searchCategories')), {
      target: { value: 'zzzz' }
    });

    expect(screen.getByText(en('form.noCategoryMatch'))).toBeInTheDocument();
  });

  test('a chosen category is announced as pressed, not only coloured', async () => {
    renderPicker(['it']);
    const chip = await screen.findByRole('button', { name: 'Consulting and advisory' });

    expect(chip).toHaveAttribute('aria-pressed', 'false');
    const chosen = screen
      .getAllByRole('button', { name: /Information technology/ })
      .find((b) => b.getAttribute('aria-pressed') === 'true');
    expect(chosen).toBeTruthy();
  });
});
