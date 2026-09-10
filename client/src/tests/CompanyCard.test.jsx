import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CompanyCard, { monogram } from '../components/CompanyCard';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

const COMPANY = {
  _id: 'c1',
  companyName: 'Rustaq Date Products Co.',
  companyNameAr: 'شركة الرستاق لمنتجات التمور',
  sector: 'Food Processing',
  sectorAr: 'تصنيع الأغذية',
  governorate: 'Al Batinah South',
  crNumber: '1334567',
  omanizationRate: 73.1,
  hasRiyadaCard: true
};

const renderCard = (company = COMPANY) =>
  render(
    <MemoryRouter>
      <LanguageProvider>
        <CompanyCard company={company} />
      </LanguageProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'ar');
});

/**
 * The mark is drawn, not fetched — no company on the register supplies a logo,
 * and inventing one for somebody else's business is worse than not having one.
 * What matters is that the drawn marks tell each other apart.
 */
describe('The monogram', () => {
  test('skips the word almost every Arabic company name starts with', () => {
    // Naively, «شركة …» and «مؤسسة …» would make the whole directory ش and م.
    expect(monogram('شركة الرستاق لمنتجات التمور')).not.toBe('ش');
    expect(monogram('مؤسسة الوسطى للعافية الصحراوية')).toBe('و');
    // «مؤسسة مسندم» is still م, because the word after the prefix begins with
    // one too — the prefix was dropped all the same.
    expect(monogram('مؤسسة مسندم لسياحة المغامرات')).toBe('م');
  });

  test('and the definite article after it, which is nearly as common', () => {
    // «شركة الرستاق» -> «الرستاق» -> «رستاق»
    expect(monogram('شركة الرستاق لمنتجات التمور')).toBe('ر');
  });

  test('so names that share a prefix still get different marks', () => {
    const names = [
      'شركة الرستاق لمنتجات التمور',
      'شركة عبري لمعالجة المعادن ش.م.م',
      'شركة صور للصناعات البحرية ش.م.م',
      'مؤسسة مسندم لسياحة المغامرات'
    ];
    expect(new Set(names.map(monogram)).size).toBe(names.length);
  });

  test('an English name keeps its own first letter', () => {
    expect(monogram('Rustaq Date Products Co.')).toBe('R');
  });

  test('an empty name does not throw', () => {
    expect(monogram('')).toBe('•');
    expect(monogram(undefined)).toBe('•');
  });
});

describe('The company card', () => {
  test('names the sector in words, so the colour is never the only carrier', () => {
    renderCard();
    expect(screen.getByText(COMPANY.sectorAr)).toBeInTheDocument();
  });

  test('gives the Omanization rate a figure as well as a meter', () => {
    renderCard();
    // Labelled, so it reads as a value rather than as decoration. The label
    // carries Arabic-Indic digits here, which is the point of formatting it
    // through the language context rather than printing the raw number.
    const meter = screen.getByRole('img');
    expect(meter).toHaveAccessibleName(
      new RegExp(translations.ar['dir.omanization'])
    );
    expect(meter.firstChild).toHaveStyle({ width: '73.1%' });
    expect(screen.getByText(/٧٣/)).toBeInTheDocument();
  });

  test('a rate outside 0–100 cannot draw a bar wider than its track', () => {
    renderCard({ ...COMPANY, omanizationRate: 140 });
    expect(screen.getByRole('img').firstChild).toHaveStyle({ width: '100%' });
  });

  test('the whole card is one link to that company', () => {
    renderCard();
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/companies/c1');
    expect(within(link).getByText(COMPANY.companyNameAr)).toBeInTheDocument();
  });

  test('a Riyada card holder is marked; a firm without one is not', () => {
    const { unmount } = renderCard();
    expect(screen.getByText(translations.ar['detail.riyada'])).toBeInTheDocument();
    unmount();

    renderCard({ ...COMPANY, hasRiyadaCard: false });
    expect(screen.queryByText(translations.ar['detail.riyada'])).toBeNull();
  });

  test('a real logo is used where one exists, instead of the monogram', () => {
    renderCard({ ...COMPANY, logo: '/logos/rustaq.png' });
    expect(document.querySelector('img[src="/logos/rustaq.png"]')).toBeTruthy();
    expect(screen.queryByText('ر')).toBeNull();
  });

  test('the same sector always draws the same tone', () => {
    const { container: a } = renderCard();
    const toneA = a.querySelector('span[aria-hidden="true"]').className;
    const { container: b } = renderCard({ ...COMPANY, _id: 'c2', companyName: 'Other Co.' });
    // Colour keyed to the sector is information; colour keyed to the row is not.
    expect(b.querySelector('span[aria-hidden="true"]').className).toBe(toneA);
  });

  test('a different sector draws a different one', () => {
    const { container: a } = renderCard();
    const { container: b } = renderCard({ ...COMPANY, _id: 'c3', sector: 'Mining & Materials' });
    expect(b.querySelector('span[aria-hidden="true"]').className)
      .not.toBe(a.querySelector('span[aria-hidden="true"]').className);
  });
});
