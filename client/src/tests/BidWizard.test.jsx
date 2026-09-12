import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BidWizard from '../components/BidWizard';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

/*
  A bid is money and a deadline. These cover what the form owes the bidder:
  the arithmetic it shows while they type, the gates that stop a half-finished
  bid being sent, and the fact that submitting asks before it commits.
*/

const calls = [];
let saveResponse;

vi.mock('../api/axios', () => ({
  default: {
    get: (url) => {
      calls.push({ method: 'get', url });
      return Promise.resolve({ data: { data: null } });
    },
    put: (url, body) => {
      calls.push({ method: 'put', url, body });
      return Promise.resolve({ data: { data: saveResponse(body) } });
    },
    post: (url, body) => {
      calls.push({ method: 'post', url, body });
      return Promise.resolve({ data: { data: { ...saveResponse(body), status: 'submitted' } } });
    },
    delete: (url) => {
      calls.push({ method: 'delete', url });
      return Promise.resolve({ data: { data: { documents: [] } } });
    }
  }
}));

const TENDER = {
  _id: 'tender1',
  title: 'Fit-out works',
  titleAr: 'أعمال التجهيز',
  scopeItems: [
    { description: 'Supply and install', descriptionAr: 'توريد وتركيب', unit: 'm2', quantity: 120 },
    { description: 'Site preparation', descriptionAr: 'تهيئة الموقع', unit: 'lot', quantity: 1 }
  ]
};

/** A bid carrying a technical file, so step one can be cleared. */
const withTechnical = (extra = {}) => ({
  _id: 'bid1',
  status: 'draft',
  documents: [
    {
      _id: 'doc1',
      slot: 'technical',
      originalName: 'technical.pdf',
      mimeType: 'application/pdf',
      size: 2048
    }
  ],
  ...extra
});

const setup = (bid = null) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <BidWizard tender={TENDER} bid={bid} onChange={() => {}} />
      </LanguageProvider>
    </MemoryRouter>
  );

const en = (key) => translations.en[key];

beforeEach(() => {
  calls.length = 0;
  localStorage.clear();
  saveResponse = (body) => ({ ...withTechnical(), ...body });
});

/** Fills contact details and advances past the documents step. */
const clearStepOne = async () => {
  fireEvent.change(screen.getByLabelText(en('bid.contactName')), {
    target: { value: 'Salim Al Harthy' }
  });
  fireEvent.change(screen.getByLabelText(en('bid.contactEmail')), {
    target: { value: 'salim@example.om' }
  });
  fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));
  await waitFor(() => expect(screen.getByText(en('bid.pricing'))).toBeInTheDocument());
};

describe('Bidding on a tender', () => {
  test('starts from the buyer’s scope, so every bid prices the same job', async () => {
    setup(withTechnical());
    await clearStepOne();

    const descriptions = screen
      .getAllByLabelText(en('bid.describeLine'))
      .map((input) => input.value);

    expect(descriptions).toEqual(['Supply and install', 'Site preparation']);
    // The quantities are the buyer's; only the rates are blank.
    expect(screen.getAllByLabelText(en('td.quantity'))[0]).toHaveValue(120);
    expect(screen.getAllByLabelText(en('bid.unitPrice'))[0]).toHaveValue(0);
  });

  test('the documents step will not pass without contact details or a technical proposal', async () => {
    setup();

    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));

    await waitFor(() => {
      expect(screen.getAllByText(en('bid.errRequired')).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(en('bid.errEmail'))).toBeInTheDocument();
    expect(screen.getAllByText(en('bid.errTechnical')).length).toBeGreaterThan(0);
    // Still on step one; nothing was saved.
    expect(screen.queryByText(en('bid.pricing'))).not.toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'put')).toHaveLength(0);
  });

  test('a malformed email is caught before the bid is saved', async () => {
    setup(withTechnical());

    fireEvent.change(screen.getByLabelText(en('bid.contactName')), { target: { value: 'Salim' } });
    fireEvent.change(screen.getByLabelText(en('bid.contactEmail')), {
      target: { value: 'salim@example' }
    });
    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));

    await waitFor(() => expect(screen.getByText(en('bid.errEmail'))).toBeInTheDocument());
  });

  test('shows the fee on the contract value, not on the VAT', async () => {
    setup(withTechnical());
    await clearStepOne();

    const prices = screen.getAllByLabelText(en('bid.unitPrice'));
    fireEvent.change(prices[0], { target: { value: '12.5' } }); // x120 = 1500
    fireEvent.change(prices[1], { target: { value: '400' } }); //  x1  =  400

    // 1,900.000 subtotal, 95.000 VAT, 1,995.000 total. Three decimals always:
    // baisa are not decoration on a price a supplier is held to.
    expect(screen.getAllByText('1,900.000 OMR').length).toBeGreaterThan(0);
    expect(screen.getByText('1,995.000 OMR')).toBeInTheDocument();
    expect(screen.getByText('95.000 OMR')).toBeInTheDocument();
    // 5% of 1900, not of 1995 — the fee is never charged on the state's money.
    expect(screen.getByText('−95.000 OMR')).toBeInTheDocument();
    expect(screen.queryByText('−99.750 OMR')).not.toBeInTheDocument();
  });

  test('the pricing step will not pass with nothing priced', async () => {
    setup(withTechnical());
    await clearStepOne();

    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));

    await waitFor(() => expect(screen.getByText(en('bid.errNoLines'))).toBeInTheDocument());
    expect(screen.queryByText(en('bid.summary'))).not.toBeInTheDocument();
  });

  test('a bid claiming an exception must say what it is', async () => {
    setup(withTechnical());
    await clearStepOne();

    fireEvent.change(screen.getAllByLabelText(en('bid.unitPrice'))[0], { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));
    await waitFor(() => expect(screen.getByLabelText(en('bid.summary'))).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(en('bid.summary')), {
      target: { value: 'Eight weeks with a local crew.' }
    });
    fireEvent.click(screen.getByLabelText(en('bid.yesExceptions')));

    fireEvent.click(screen.getByRole('button', { name: en('bid.submit') }));

    await waitFor(() => expect(screen.getByText(en('bid.errException'))).toBeInTheDocument());
    // The confirmation never opened, so nothing was sent.
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(calls.filter((c) => c.method === 'post')).toHaveLength(0);
  });

  test('a validity outside 1–365 days is refused', async () => {
    setup(withTechnical());
    await clearStepOne();

    fireEvent.change(screen.getAllByLabelText(en('bid.unitPrice'))[0], { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));
    await waitFor(() => expect(screen.getByLabelText(en('bid.summary'))).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(en('bid.summary')), { target: { value: 'Our offer.' } });
    fireEvent.change(screen.getByLabelText(en('bid.validity')), { target: { value: '400' } });
    fireEvent.click(screen.getByRole('button', { name: en('bid.submit') }));

    await waitFor(() => expect(screen.getByText(en('bid.errValidity'))).toBeInTheDocument());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('submitting asks first, because a sent bid cannot be edited', async () => {
    setup(withTechnical());
    await clearStepOne();

    fireEvent.change(screen.getAllByLabelText(en('bid.unitPrice'))[0], { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));
    await waitFor(() => expect(screen.getByLabelText(en('bid.summary'))).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(en('bid.summary')), {
      target: { value: 'Eight weeks with a local crew.' }
    });
    fireEvent.click(screen.getByRole('button', { name: en('bid.submit') }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    // Nothing has been sent while the question is on screen.
    expect(calls.filter((c) => c.method === 'post')).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: en('bid.cancel') }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(calls.filter((c) => c.method === 'post')).toHaveLength(0);
  });

  test('confirming sends the bid, and the client never names its own fee', async () => {
    setup(withTechnical());
    await clearStepOne();

    fireEvent.change(screen.getAllByLabelText(en('bid.unitPrice'))[0], { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: en('bid.next') }));
    await waitFor(() => expect(screen.getByLabelText(en('bid.summary'))).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(en('bid.summary')), { target: { value: 'Our offer.' } });
    fireEvent.click(screen.getByRole('button', { name: en('bid.submit') }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.click(
      dialog.querySelector('button.btn-accent') ||
        screen.getAllByRole('button', { name: en('bid.submit') })[1]
    );

    await waitFor(() => {
      expect(calls.filter((c) => c.url.includes('/submit'))).toHaveLength(1);
    });

    const sent = calls.find((c) => c.url.includes('/submit')).body;
    // Prices go up as rials; every derived figure is the server's to compute.
    expect(sent.lineItems[0].unitPrice).toBe(10);
    expect(sent).not.toHaveProperty('platformFeeRate');
    expect(sent).not.toHaveProperty('platformFeeBaisa');
    expect(sent).not.toHaveProperty('subtotalBaisa');
  });

  test('stepping forward saves a draft, so a closed laptop costs nothing', async () => {
    setup(withTechnical());
    await clearStepOne();

    const saves = calls.filter((c) => c.method === 'put' && c.url.includes('/draft'));
    expect(saves).toHaveLength(1);
    expect(saves[0].body.contactName).toBe('Salim Al Harthy');
  });

  test('a line can be added and removed', async () => {
    setup(withTechnical());
    await clearStepOne();

    expect(screen.getAllByLabelText(en('bid.describeLine'))).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: en('bid.addLine') }));
    expect(screen.getAllByLabelText(en('bid.describeLine'))).toHaveLength(3);

    fireEvent.click(screen.getAllByRole('button', { name: en('bid.removeLine') })[0]);
    expect(screen.getAllByLabelText(en('bid.describeLine'))).toHaveLength(2);
  });

  test('the fee notice states what the fee is charged on', async () => {
    setup(withTechnical());
    await clearStepOne();

    const notice = screen.getByText(en('bid.feeNotice'));
    expect(notice).toBeInTheDocument();
    expect(notice.textContent).toMatch(/5%/);
    expect(notice.textContent).toMatch(/not on the VAT/i);
  });
});
