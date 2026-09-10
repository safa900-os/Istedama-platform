import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { translations } from '../i18n/translations';

// Leaflet needs a real layout engine; stub the map so this stays a fast unit test.
vi.mock('../components/LocationPicker', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ lat: 23.5, lng: 58.4 })}>
      Mock set location
    </button>
  )
}));

const en = (k) => translations.en[k];

// Labels such as "Company name (English)" carry brackets, which a regex reads
// as a group unless they are escaped — matching one raw silently matches
// nothing at all, which reads as a missing field rather than a bad matcher.
const rx = (text, flags = 'i') =>
  new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);

function renderForm() {
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

const next = () =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en('wiz.next'), 'i') }));

/** Fills the merchant journey's first step: the account holder and sign-in. */
const fillAccountStep = () => {
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

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

/**
 * These tests used to run against `/register-company`, a second registration
 * page that has since been deleted — it duplicated this wizard. They now cover
 * the surviving one, whose merchant journey opens on the account holder rather
 * than on the company.
 */
describe('Registration wizard', () => {
  test('opens on the account step, not on the company details', () => {
    renderForm();
    expect(screen.getByLabelText(new RegExp(`^${en('rw.fullName')}`, 'i'))).toBeInTheDocument();
    expect(screen.getByLabelText(new RegExp(`^${en('auth.email')}`, 'i'))).toBeInTheDocument();
    // The company step is not mounted yet.
    expect(screen.queryByLabelText(rx(en('rw.companyEnglish')))).toBeNull();
  });

  test('refuses to advance while a required field on this step is empty', () => {
    renderForm();
    next();
    expect(screen.queryByLabelText(rx(en('rw.companyEnglish')))).toBeNull();
    expect(screen.getByLabelText(new RegExp(`^${en('rw.fullName')}`, 'i'))).toBeInTheDocument();
  });

  test('advances to the company step once the account fields are valid', async () => {
    renderForm();
    fillAccountStep();
    next();

    // The wizard cross-fades between steps, so the next panel mounts async.
    expect(
      await screen.findByLabelText(rx(en('rw.companyEnglish')))
    ).toBeInTheDocument();
  });

  test('names every step of the merchant journey up front', () => {
    renderForm();
    for (const k of ['rw.s.general', 'rw.s.company', 'rw.s.bank', 'rw.s.documents', 'rw.s.review']) {
      expect(screen.getAllByText(en(k)).length).toBeGreaterThan(0);
    }
  });
});
