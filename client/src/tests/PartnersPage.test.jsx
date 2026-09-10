import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Partners from '../pages/Partners';
import PartnerStrip from '../components/PartnerStrip';
import { LanguageProvider } from '../context/LanguageContext';
import { STRATEGIC_PARTNERS, SERVICE_PARTNERS, SERVICE_TYPES } from '../data/partners';

// The finder embeds a Leaflet map, which needs layout the jsdom environment
// does not provide. The page's own behaviour is what is under test here.
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>
}));

const renderWith = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </BrowserRouter>
  );

beforeEach(() => {
  localStorage.clear();
});

describe('Partner registry is a single source of truth', () => {
  test('every strategic partner has the fields both consumers rely on', () => {
    for (const p of STRATEGIC_PARTNERS) {
      expect(p.id).toBeTruthy();
      expect(p.logo).toMatch(/^\/partners\//);
      for (const field of ['name', 'kind', 'city']) {
        expect(p[field].en).toBeTruthy();
        expect(p[field].ar).toBeTruthy();
      }
      expect(Number.isFinite(p.lat)).toBe(true);
      expect(Number.isFinite(p.lng)).toBe(true);
    }
  });

  test('ids are unique across each list', () => {
    const strategic = STRATEGIC_PARTNERS.map((p) => p.id);
    const service = SERVICE_PARTNERS.map((p) => p.id);
    expect(new Set(strategic).size).toBe(strategic.length);
    expect(new Set(service).size).toBe(service.length);
  });

  test('exactly one lead partner', () => {
    expect(STRATEGIC_PARTNERS.filter((p) => p.primary)).toHaveLength(1);
  });

  test('coordinates fall inside Oman', () => {
    // The partner dialog prints these, and the offer finder drops a Leaflet
    // marker on them, so a coordinate outside the country would be visible
    // as a wrong place rather than as a crash.
    for (const p of [...STRATEGIC_PARTNERS, ...SERVICE_PARTNERS]) {
      expect(p.lat).toBeGreaterThan(16.4);
      expect(p.lat).toBeLessThan(26.6);
      expect(p.lng).toBeGreaterThan(51.8);
      expect(p.lng).toBeLessThan(60.1);
    }
  });

  test('the page and the home-page strip render the same partner set', () => {
    const { unmount } = renderWith(<PartnerStrip />);
    // The strip shows marks, not names, so it is counted by what each control
    // is called rather than by text on the page.
    const onStrip = STRATEGIC_PARTNERS.filter(
      (p) => screen.queryAllByRole('button', { name: new RegExp(p.name.en, 'i') }).length > 0
    ).length;
    unmount();

    renderWith(<Partners />);
    const onPage = STRATEGIC_PARTNERS.filter(
      (p) => screen.getAllByText(new RegExp(p.name.en, 'i')).length > 0
    ).length;

    expect(onPage).toBe(STRATEGIC_PARTNERS.length);
    expect(onStrip).toBe(onPage);
  });
});

describe('Partners page', () => {
  /*
    The offers are a group in the roster now, not a section of their own below
    it, so they start collapsed like every other group. These tests open that
    card first — which is what a visitor does too.
  */
  const openOffers = () =>
    fireEvent.click(
      screen.getAllByRole('button', { expanded: false })
        .find((b) => /Financial & consulting/i.test(b.textContent))
    );

  test('shows every strategic partner as its own control', () => {
    renderWith(<Partners />);
    for (const p of STRATEGIC_PARTNERS) {
      expect(screen.getAllByText(new RegExp(p.name.en, 'i')).length).toBeGreaterThan(0);
    }
  });

  test('opens a detail dialog for a partner and closes it again', async () => {
    renderWith(<Partners />);
    const partner = STRATEGIC_PARTNERS.find((p) => !p.primary);

    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: new RegExp(partner.name.en, 'i') }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(new RegExp(partner.city.en, 'i'))).toBeInTheDocument();

    // Escape closes it. Removal is asynchronous because AnimatePresence keeps
    // the node mounted for its exit transition, so this waits rather than
    // asserting on the next tick.
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  test('the offer finder filters by partner type', () => {
    renderWith(<Partners />);
    openOffers();

    // Every offer is listed before any filter is applied.
    for (const p of SERVICE_PARTNERS) {
      expect(screen.getAllByText(new RegExp(p.offer.en, 'i')).length).toBeGreaterThan(0);
    }

    // Narrowing to consulting drops the banks.
    const consulting = SERVICE_PARTNERS.filter((p) => p.type === 'consulting');
    const banks = SERVICE_PARTNERS.filter((p) => p.type === 'bank');
    fireEvent.click(screen.getByRole('button', { name: /^consulting/i }));

    expect(screen.getAllByText(new RegExp(consulting[0].offer.en, 'i')).length).toBeGreaterThan(0);
    expect(screen.queryByText(new RegExp(banks[0].offer.en, 'i'))).toBeNull();
  });

  test('a filter chip exists for every type present in the data', () => {
    renderWith(<Partners />);
    openOffers();
    // 'All' plus one per type — driven by the data, not a hardcoded list.
    for (const type of SERVICE_TYPES) {
      expect(SERVICE_PARTNERS.some((p) => p.type === type)).toBe(true);
    }
    expect(screen.getByRole('button', { name: /^all/i })).toBeInTheDocument();
  });
});

describe('Partners page in Arabic', () => {
  test('renders Arabic names when the language is Arabic', () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderWith(<Partners />);

    for (const p of STRATEGIC_PARTNERS) {
      expect(screen.getAllByText(new RegExp(p.name.ar)).length).toBeGreaterThan(0);
    }
    expect(document.documentElement.dir).toBe('rtl');
  });
});
