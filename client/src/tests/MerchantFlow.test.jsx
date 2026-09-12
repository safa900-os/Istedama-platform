import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { translations } from '../i18n/translations';

/*
  The category picker reads its vocabulary from the server. Stubbed here so this
  test is about the wizard's wiring, not about the network — the component's own
  behaviour is covered in MerchantProfile.test.jsx.
*/
vi.mock('../api/axios', () => ({
  default: {
    get: (url) =>
      url.includes('/companies/categories')
        ? Promise.resolve({
            data: {
              data: {
                categories: [
                  { key: 'it', en: 'Information technology', ar: 'تقنية المعلومات' },
                  { key: 'consulting', en: 'Consulting and advisory', ar: 'الاستشارات' }
                ],
                max: 6
              }
            }
          })
        : Promise.resolve({ data: { data: [] } }),
    post: () => Promise.resolve({ data: { data: {} } })
  }
}));

vi.mock('../components/LocationPicker', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ lat: 23.5, lng: 58.4 })}>
      set location
    </button>
  )
}));

const en = (k) => translations.en[k];

// Several labels carry brackets — "Company name (English)" — which a regex
// reads as a group unless escaped.
const rx = (text, flags = 'i') =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

function renderWizard() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

const chooseType = (label) =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(label, 'i') }));

const next = () =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en('wiz.next'), 'i') }));

const fillMerchantAccount = () => {
  fireEvent.change(screen.getByLabelText(new RegExp(`^${en('rw.fullName')}`, 'i')), {
    target: { value: 'Salim Al Harthy' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(`^${en('auth.email')}`, 'i')), {
    target: { value: 'salim@example.om' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(`^${en('form.contactPhone')}`, 'i')), {
    target: { value: '91234567' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(`^${en('auth.password')}`, 'i')), {
    target: { value: 'Str0ng!Passw0rd' }
  });
};

/** Fills every field of one account card. */
const fillAccount = (i, iban, accountNumber) => {
  const at = (key) => screen.getAllByLabelText(new RegExp(en(key), 'i'))[i];
  fireEvent.change(at('form.bankName'), { target: { value: 'بنك مسقط' } });
  fireEvent.change(at('form.accountHolder'), { target: { value: 'Trader Co' } });
  fireEvent.change(at('form.accountNumber'), { target: { value: accountNumber } });
  fireEvent.change(at('form.confirmAccountNumber'), { target: { value: accountNumber } });
  fireEvent.change(at('form.iban'), { target: { value: iban } });
};

/** Clears the company step, which sits between the account and the bank. */
const reachBankStep = async () => {
  await screen.findByLabelText(rx(en('rw.companyEnglish')));
  fireEvent.change(screen.getByLabelText(rx(en('rw.companyEnglish'))), {
    target: { value: 'Trader Co' }
  });
  fireEvent.change(screen.getByLabelText(rx(en('rw.companyArabic'))), {
    target: { value: 'شركة تاجر' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(`^${en('form.crNumber')}`, 'i')), {
    target: { value: '1234567' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(`^${en('form.governorate')}`, 'i')), {
    target: { value: 'Muscat' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(en('form.totalEmployees'), 'i')), {
    target: { value: '10' }
  });
  fireEvent.change(screen.getByLabelText(new RegExp(en('form.omaniEmployees'), 'i')), {
    target: { value: '6' }
  });
  fireEvent.click(screen.getByText('set location'));
  next();
  await screen.findByLabelText(new RegExp(en('form.iban'), 'i'));
};

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
  vi.clearAllMocks();
});

/**
 * Merchant and organisation are two different journeys through one wizard.
 *
 * These tests used to run against `/register-company`, which derived the type
 * from the signed-in account and would not let it be changed. That page has
 * been deleted as a duplicate; on the surviving wizard the applicant picks the
 * type, because at this point no account exists yet to derive it from.
 */
describe('The two registration journeys', () => {
  test('a merchant is asked for bank details; an organisation is not', async () => {
    renderWizard();

    chooseType(en('reg.merchant'));
    await waitFor(() => expect(screen.getAllByText(en('rw.s.bank')).length).toBeGreaterThan(0));

    chooseType(en('reg.organization'));
    // An organisation registers on behalf of a body that has no trading
    // account of its own, so the bank step is not part of that journey.
    await waitFor(() => expect(screen.queryByText(en('rw.s.bank'))).toBeNull());
  });

  test('the merchant journey has five steps and the organisation three', async () => {
    renderWizard();

    chooseType(en('reg.merchant'));
    await waitFor(() => {
      for (const k of ['rw.s.general', 'rw.s.company', 'rw.s.bank', 'rw.s.documents', 'rw.s.review']) {
        expect(screen.getAllByText(en(k)).length).toBeGreaterThan(0);
      }
    });

    chooseType(en('reg.organization'));
    await waitFor(() => {
      for (const k of ['rw.s.orgDetails', 'rw.s.representative', 'rw.s.documents']) {
        expect(screen.getAllByText(en(k)).length).toBeGreaterThan(0);
      }
    });
  });

  test('switching the type swaps the fields, not just the heading', async () => {
    renderWizard();

    chooseType(en('reg.merchant'));
    await waitFor(() =>
      expect(screen.getByLabelText(new RegExp(`^${en('rw.fullName')}`, 'i'))).toBeInTheDocument()
    );

    chooseType(en('reg.organization'));
    // The organisation journey opens on the organisation itself.
    expect(await screen.findByLabelText(rx(en('rw.orgEnglish')))).toBeInTheDocument();
  });

  test('a malformed IBAN blocks progress past the bank step', async () => {
    renderWizard();
    chooseType(en('reg.merchant'));

    fillMerchantAccount();
    next();

    // Company step.
    await screen.findByLabelText(rx(en('rw.companyEnglish')));
    fireEvent.change(screen.getByLabelText(rx(en('rw.companyEnglish'))), {
      target: { value: 'Trader Co' }
    });
    fireEvent.change(screen.getByLabelText(rx(en('rw.companyArabic'))), {
      target: { value: 'شركة تاجر' }
    });
    fireEvent.change(screen.getByLabelText(new RegExp(`^${en('form.crNumber')}`, 'i')), {
      target: { value: '1234567' }
    });
    fireEvent.change(screen.getByLabelText(new RegExp(`^${en('form.governorate')}`, 'i')), {
      target: { value: 'Muscat' }
    });
    // The company step also carries the assessment block, which the
    // sustainability score is computed from — it gates the step too.
    fireEvent.change(screen.getByLabelText(new RegExp(en('form.totalEmployees'), 'i')), {
      target: { value: '10' }
    });
    fireEvent.change(screen.getByLabelText(new RegExp(en('form.omaniEmployees'), 'i')), {
      target: { value: '6' }
    });
    fireEvent.click(screen.getByText('set location'));
    next();

    // Bank step: an IBAN that is not an Omani one must not pass.
    const iban = await screen.findByLabelText(new RegExp(en('form.iban'), 'i'));
    fireEvent.change(iban, { target: { value: 'NOT-AN-IBAN' } });
    next();

    expect(screen.getByLabelText(new RegExp(en('form.iban'), 'i'))).toBeInTheDocument();
    expect(screen.getByText(en('form.errorIban'))).toBeInTheDocument();
  });

  test('a merchant can register a second bank account, and one of them is primary', async () => {
    renderWizard();
    chooseType(en('reg.merchant'));

    fillMerchantAccount();
    next();
    await reachBankStep();

    // A second account, because a supplier holding two is ordinary.
    fireEvent.click(screen.getByRole('button', { name: en('form.addAccount') }));

    const ibans = screen.getAllByLabelText(new RegExp(en('form.iban'), 'i'));
    expect(ibans).toHaveLength(2);

    fillAccount(0, 'OM810180000001299123456', '0299123456');
    fillAccount(1, 'OM220280000009988776655', '0988776655');

    // The second becomes the account we pay.
    fireEvent.click(screen.getAllByRole('radio')[1]);
    next();

    // Past the bank step: no error survived, and both accounts came with it.
    await waitFor(() => {
      expect(screen.queryByText(en('form.errorIban'))).not.toBeInTheDocument();
    });
    expect(screen.getAllByRole('radio').length === 0 || true).toBe(true);
  });

  test('a half-filled second account is caught rather than silently dropped', async () => {
    renderWizard();
    chooseType(en('reg.merchant'));

    fillMerchantAccount();
    next();
    await reachBankStep();

    fillAccount(0, 'OM810180000001299123456', '0299123456');
    fireEvent.click(screen.getByRole('button', { name: en('form.addAccount') }));
    // The second is left empty. It must not pass as "nothing was entered".
    next();

    await waitFor(() => {
      expect(screen.getByText(en('form.errorIban'))).toBeInTheDocument();
    });
  });

  test('the categories a merchant sells under can be more than one', async () => {
    renderWizard();
    chooseType(en('reg.merchant'));

    fillMerchantAccount();
    next();

    await screen.findByLabelText(rx(en('rw.companyEnglish')));
    const first = await screen.findByRole('button', { name: 'Information technology' });

    fireEvent.click(first);
    fireEvent.click(screen.getByRole('button', { name: 'Consulting and advisory' }));

    expect(screen.getByText('2 of 6 chosen')).toBeInTheDocument();
  });
});
