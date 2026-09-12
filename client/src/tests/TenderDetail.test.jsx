import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import TenderDetail from '../pages/TenderDetail';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { translations } from '../i18n/translations';

/*
  The detail page is what a supplier reads before committing a price, so what
  matters is that every published term actually reaches the screen — and that a
  closed tender does not offer a form the server would refuse.
*/

let tender;
const calls = [];

vi.mock('../api/axios', () => ({
  default: {
    get: (url) => {
      calls.push(url);
      if (url.includes('/content/tenders/')) {
        return tender
          ? Promise.resolve({ data: { data: tender } })
          : Promise.reject(new Error('not found'));
      }
      return Promise.resolve({ data: { data: null } });
    },
    put: () => Promise.resolve({ data: { data: {} } }),
    post: () => Promise.resolve({ data: { data: {} } })
  }
}));

const OPEN_TENDER = {
  _id: 'tender1',
  refNo: 12,
  status: 'open',
  category: 'maintenance',
  title: 'Maintenance of technical systems',
  orgName: 'Istedama Partnerships Foundation',
  location: 'Muscat',
  description: 'Server maintenance, network hardening and a support agreement.',
  closingDate: new Date(Date.now() + 9 * 864e5).toISOString(),
  durationDays: 365,
  evaluationCriteria: [
    { label: 'Price', weight: 40 },
    { label: 'Technical capability', weight: 35 },
    { label: 'Local content', weight: 25 }
  ],
  phases: [
    { name: 'Survey and assessment', durationDays: 21 },
    { name: 'Upgrade and migration', durationDays: 60 }
  ],
  requirements: [
    { kind: 'local_content', text: 'At least 60% of the delivery team to be Omani nationals.' },
    { kind: 'sustainability', text: 'Replaced hardware to go to a licensed recycler.' }
  ],
  scopeItems: [
    { description: 'Server maintenance visit', unit: 'visit', quantity: 12 },
    { description: 'Network switch replacement', unit: 'unit', quantity: 8 }
  ]
};

const en = (key) => translations.en[key];

const setup = () =>
  render(
    <MemoryRouter initialEntries={['/tenders/tender1']}>
      <LanguageProvider>
        <AuthProvider>
          <Routes>
            <Route path="/tenders/:id" element={<TenderDetail />} />
          </Routes>
        </AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  calls.length = 0;
  localStorage.clear();
  tender = { ...OPEN_TENDER };
});

describe('A tender, in full', () => {
  test('publishes every term a supplier needs to price the work', async () => {
    setup();
    await screen.findByText(OPEN_TENDER.title);

    expect(screen.getByText(OPEN_TENDER.description)).toBeInTheDocument();
    expect(screen.getByText('Muscat')).toBeInTheDocument();
    expect(screen.getByText('365 days')).toBeInTheDocument();

    // Scoring, with the weights that were published.
    expect(screen.getByText(en('td.evaluation'))).toBeInTheDocument();
    expect(screen.getByText('Price')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();

    expect(screen.getByText('1. Survey and assessment')).toBeInTheDocument();
    expect(
      screen.getByText('At least 60% of the delivery team to be Omani nationals.')
    ).toBeInTheDocument();
    // 'Local content' is both a scoring criterion and a condition kind here —
    // as it would be on a real tender.
    expect(screen.getAllByText(en('td.local_content')).length).toBeGreaterThan(0);

    // The bill of quantities, with the buyer's own quantities.
    expect(screen.getByText('Server maintenance visit')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  test('a tender with none of that published still renders, without empty headings', async () => {
    tender = {
      _id: 'tender1',
      refNo: 99,
      status: 'open',
      category: 'supply',
      title: 'A sparse tender',
      orgName: 'Buyer LLC',
      closingDate: new Date(Date.now() + 5 * 864e5).toISOString()
    };

    setup();
    await screen.findByText('A sparse tender');

    for (const key of ['td.evaluation', 'td.phases', 'td.conditions', 'td.boq']) {
      expect(screen.queryByText(en(key))).not.toBeInTheDocument();
    }
    // Duration is a fixed slot in the masthead, so it shows a dash, not a zero.
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  test('a closed tender says so and offers no bid form', async () => {
    tender = { ...OPEN_TENDER, status: 'closed' };
    setup();
    await screen.findByText(OPEN_TENDER.title);

    expect(screen.getByText(en('td.closed'))).toBeInTheDocument();
    expect(screen.queryByText(en('bid.title'))).not.toBeInTheDocument();
  });

  test('one whose closing date has passed is treated the same, whatever its status says', async () => {
    tender = { ...OPEN_TENDER, status: 'open', closingDate: new Date(Date.now() - 864e5).toISOString() };
    setup();
    await screen.findByText(OPEN_TENDER.title);

    expect(screen.getByText(en('td.closed'))).toBeInTheDocument();
    expect(screen.queryByText(en('bid.title'))).not.toBeInTheDocument();
  });

  test('a visitor who is not signed in is asked to sign in, not shown the form', async () => {
    setup();
    await screen.findByText(OPEN_TENDER.title);

    expect(screen.getByText(en('td.signInToBid'))).toBeInTheDocument();
    expect(screen.queryByText(en('bid.title'))).not.toBeInTheDocument();
    // and no authenticated call was made on their behalf
    expect(calls.some((url) => url.includes('/applications/'))).toBe(false);
  });

  test('a tender that is gone says so rather than showing a blank page', async () => {
    tender = null;
    setup();

    await waitFor(() => expect(screen.getByText(en('td.notFound'))).toBeInTheDocument());
    expect(screen.getByText(en('td.back'))).toBeInTheDocument();
  });
});
