import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import RegistrationQueue from '../pages/admin/RegistrationQueue';
import RegistrationRecord from '../pages/admin/RegistrationRecord';
import Notifications from '../pages/Notifications';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

/*
  The reviewer decides whether a business may take part in a procurement. What
  matters on screen: the three kinds of applicant stay apart, an out-of-date
  document is impossible to miss, and a rejection cannot be sent without a
  reason the applicant can act on.
*/

const calls = [];
let rows;
let notifications;

const day = 864e5;

vi.mock('../api/axios', () => ({
  default: {
    get: (url, config) => {
      calls.push({ method: 'get', url, params: config?.params });
      if (url.includes('/documents/catalogue')) {
        return Promise.resolve({
          data: {
            data: {
              slots: [
                { slot: 'cr', label: { en: 'Commercial Registration', ar: 'السجل التجاري' } },
                { slot: 'logo', label: { en: 'Company logo', ar: 'شعار الشركة' } }
              ]
            }
          }
        });
      }
      if (url.includes('/notifications')) {
        return Promise.resolve({
          data: { data: notifications, unreadCount: notifications.filter((n) => !n.isRead).length }
        });
      }
      return Promise.resolve({ data: { data: rows } });
    },
    patch: (url, body) => {
      calls.push({ method: 'patch', url, body });
      return Promise.resolve({ data: { data: {} } });
    },
    post: (url, body) => {
      calls.push({ method: 'post', url, body });
      return Promise.resolve({ data: { data: {} } });
    }
  }
}));

const en = (key) => translations.en[key];

const record = (overrides = {}) => ({
  _id: 'reg1',
  companyName: 'Al Nahda Trading',
  companyNameAr: 'النهضة للتجارة',
  crNumber: '1234567',
  entityType: 'merchant',
  governorate: 'Muscat',
  registrationStatus: 'submitted',
  submittedAt: new Date(Date.now() - 2 * day).toISOString(),
  reviewedAt: null,
  rejectionReason: '',
  owner: { name: 'Khalid Al Amri', email: 'khalid@example.om', phone: '91234567' },
  documents: [],
  expiredDocuments: [],
  expiringDocuments: [],
  documentsCurrent: true,
  ...overrides
});

const queue = (entityType = 'merchant') =>
  render(
    <MemoryRouter initialEntries={[`/admin/registrations/${entityType}`]}>
      <LanguageProvider>
        <Routes>
          <Route path="/admin/registrations/:entityType" element={<RegistrationQueue />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>
  );

const detail = () =>
  render(
    <MemoryRouter initialEntries={['/admin/registrations/merchant/reg1']}>
      <LanguageProvider>
        <Routes>
          <Route path="/admin/registrations/:entityType/:id" element={<RegistrationRecord />} />
        </Routes>
      </LanguageProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  calls.length = 0;
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
  rows = [record()];
  notifications = [];
});

describe('The review queue', () => {
  test('asks the server for one kind of applicant, not all of them at once', async () => {
    queue('freelance');

    await waitFor(() => {
      const q = calls.find((c) => c.url === '/admin/registrations');
      expect(q.params.entityType).toBe('freelance');
    });
  });

  test('each kind has its own page and its own description', async () => {
    queue('organization');
    await screen.findByText(en('rev.organizationLead'));

    // The three tabs are links, so each is a URL of its own.
    for (const key of ['merchant', 'organization', 'freelance']) {
      const tab = screen.getByRole('link', { name: en(`rev.${key}`) });
      expect(tab).toHaveAttribute('href', `/admin/registrations/${key}`);
    }
  });

  test('a row with an expired document says so before it is opened', async () => {
    rows = [
      record({
        expiredDocuments: [{ slot: 'cr', expiryDate: new Date(Date.now() - 5 * day).toISOString() }]
      })
    ];
    queue();

    await screen.findByText('Al Nahda Trading');
    expect(screen.getByText(/Expired · 1/)).toBeInTheDocument();
  });

  test('an empty queue says so rather than showing nothing', async () => {
    rows = [];
    queue();

    await waitFor(() => expect(screen.getByText(en('rev.queueEmpty'))).toBeInTheDocument());
  });

  test('the status filter changes what is asked for', async () => {
    queue();
    await screen.findByText('Al Nahda Trading');

    fireEvent.change(screen.getByLabelText(en('rev.filterStatus')), { target: { value: 'approved' } });

    await waitFor(() => {
      const last = calls.filter((c) => c.url === '/admin/registrations').pop();
      expect(last.params.status).toBe('approved');
    });
  });
});

describe('Deciding one registration', () => {
  test('shows the applicant and the business on one page', async () => {
    detail();

    await screen.findByRole('heading', { name: 'Al Nahda Trading' });
    expect(screen.getByText('Khalid Al Amri')).toBeInTheDocument();
    expect(screen.getByText('khalid@example.om')).toBeInTheDocument();
  });

  test('an expired document is impossible to miss, and can be raised with the applicant', async () => {
    rows = [
      record({
        documents: [
          {
            _id: 'd1',
            slot: 'cr',
            originalName: 'cr.pdf',
            expiryDate: new Date(Date.now() - 5 * day).toISOString()
          }
        ],
        expiredDocuments: [{ slot: 'cr', expiryDate: new Date(Date.now() - 5 * day).toISOString() }],
        documentsCurrent: false
      })
    ];
    detail();

    await screen.findByText(en('rev.expiryWarning'));
    // Named by the label the server publishes, not by its slot key.
    expect(screen.getAllByText(/Commercial Registration/).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: new RegExp(en('rev.notifyExpiry')) }));

    await waitFor(() => {
      expect(calls.some((c) => c.url === '/admin/registrations/reg1/notify-expiry')).toBe(true);
    });
  });

  test('a document with no expiry is not reported as expired', async () => {
    rows = [
      record({
        documents: [{ _id: 'd2', slot: 'logo', originalName: 'logo.png', expiryDate: null }]
      })
    ];
    detail();

    await screen.findByText('logo.png');
    expect(screen.getByText(en('rev.noExpiry'))).toBeInTheDocument();
    expect(screen.queryByText(en('rev.expiryWarning'))).not.toBeInTheDocument();
  });

  test('a rejection cannot be sent without a reason', async () => {
    detail();
    await screen.findByRole('heading', { name: 'Al Nahda Trading' });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(en('rev.reject')) }));
    // The reason box opens; sending with it empty is refused.
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${en('rev.reject')}`) }));

    await waitFor(() => expect(screen.getByText(en('rev.errReason'))).toBeInTheDocument());
    expect(calls.some((c) => c.url.includes('/reject'))).toBe(false);
  });

  test('a rejection sends the reason the applicant will read', async () => {
    detail();
    await screen.findByRole('heading', { name: 'Al Nahda Trading' });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(en('rev.reject')) }));
    fireEvent.change(await screen.findByLabelText(en('rev.rejectReason')), {
      target: { value: 'The commercial registration has expired.' }
    });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${en('rev.reject')}`) }));

    await waitFor(() => {
      const sent = calls.find((c) => c.url.includes('/reject'));
      expect(sent.body.reason).toBe('The commercial registration has expired.');
    });
  });

  test('approval asks first, because it admits a business to the procurement', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    detail();
    await screen.findByRole('heading', { name: 'Al Nahda Trading' });

    fireEvent.click(screen.getByRole('button', { name: new RegExp(en('rev.approve')) }));

    expect(confirm).toHaveBeenCalled();
    expect(calls.some((c) => c.url.includes('/approve'))).toBe(false);

    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: new RegExp(en('rev.approve')) }));
    await waitFor(() => {
      expect(calls.some((c) => c.url === '/admin/registrations/reg1/approve')).toBe(true);
    });
    confirm.mockRestore();
  });

  test('a decided registration offers no further decision', async () => {
    rows = [
      record({
        registrationStatus: 'approved',
        reviewedAt: new Date().toISOString()
      })
    ];
    detail();

    await screen.findByText(en('rev.alreadyDecided'));
    expect(screen.queryByRole('button', { name: new RegExp(en('rev.approve')) })).not.toBeInTheDocument();
  });
});

describe('What the applicant sees', () => {
  test('a notice carries the date and the time it was decided', async () => {
    const at = new Date('2026-09-12T09:30:00Z');
    notifications = [
      {
        _id: 'n1',
        kind: 'registration_approved',
        title: 'Your registration has been approved',
        titleAr: 'تمت الموافقة على تسجيلك',
        body: 'Al Nahda Trading is approved.',
        bodyAr: 'تمت الموافقة.',
        createdAt: at.toISOString(),
        isRead: false
      }
    ];

    render(
      <MemoryRouter>
        <LanguageProvider>
          <Notifications />
        </LanguageProvider>
      </MemoryRouter>
    );

    await screen.findByText('Your registration has been approved');
    // Both parts, not "3 days ago" — the applicant is checking a date.
    expect(screen.getByText(/12 September 2026/)).toBeInTheDocument();
    expect(screen.getByText(/\d{2}:\d{2}/)).toBeInTheDocument();
    expect(screen.getByText(en('notif.new'))).toBeInTheDocument();
  });

  test('an empty list says so', async () => {
    notifications = [];
    render(
      <MemoryRouter>
        <LanguageProvider>
          <Notifications />
        </LanguageProvider>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(en('notif.empty'))).toBeInTheDocument());
  });
});
