import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import RegistrationHeader from '../components/RegistrationHeader';
import StepTrack from '../components/StepTrack';
import NdaAgreement from '../components/NdaAgreement';
import Register from '../pages/Register';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';

// Leaflet needs a real layout engine; stub the map so this stays a unit test.
vi.mock('../components/LocationPicker', () => ({
  default: ({ onChange }) => (
    <button type="button" onClick={() => onChange({ lat: 23.5, lng: 58.4 })}>
      Mock set location
    </button>
  )
}));

const renderWith = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </BrowserRouter>
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

describe('Registration type is shown but not selectable', () => {
  test('a merchant account sees the merchant type marked current', () => {
    renderWith(<RegistrationHeader isMerchant />);
    const group = screen.getByRole('group');
    const current = within(group)
      .getAllByText(/merchant|organisation/i)
      .find((el) => el.closest('[aria-current="true"]'));
    expect(current).toHaveTextContent(/merchant/i);
  });

  test('an organisation account sees the organisation type marked current', () => {
    renderWith(<RegistrationHeader isMerchant={false} />);
    const group = screen.getByRole('group');
    const current = within(group)
      .getAllByText(/merchant|organisation/i)
      .find((el) => el.closest('[aria-current="true"]'));
    expect(current).toHaveTextContent(/organisation/i);
  });

  test('neither type is an interactive control', () => {
    // The server derives the type from the account and ignores the client, so
    // a clickable tab here would be either inert or a hole in that boundary.
    const { container } = renderWith(<RegistrationHeader isMerchant />);
    const group = screen.getByRole('group');
    expect(within(group).queryAllByRole('button')).toHaveLength(0);
    expect(container.querySelectorAll('input, select')).toHaveLength(0);
  });

  test('says why the type cannot be changed', () => {
    renderWith(<RegistrationHeader isMerchant />);
    expect(screen.getAllByText(/cannot be changed/i).length).toBeGreaterThan(0);
  });
});

describe('Step track', () => {
  const STEPS = ['Details', 'Location', 'Bank', 'Documents', 'Review'];

  test('marks the current step and only that one', () => {
    renderWith(<StepTrack steps={STEPS} current={2} />);
    const items = screen.getAllByRole('listitem');
    const currentItems = items.filter((li) => li.getAttribute('aria-current') === 'step');
    expect(currentItems).toHaveLength(1);
    expect(currentItems[0]).toHaveTextContent('Bank');
  });

  test('announces position and total, not just a number', () => {
    renderWith(<StepTrack steps={STEPS} current={2} />);
    expect(screen.getByText(/3\/5/)).toBeInTheDocument();
  });

  test('renders one entry per step', () => {
    renderWith(<StepTrack steps={STEPS} current={0} />);
    expect(screen.getAllByRole('listitem')).toHaveLength(STEPS.length);
  });
});

/**
 * These ran against `/register-company`, whose first step asked for the
 * company. That page has been deleted as a duplicate of this wizard, whose
 * merchant journey opens on the account holder instead — so the same
 * behaviours are checked against the fields that are actually there.
 */
describe('Validation reports every problem, under the field it belongs to', () => {
  const renderWizard = () =>
    renderWith(
      <AuthProvider>
        <Register />
      </AuthProvider>
    );

  const continueBtn = () => screen.getByRole('button', { name: /continue/i });
  const fullName = () => screen.getByLabelText(/^full name/i);
  const email = () => screen.getByLabelText(/^email/i);
  const phone = () => screen.getByLabelText(/^(contact )?phone/i);

  test('an empty step reports all its required fields at once', () => {
    renderWizard();
    fireEvent.click(continueBtn());

    // Reporting only the first problem would make the applicant press
    // Continue once per field to discover the rest.
    for (const field of [fullName(), email(), phone()]) {
      expect(field).toHaveAttribute('aria-invalid', 'true');
      // The message is tied to the field, not merely printed near it.
      const describedBy = field.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(describedBy)).toHaveTextContent(/.+/);
    }
  });

  test('correcting a field clears its own message and no other', () => {
    renderWizard();
    fireEvent.click(continueBtn());
    expect(fullName()).toHaveAttribute('aria-invalid', 'true');

    fireEvent.change(fullName(), { target: { value: 'Salim Al Harthy' } });

    expect(fullName()).not.toHaveAttribute('aria-invalid');
    // The untouched field keeps its message.
    expect(email()).toHaveAttribute('aria-invalid', 'true');
  });

  test('a malformed email is reported on that field, not as a generic failure', () => {
    renderWizard();

    fireEvent.change(fullName(), { target: { value: 'Salim Al Harthy' } });
    fireEvent.change(email(), { target: { value: 'not-an-email' } });
    fireEvent.change(phone(), { target: { value: '91234567' } });
    fireEvent.click(continueBtn());

    const field = email();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(
      document.getElementById(field.getAttribute('aria-describedby'))
    ).toHaveTextContent(/.+/);
    // And the step did not advance to the company details.
    expect(screen.queryByLabelText(/company name/i)).toBeNull();
  });
});

describe('The NDA must be read before it can be signed', () => {
  test('the agree button is disabled until the reader confirms', async () => {
    const onSign = vi.fn();
    renderWith(<NdaAgreement signedAt={null} onSign={onSign} />);

    fireEvent.click(screen.getByRole('button', { name: /read and sign/i }));
    const agree = await screen.findByRole('button', { name: /agree and sign/i });

    // Signing on a single press, with nothing read, would make the record of
    // consent meaningless.
    expect(agree).toBeDisabled();
    fireEvent.click(agree);
    expect(onSign).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(agree).toBeEnabled();
  });

  test('signing reports an ISO timestamp', async () => {
    const onSign = vi.fn();
    renderWith(<NdaAgreement signedAt={null} onSign={onSign} />);

    fireEvent.click(screen.getByRole('button', { name: /read and sign/i }));
    fireEvent.click(await screen.findByRole('checkbox'));
    fireEvent.click(screen.getByRole('button', { name: /agree and sign/i }));

    expect(onSign).toHaveBeenCalledTimes(1);
    const stamp = onSign.mock.calls[0][0];
    expect(new Date(stamp).toISOString()).toBe(stamp);
  });

  test('the terms are actually presented, not just referenced', async () => {
    renderWith(<NdaAgreement signedAt={null} onSign={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /read and sign/i }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/confidentiality continues/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/not published without written consent/i)).toBeInTheDocument();
  });

  test('once signed, the state is reflected and the terms stay reviewable', async () => {
    renderWith(<NdaAgreement signedAt="2026-09-06T12:00:00.000Z" onSign={vi.fn()} />);
    expect(screen.getByText(/^signed$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /review the agreement/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
