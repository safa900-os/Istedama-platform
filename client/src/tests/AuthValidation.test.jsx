import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import api from '../api/axios';
import { isValidEmail, isStrongPassword } from '../utils/credentials';

vi.mock('../api/axios', () => ({
  default: { get: vi.fn(() => Promise.reject(new Error('no session'))), post: vi.fn() }
}));

const wrap = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>{ui}</AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

describe('Credential rules', () => {
  test.each([
    ['name@example.com', true],
    ['first.last+tag@sub.example.co.uk', true],
    ['no-at-sign.com', false],
    ['two@@example.com', false],
    ['trailing.dot@example.', false],
    ['double..dot@example.com', false],
    ['spaced name@example.com', false],
    ['@example.com', false]
  ])('email %s -> %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });

  test.each([
    ['Str0ng!Pass', true],
    ['Short1!', false],        // under 8
    ['alllowercase1!', false], // no uppercase
    ['ALLUPPERCASE1!', false], // no lowercase
    ['NoDigitsHere!', false],  // no number
    ['NoSymbols123', false]    // no special character
  ])('password %s -> %s', (pw, expected) => {
    expect(isStrongPassword(pw)).toBe(expected);
  });
});

describe('Login page', () => {
  test('no longer shows the demo accounts section', () => {
    wrap(<Login />);
    expect(screen.queryByText(/demo account/i)).not.toBeInTheDocument();
    expect(screen.queryByText('admin@istidamah.om')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^use$/i })).not.toBeInTheDocument();
  });

  test('rejects a malformed email without calling the API', () => {
    wrap(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'not-an-email' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'whatever' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByText(/valid email address/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  test('rejects an empty password without calling the API', () => {
    wrap(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'user@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getAllByText(/enter your password/i).length).toBeGreaterThan(0);
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe('Register page', () => {
  /*
   * Registration is now the full wizard: the account type is chosen with tabs
   * rather than a select, and the password sits on the first step of each
   * journey. These cover the same three guarantees as before against the new
   * shape — the type offered, the password policy being enforced before the
   * form can advance, and the rules being shown while the field is in use.
   */

  test('offers merchant and organisation as types, and no staff role', () => {
    wrap(<Register />);
    const group = screen.getByRole('group');
    const labels = Array.from(group.querySelectorAll('button')).map((b) => b.textContent.trim());

    expect(labels.join(' ')).toMatch(/merchant/i);
    expect(labels.join(' ')).toMatch(/organisation/i);
    // Staff roles are assigned internally and must never be self-selectable.
    expect(labels.join(' ')).not.toMatch(/auditor|admin/i);
  });

  test('a weak password blocks the step, a strong one lets it through', () => {
    wrap(<Register />);

    fireEvent.change(screen.getByLabelText(/^full name ?\*/i), { target: { value: 'Salim' } });
    fireEvent.change(screen.getByLabelText(/^email ?\*/i), {
      target: { value: 'salim@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/^phone number ?\*/i), {
      target: { value: '91234567' }
    });
    fireEvent.change(screen.getByLabelText(/^password ?\*/i), { target: { value: 'weak' } });

    fireEvent.click(screen.getByRole('button', { name: /next|continue/i }));
    // Still on step one: the company field of step two never mounts.
    expect(screen.queryByLabelText(/company name \(english\)/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^password ?\*/i)).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(screen.getByLabelText(/^password ?\*/i), { target: { value: 'Str0ng!Pass' } });
    fireEvent.click(screen.getByRole('button', { name: /next|continue/i }));

    return screen.findByLabelText(/company name \(english\)/i);
  });

  test('shows the password rule checklist once the field is in use', () => {
    wrap(<Register />);
    // Hidden until the user engages with the field, so the form isn't
    // permanently cluttered with instructions.
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();

    fireEvent.focus(screen.getByLabelText(/^password ?\*/i));

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/one uppercase letter/i)).toBeInTheDocument();
    expect(screen.getByText(/one special character/i)).toBeInTheDocument();
  });

  test('each journey runs its stages in order, with documents after the details', () => {
    wrap(<Register />);

    const stepNames = () =>
      screen.getAllByRole('listitem').map((li) => li.textContent.replace(/[\d٠-٩]/g, '').trim());

    // Merchant is the default.
    const merchant = stepNames();
    expect(merchant).toHaveLength(5);
    expect(merchant[3]).toMatch(/documents/i);
    expect(merchant[4]).toMatch(/review/i);

    fireEvent.click(screen.getByRole('button', { name: /organisation/i }));

    // Documents come after the organisation's own details and its
    // representative — asking for paperwork before saying what it is for reads
    // as a demand rather than a step.
    const organisation = stepNames();
    expect(organisation).toHaveLength(3);
    expect(organisation[0]).toMatch(/organisation details/i);
    expect(organisation[1]).toMatch(/representative/i);
    expect(organisation[2]).toMatch(/documents/i);
    // No separate summary stage: the organisation submits from its last step.
    expect(organisation.join(' ')).not.toMatch(/summary/i);
  });

  test('date fields carry no added icon, so nothing sits on the native picker', () => {
    wrap(<Register />);
    fireEvent.click(screen.getByRole('button', { name: /organisation/i }));

    const dateInput = document.getElementById('registrationExpiry');
    expect(dateInput).toBeTruthy();
    // The browser draws its own calendar button inside a date input. A second
    // glyph is positioned by the page direction while the input is forced to
    // LTR, so it lands on top of the text.
    expect(dateInput.className).not.toMatch(/field-icon/);
    expect(dateInput.closest('.field-shell').querySelector('.field-glyph')).toBeNull();
  });

  test('switching type swaps the fields, not just the heading', async () => {
    /*
     * Regression: the type used to be folded into the animated panel's key, so
     * switching tabs was treated as a step transition. `mode="wait"` then held
     * the outgoing panel until an exit that never completed, and the form kept
     * showing the previous type's fields underneath the new heading.
     */
    wrap(<Register />);
    expect(screen.getByLabelText(/^full name ?\*/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /organisation/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/organisation name \(english\)/i)).toBeInTheDocument()
    );
    // The merchant's own first-step field is gone, not merely covered.
    expect(screen.queryByLabelText(/^full name ?\*/i)).not.toBeInTheDocument();
  });
});
