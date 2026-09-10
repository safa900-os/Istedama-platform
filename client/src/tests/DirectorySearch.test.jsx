import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Companies from '../pages/Companies';
import { LanguageProvider } from '../context/LanguageContext';
import { AuthProvider } from '../context/AuthContext';
import { translations } from '../i18n/translations';

const COMPANIES = [
  { _id: 'c1', companyName: 'Muscat Metals', companyNameAr: 'معادن مسقط', governorate: 'Muscat', istedamaScore: 74, certificateIssued: true },
  { _id: 'c2', companyName: 'Sohar Foods', companyNameAr: 'أغذية صحار', governorate: 'Al Batinah North', istedamaScore: 62, certificateIssued: false }
];

const calls = [];
vi.mock('../api/axios', () => ({
  default: {
    get: (url, config) => {
      calls.push({ url, params: config?.params });
      return Promise.resolve({ data: { data: COMPANIES } });
    }
  }
}));

const renderWith = (ui, path = '/') =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <AuthProvider>{ui}</AuthProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

const en = (k) => translations.en[k];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
  calls.length = 0;
});

/**
 * Search in the bar is a button, not a box.
 *
 * The wide field that used to sit here was squeezed to 48px of usable width by
 * everything else in the bar, which is why it was removed. What is there now is
 * a magnifier that opens a dialog, so the field gets a full-width box of its
 * own and the bar gets back the 230px it could not spare.
 *
 * The directory page keeps its own field, because that is where its results
 * appear.
 */
describe('Search in the bar', () => {
  test('is a button, not a box competing for room in the bar', () => {
    renderWith(<Navbar />);
    // Nothing typable in the bar itself.
    expect(screen.queryByRole('searchbox')).toBeNull();
    expect(screen.queryByPlaceholderText(en('dir.searchPlaceholder'))).toBeNull();
    expect(screen.getByRole('button', { name: en('search.open') })).toBeInTheDocument();
  });

  test('opens a dialog carrying the field, and the field takes focus', async () => {
    renderWith(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: en('search.open') }));

    const dialog = await screen.findByRole('dialog', { name: en('search.dialogLabel') });
    expect(dialog).toBeInTheDocument();

    const box = screen.getByRole('combobox', { name: en('search.inputLabel') });
    // Opening a search and then having to click the field would waste the
    // one thing the dialog exists to save.
    await waitFor(() => expect(box).toHaveFocus());
  });

  test('finds a partner by name, in either language', async () => {
    renderWith(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: en('search.open') }));
    const box = await screen.findByRole('combobox', { name: en('search.inputLabel') });

    fireEvent.change(box, { target: { value: 'nizwa' } });
    expect(await screen.findByRole('option', { name: /Bank Nizwa/i })).toBeInTheDocument();

    // The roster is bilingual; an Arabic query has to reach it too.
    fireEvent.change(box, { target: { value: 'ظفار' } });
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0));
  });

  test('says so plainly when nothing matches', async () => {
    renderWith(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: en('search.open') }));
    const box = await screen.findByRole('combobox', { name: en('search.inputLabel') });
    fireEvent.change(box, { target: { value: 'zzzzzzz' } });
    expect(await screen.findByText(en('search.noResults'))).toBeInTheDocument();
  });

  test('opening the mobile menu still brings no box back', () => {
    renderWith(<Navbar />);
    fireEvent.click(screen.getByRole('button', { name: en('nav.toggleMenu') }));
    expect(screen.queryByRole('searchbox')).toBeNull();
  });

  test('the directory still has its own field, and it filters', async () => {
    renderWith(<Companies />, '/companies');

    const box = await screen.findByPlaceholderText(en('dir.searchPlaceholder'));
    fireEvent.change(box, { target: { value: 'Sohar' } });

    // The query reaches the request, which is what makes it a real filter
    // rather than a box that only looks like one.
    await waitFor(() => {
      const last = calls[calls.length - 1];
      expect(last.params.search).toBe('Sohar');
    });
  });

  test('a query in the address bar is honoured on arrival', async () => {
    renderWith(<Companies />, '/companies?search=Muscat');

    await waitFor(() => {
      expect(calls.some((c) => c.params?.search === 'Muscat')).toBe(true);
    });
    expect(await screen.findByDisplayValue('Muscat')).toBeInTheDocument();
  });

  test('the directory field is labelled for anyone not seeing the magnifier', async () => {
    renderWith(<Companies />, '/companies');
    const box = await screen.findByPlaceholderText(en('dir.searchPlaceholder'));
    expect(box).toHaveAccessibleName();
  });
});
