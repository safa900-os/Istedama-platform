import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Services from '../pages/Services';
import { LanguageProvider } from '../context/LanguageContext';
import { SERVICE_CATEGORIES, ALL_SERVICES, SERVICE_COUNTS } from '../data/services';
import { translations } from '../i18n/translations';

const renderPage = () =>
  render(
    <BrowserRouter>
      <LanguageProvider>
        <Services />
      </LanguageProvider>
    </BrowserRouter>
  );

const cards = () => screen.getAllByRole('article');

/**
 * The catalogue is data, so guard its shape here rather than through the DOM.
 * The important property is honesty: a service marked "live" must actually
 * lead somewhere.
 */
describe('Service catalogue', () => {
  test('covers all nine categories from the requirements document', () => {
    expect(SERVICE_CATEGORIES).toHaveLength(9);
    const ids = SERVICE_CATEGORIES.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('every service is bilingual', () => {
    for (const s of ALL_SERVICES) {
      expect(s.title.en?.length).toBeGreaterThan(0);
      expect(s.title.ar?.length).toBeGreaterThan(0);
      expect(s.body.en?.length).toBeGreaterThan(0);
      expect(s.body.ar?.length).toBeGreaterThan(0);
    }
  });

  test('every category is bilingual too', () => {
    for (const c of SERVICE_CATEGORIES) {
      expect(c.title.ar?.length).toBeGreaterThan(0);
      expect(c.blurb.ar?.length).toBeGreaterThan(0);
    }
  });

  test('service ids are unique across the whole catalogue', () => {
    const ids = ALL_SERVICES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('a service marked live always has a destination', () => {
    const broken = ALL_SERVICES.filter((s) => s.status === 'live' && !s.to);
    expect(broken).toEqual([]);
  });

  test('a planned service never carries a destination, so nothing links to a dead route', () => {
    const wrong = ALL_SERVICES.filter((s) => s.status === 'soon' && s.to);
    expect(wrong).toEqual([]);
  });

  test('every status is one of the two known values', () => {
    for (const s of ALL_SERVICES) {
      expect(['live', 'soon']).toContain(s.status);
    }
  });

  test('the counts match the data they summarise', () => {
    expect(SERVICE_COUNTS.live + SERVICE_COUNTS.soon).toBe(SERVICE_COUNTS.total);
    expect(SERVICE_COUNTS.total).toBe(ALL_SERVICES.length);
  });

  test('live destinations point at routes the app actually registers', () => {
    const KNOWN = [
      '/', '/about', '/contact', '/companies', '/dashboard', '/tenders',
      '/facilities', '/discounts', '/advertise', '/news', '/services',
      '/register', '/partners'
    ];
    for (const s of ALL_SERVICES.filter((x) => x.status === 'live')) {
      expect(KNOWN).toContain(s.to);
    }
  });

  test('the page copy keys exist in both languages', () => {
    for (const key of ['svc.title', 'svc.lead', 'svc.live', 'svc.soon', 'svc.none', 'nav.servicesPage']) {
      expect(translations.en[key]).toBeTruthy();
      expect(translations.ar[key]).toBeTruthy();
    }
  });
});

/**
 * The catalogue page itself: one card per category, and two ways of narrowing
 * it that have to compose rather than fight.
 */
describe('Service catalogue page', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('istidamah_lang', 'en');
  });

  test('lays out one card per category, each carrying its whole service list', () => {
    renderPage();
    expect(cards()).toHaveLength(SERVICE_CATEGORIES.length);

    for (const cat of SERVICE_CATEGORIES) {
      const card = screen.getByRole('article', { name: cat.title.en });
      expect(within(card).getAllByRole('listitem')).toHaveLength(cat.items.length);
    }
  });

  test('an available service is a link to where it goes; a planned one is not a link', () => {
    renderPage();

    for (const s of ALL_SERVICES) {
      const heading = screen.getByText(s.title.en);
      const row = heading.closest('a');
      if (s.status === 'live') {
        expect(row).not.toBeNull();
        expect(row).toHaveAttribute('href', s.to);
      } else {
        // A planned service dressed as a link would be a promise the page
        // cannot keep.
        expect(row).toBeNull();
      }
    }
  });

  test('a planned service says so in words, not only by being greyer', () => {
    renderPage();
    expect(screen.getAllByText(translations.en['svc.soon'])).toHaveLength(SERVICE_COUNTS.soon);
  });

  const picker = () => screen.getByLabelText(translations.en['svc.filter']);

  test('the dropdown narrows the grid to one category', () => {
    renderPage();
    const facilities = SERVICE_CATEGORIES.find((c) => c.id === 'facilities');

    fireEvent.change(picker(), { target: { value: 'facilities' } });

    expect(cards()).toHaveLength(1);
    expect(screen.getByRole('article', { name: facilities.title.en })).toBeInTheDocument();
  });

  test('it offers every category, and each says how much is in it', () => {
    renderPage();
    // The chips it replaces scrolled sideways, so most categories were off
    // the edge of the screen and the shape of the catalogue was hidden.
    const options = within(picker()).getAllByRole('option');
    expect(options).toHaveLength(SERVICE_CATEGORIES.length + 1);
    expect(options[0]).toHaveTextContent(translations.en['svc.all']);

    for (const c of SERVICE_CATEGORIES) {
      const opt = options.find((o) => o.value === c.id);
      expect(opt).toBeTruthy();
      expect(opt).toHaveTextContent(String(c.items.length));
    }
  });

  test('the chosen category is the control’s own value, not a highlight', () => {
    renderPage();
    expect(picker()).toHaveValue('all');
    fireEvent.change(picker(), { target: { value: 'facilities' } });
    // A select reports its state through its value, which assistive tech
    // reads out; the chips relied on us remembering to set aria-pressed.
    expect(picker()).toHaveValue('facilities');
  });

  test('choosing all categories puts everything back', () => {
    renderPage();
    fireEvent.change(picker(), { target: { value: 'certificates' } });
    expect(cards()).toHaveLength(1);

    fireEvent.change(picker(), { target: { value: 'all' } });
    expect(cards()).toHaveLength(SERVICE_CATEGORIES.length);
  });

  test('the page opens on its catalogue, not on a paragraph about itself', () => {
    renderPage();
    // The lead and the two count pills were removed: the cards below say
    // what is available far better than a sentence claiming it does.
    expect(screen.queryByText(translations.en['svc.lead'])).toBeNull();
    expect(screen.getByRole('heading', { level: 1, name: translations.en['svc.title'] }))
      .toBeInTheDocument();
  });

  test('searching cuts across every category at once', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(translations.en['svc.search']), {
      target: { value: 'hall' }
    });

    const matches = ALL_SERVICES.filter(
      (s) =>
        s.title.en.toLowerCase().includes('hall') || s.body.en.toLowerCase().includes('hall')
    );
    expect(matches.length).toBeGreaterThan(0);
    for (const m of matches) expect(screen.getByText(m.title.en)).toBeInTheDocument();

    // And the services that do not match are gone, not merely dimmed.
    expect(screen.queryByText('Membership renewal')).toBeNull();
  });

  test('search and category filter compose instead of overriding each other', () => {
    renderPage();
    const certificates = SERVICE_CATEGORIES.find((c) => c.id === 'certificates');

    fireEvent.change(picker(), { target: { value: certificates.id } });
    fireEvent.change(screen.getByLabelText(translations.en['svc.search']), {
      target: { value: 'hall' }
    });

    // "Hall booking" matches the query but sits in another category, so the
    // narrower of the two answers wins rather than the more recent one.
    expect(screen.queryByText('Hall booking')).toBeNull();
    expect(screen.getByText(translations.en['svc.none'])).toBeInTheDocument();
  });

  test('a search matching nothing says so rather than showing an empty grid', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(translations.en['svc.search']), {
      target: { value: 'zzzzz' }
    });
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText(translations.en['svc.none'])).toBeInTheDocument();
  });

  test('clearing the search brings the whole catalogue back', () => {
    renderPage();
    const box = screen.getByLabelText(translations.en['svc.search']);
    fireEvent.change(box, { target: { value: 'zzzzz' } });
    fireEvent.click(screen.getByRole('button', { name: translations.en['svc.clear'] }));

    expect(cards()).toHaveLength(SERVICE_CATEGORIES.length);
  });

  test('renders in Arabic when the language is Arabic', () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderPage();
    for (const cat of SERVICE_CATEGORIES) {
      expect(screen.getByRole('article', { name: cat.title.ar })).toBeInTheDocument();
    }
  });
});
