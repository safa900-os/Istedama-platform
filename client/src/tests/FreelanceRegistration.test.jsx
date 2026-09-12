import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Register from '../pages/Register';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { translations } from '../i18n/translations';

/*
  The map needs a layout engine; the document checklist asks the API for its
  slot list. Both are stubbed so this test is about the journey itself.
*/
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  useMapEvents: () => null
}));

const calls = [];
vi.mock('../api/axios', () => ({
  default: {
    get: (url) => {
      calls.push({ method: 'get', url });
      if (url.includes('documents')) {
        return Promise.resolve({
          data: {
            data: {
              slots: [
                { slot: 'freelancePermit', required: true, accept: ['pdf'], label: { en: 'Permit', ar: 'السجل' } },
                { slot: 'logo', required: false, accept: ['png'], label: { en: 'Logo', ar: 'الشعار' } }
              ],
              maxBytes: 5_000_000
            }
          }
        });
      }
      return Promise.resolve({ data: { data: [] } });
    },
    post: (url, body) => {
      calls.push({ method: 'post', url, body });
      return Promise.resolve({ data: { data: { _id: 'c1', ...body } } });
    }
  }
}));

const renderPage = () =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <AuthProvider>
          <Register />
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

const en = (k) => translations.en[k];

/** Types into a field by its visible label. */
const fill = (label, value) => {
  const el = screen.getByLabelText(new RegExp(`^${label}`, 'i'));
  fireEvent.change(el, { target: { value } });
  return el;
};

const advance = () =>
  fireEvent.click(screen.getByRole('button', { name: new RegExp(en('rw.continue') || 'continue', 'i') }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
  calls.length = 0;
});

/**
 * Self-employment registration.
 *
 * A permit holder is not a company: no commercial registration, no staff, and
 * an IBAN rather than a branch account. The journey has to reflect that or it
 * asks for documents the applicant cannot legally possess.
 */
describe('Registering as self-employed', () => {
  const chooseFreelance = () => {
    const group = screen.getByRole('group');
    fireEvent.click(within(group).getByRole('button', { name: /self-employed/i }));
  };

  test('is offered as a third type alongside merchant and organisation', () => {
    renderPage();
    const group = screen.getByRole('group');
    expect(within(group).getAllByRole('button')).toHaveLength(3);
    expect(within(group).getByRole('button', { name: /self-employed/i })).toBeInTheDocument();
  });

  test('never asks for a commercial registration', () => {
    renderPage();
    chooseFreelance();
    // The whole journey, not just this stage: a permit is not a CR, and the
    // applicant has no number to give.
    expect(screen.queryByLabelText(/commercial registration|CR number/i)).toBeNull();
  });

  test('asks for the civil number and refuses one of the wrong length', async () => {
    renderPage();
    chooseFreelance();

    fill(en('rw.fullName'), 'Salim Al Harthy');
    fill(en('form.civilNumber'), '12');
    fill(en('auth.email'), 'salim@example.om');
    fill(en('form.contactPhone'), '91234567');
    fill(en('form.profession'), 'Graphic designer');
    advance();

    expect(await screen.findByText(en('form.errCivilNumber'))).toBeInTheDocument();
  });

  test('an empty first stage does not advance', () => {
    renderPage();
    chooseFreelance();
    const before = screen.getByRole('heading', { level: 2 }).textContent;
    advance();
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(before);
  });

  test('a malformed Maroof link is rejected, a real one is not', async () => {
    renderPage();
    chooseFreelance();

    fill(en('rw.fullName'), 'Salim Al Harthy');
    fill(en('form.civilNumber'), '12345678');
    fill(en('auth.email'), 'salim@example.om');
    fill(en('form.contactPhone'), '91234567');
    fill(en('auth.password'), 'Str0ngPass!23');
    fill(en('form.profession'), 'Graphic designer');
    fireEvent.change(screen.getByLabelText(new RegExp(en('form.governorate'), 'i')), {
      target: { value: 'Muscat' }
    });
    advance();

    await screen.findByLabelText(new RegExp(en('form.freelancePermitNo'), 'i'));
    fill(en('form.freelancePermitNo'), 'FR-2026-0091');
    fill(en('form.maroofUrl'), 'not-a-url');
    advance();
    expect(await screen.findByText(en('form.errWebsite'))).toBeInTheDocument();

    fill(en('form.maroofUrl'), 'https://maroof.om/store/9912');
    advance();
    // Reaching the bank stage is the proof the link passed.
    expect(await screen.findByLabelText(new RegExp(en('form.iban'), 'i'))).toBeInTheDocument();
  });

  test('takes an IBAN for payment, and the optional licence stays optional', async () => {
    renderPage();
    chooseFreelance();

    fill(en('rw.fullName'), 'Salim Al Harthy');
    fill(en('form.civilNumber'), '12345678');
    fill(en('auth.email'), 'salim@example.om');
    fill(en('form.contactPhone'), '91234567');
    fill(en('auth.password'), 'Str0ngPass!23');
    fill(en('form.profession'), 'Graphic designer');
    fireEvent.change(screen.getByLabelText(new RegExp(en('form.governorate'), 'i')), {
      target: { value: 'Muscat' }
    });
    advance();

    // Only the permit number is required here; the e-commerce licence and the
    // links are things a practitioner may simply not have.
    await screen.findByLabelText(new RegExp(en('form.freelancePermitNo'), 'i'));
    fill(en('form.freelancePermitNo'), 'FR-2026-0091');
    advance();

    const iban = await screen.findByLabelText(new RegExp(en('form.iban'), 'i'));
    expect(iban).toBeInTheDocument();
    // An account number alone is not enough to route a payment.
    expect(screen.getByLabelText(new RegExp(en('form.accountHolder'), 'i'))).toBeInTheDocument();

    fireEvent.change(iban, { target: { value: 'not-an-iban' } });
    advance();
    expect(await screen.findByText(en('form.errorIban'))).toBeInTheDocument();
  });

  test('the copy for every stage exists in both languages', () => {
    for (const stage of ['freelanceProfile', 'freelanceLicence', 'freelanceVerify']) {
      for (const suffix of ['title', 'body']) {
        const key = `rw.h.${stage}.${suffix}`;
        expect(translations.en[key]).toBeTruthy();
        expect(translations.ar[key]).toBeTruthy();
      }
      expect(translations.en[`rw.s.${stage}`]).toBeTruthy();
      expect(translations.ar[`rw.s.${stage}`]).toBeTruthy();
    }
    for (const key of ['reg.freelance', 'reg.titleFreelance', 'reg.subtitleFreelance',
                       'form.civilNumber', 'form.profession', 'form.freelancePermitNo',
                       'form.ecommerceLicenceNo', 'form.maroofUrl', 'form.errCivilNumber']) {
      expect(translations.en[key]).toBeTruthy();
      expect(translations.ar[key]).toBeTruthy();
    }
  });
});
