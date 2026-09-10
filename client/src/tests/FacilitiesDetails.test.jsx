import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Facilities from '../pages/Facilities';
import Partners from '../pages/Partners';
import { LanguageProvider } from '../context/LanguageContext';
import { PARTNER_CATEGORIES, ALL_DIRECTORY_PARTNERS } from '../data/partnerDirectory';
import { translations } from '../i18n/translations';

const ROOM = {
  _id: 'r1',
  type: 'delegation',
  nameAr: 'قاعة الوفود – الطابق الثاني',
  name: 'Delegation Hall — Second Floor',
  descriptionAr: 'قاعة مخصصة للاجتماعات الرسمية.',
  description: 'For official meetings and receiving delegations.',
  image: '/facilities/room2.jpg',
  pricePerHour: 45,
  capacity: 64,
  features: ['Main screen', 'Sound system', 'Translation booth'],
  featuresAr: ['شاشة رئيسية', 'نظام صوتي', 'كابينة ترجمة'],
  available: true
};

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>
}));

vi.mock('../api/axios', () => ({
  default: {
    get: () => Promise.resolve({ data: { data: [ROOM] } }),
    post: () => Promise.resolve({ data: {} })
  }
}));

const renderWith = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </BrowserRouter>
  );

const en = (k) => translations.en[k];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

describe('Viewing a facility’s details', () => {
  test('the details button opens a panel instead of doing nothing', async () => {
    renderWith(<Facilities />);
    fireEvent.click(await screen.findByRole('button', { name: en('fac.details') }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(en('fac.aboutRoom'))).toBeInTheDocument();
    expect(within(dialog).getByText(ROOM.description)).toBeInTheDocument();
  });

  test('it shows every feature, not only the two the card had room for', async () => {
    renderWith(<Facilities />);
    fireEvent.click(await screen.findByRole('button', { name: en('fac.details') }));

    const dialog = await screen.findByRole('dialog');
    for (const feature of ROOM.features) {
      expect(within(dialog).getByText(feature)).toBeInTheDocument();
    }
  });

  test('the rate says what it does not include', async () => {
    renderWith(<Facilities />);
    fireEvent.click(await screen.findByRole('button', { name: en('fac.details') }));

    const dialog = await screen.findByRole('dialog');
    // The booking form adds the extras on top, so an unlabelled figure would
    // read as the total.
    expect(within(dialog).getByText(en('fac.rateNote'))).toBeInTheDocument();
  });

  test('details leads on into booking the same room', async () => {
    renderWith(<Facilities />);
    fireEvent.click(await screen.findByRole('button', { name: en('fac.details') }));

    const details = await screen.findByRole('dialog');
    fireEvent.click(within(details).getByRole('button', { name: en('fac.detailsBook') }));

    await waitFor(() =>
      expect(screen.getByText(en('fac.reviewNoticeTitle'))).toBeInTheDocument()
    );
  });
});

describe('The booking form warns before it is filled in', () => {
  test('it says plainly that sending is not confirming', async () => {
    renderWith(<Facilities />);
    fireEvent.click(await screen.findByRole('button', { name: en('fac.bookNow') }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(en('fac.reviewNoticeTitle'))).toBeInTheDocument();
    expect(within(dialog).getByText(en('fac.reviewNotice'))).toBeInTheDocument();
  });

  test('and states how the confirmation will reach the applicant', async () => {
    renderWith(<Facilities />);
    fireEvent.click(await screen.findByRole('button', { name: en('fac.bookNow') }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(en('fac.requestStateValue'))).toBeInTheDocument();
    expect(within(dialog).getByText(en('fac.confirmChannel'))).toBeInTheDocument();
  });
});

describe('The partners page', () => {
  const ar = (k) => translations.ar[k];

  /*
    A category header and one of its own member tiles can carry the same
    accessible name — «منصة حصتي» is a category of exactly one firm with that
    name. The header is the one with aria-expanded on it.
  */
  const header = (cat) =>
    screen
      .getAllByRole('button', { name: new RegExp(cat.name.en, 'i') })
      .find((b) => b.hasAttribute('aria-expanded'));

  const openAll = (lang = 'en') =>
    fireEvent.click(
      screen.getByRole('button', {
        name: lang === 'ar' ? ar('directory.expandAll') : en('directory.expandAll')
      })
    );

  test('offers every published category as a disclosure', () => {
    renderWith(<Partners />);
    for (const cat of PARTNER_CATEGORIES) {
      // The heading contains the button, so the accessible name of the
      // control is the category — which is what gets announced.
      expect(header(cat)).toHaveAttribute('aria-expanded');
    }
  });

  test('starts with one group open, not all thirty-nine firms at once', () => {
    renderWith(<Partners />);
    const all = screen.getAllByRole('button', { expanded: false })
      .concat(screen.getAllByRole('button', { expanded: true }));
    const open = all.filter((b) => b.getAttribute('aria-expanded') === 'true');
    expect(open).toHaveLength(1);
    // And it is the group a visitor arrives asking about.
    expect(open[0]).toHaveAccessibleName(/Strategic partners/i);
  });

  test('opening a category reveals its firms and closing hides them again', async () => {
    renderWith(<Partners />);
    const legal = PARTNER_CATEGORIES.find((c) => c.id === 'legal');
    const btn = header(legal);

    expect(screen.queryByText(legal.members[0].name.en)).toBeNull();
    fireEvent.click(btn);
    expect(await screen.findByText(legal.members[0].name.en)).toBeInTheDocument();

    fireEvent.click(btn);
    await waitFor(() => expect(screen.queryByText(legal.members[0].name.en)).toBeNull());
  });

  test('every firm on the roster is reachable, and each carries a real mark', async () => {
    const { container } = renderWith(<Partners />);
    expect(ALL_DIRECTORY_PARTNERS).toHaveLength(33);
    openAll();

    for (const m of ALL_DIRECTORY_PARTNERS) {
      // getAllByText: one category shares its name with its only member.
      expect((await screen.findAllByText(m.name.en)).length).toBeGreaterThan(0);
    }

    // The roster used to fall back to a monogram because the programme's
    // marks had not been brought across. They have been now, so a missing
    // file would be a real fault rather than an accepted gap.
    const tiles = container.querySelectorAll('section h3 + div img, [role="region"] img');
    expect(tiles.length).toBeGreaterThanOrEqual(ALL_DIRECTORY_PARTNERS.length);
    for (const img of tiles) expect(img.getAttribute('src')).toMatch(/^\/partners\//);
  });

  test('search narrows the roster and opens what it found', async () => {
    renderWith(<Partners />);
    const box = screen.getByRole('searchbox', { name: en('directory.searchLabel') });

    fireEvent.change(box, { target: { value: 'Nizwa' } });

    // Found, and already open — turning up a result and then making someone
    // open the category it sits in is the search not finishing its job.
    expect(await screen.findByText('Bank Nizwa')).toBeInTheDocument();
    // And the categories that match nothing are gone, not just quieter.
    expect(screen.queryByRole('button', { name: /Legal partners/i })).toBeNull();
  });

  test('says so plainly when a search matches nothing', async () => {
    renderWith(<Partners />);
    fireEvent.change(screen.getByRole('searchbox', { name: en('directory.searchLabel') }), {
      target: { value: 'qqqqqq' }
    });
    expect(await screen.findByText(en('directory.noResults'))).toBeInTheDocument();
  });

  test('a firm the programme publishes a number for shows it, dialable', async () => {
    renderWith(<Partners />);
    openAll();

    fireEvent.click(await screen.findByRole('button', { name: /Dr Ahmed Al Mafarji/i }));
    const dialog = await screen.findByRole('dialog');
    const link = within(dialog).getByRole('link', { name: '99221909' });
    expect(link).toHaveAttribute('href', 'tel:+96899221909');
  });

  test('every firm is named in Arabic too', async () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderWith(<Partners />);
    openAll('ar');
    for (const m of ALL_DIRECTORY_PARTNERS) {
      expect((await screen.findAllByText(m.name.ar)).length).toBeGreaterThan(0);
    }
  });

  test('every kind of partner is drawn by the same card', () => {
    renderWith(<Partners />);
    // The six behind the programme used to sit in a band of their own above
    // the roster — two layouts for the same thing on one page.
    const groups = screen.getAllByRole('button', { expanded: false })
      .concat(screen.getAllByRole('button', { expanded: true }))
      .filter((b) => b.hasAttribute('aria-controls'));

    // The eight published categories, plus the institutions behind the
    // programme, plus the offers — all of them one card.
    expect(groups).toHaveLength(PARTNER_CATEGORIES.length + 2);
    expect(groups.some((b) => /Strategic partners/i.test(b.textContent))).toBe(true);
    expect(groups.some((b) => /Financial & consulting/i.test(b.textContent))).toBe(true);
  });

  test('and the strategic group carries its six institutions', async () => {
    renderWith(<Partners />);
    // Open by default, so its members are already on the page.
    expect(await screen.findByText('SME Development Authority')).toBeInTheDocument();
    expect(screen.getByText('Sohar International')).toBeInTheDocument();
  });
});
