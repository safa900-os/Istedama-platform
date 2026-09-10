import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';

/** Small probe component that exercises pick() the way the pages do. */
function Probe() {
  const { pick, toggleLang, tGov } = useLanguage();
  const company = {
    companyName: 'Batinah Solar Solutions LLC',
    companyNameAr: 'شركة الباطنة لحلول الطاقة الشمسية ش.م.م',
    sector: 'Renewable Energy',
    sectorAr: 'الطاقة المتجددة',
    governorate: 'Al Batinah North'
  };
  const legacy = { companyName: 'Legacy Record Only' }; // no Arabic field
  return (
    <div>
      <button onClick={toggleLang}>toggle</button>
      <p data-testid="name">{pick(company, 'companyName')}</p>
      <p data-testid="sector">{pick(company, 'sector')}</p>
      <p data-testid="gov">{tGov(company.governorate)}</p>
      <p data-testid="legacy">{pick(legacy, 'companyName')}</p>
    </div>
  );
}

const renderProbe = () =>
  render(
    <BrowserRouter>
      <LanguageProvider>
        <Probe />
      </LanguageProvider>
    </BrowserRouter>
  );

describe('Database content is bilingual', () => {
  beforeEach(() => localStorage.clear());

  test('company name, sector and governorate all switch to Arabic', () => {
    renderProbe();
    expect(screen.getByTestId('name')).toHaveTextContent('Batinah Solar Solutions LLC');
    expect(screen.getByTestId('gov')).toHaveTextContent('Al Batinah North');

    fireEvent.click(screen.getByText('toggle'));

    expect(screen.getByTestId('name')).toHaveTextContent('شركة الباطنة لحلول الطاقة الشمسية ش.م.م');
    expect(screen.getByTestId('sector')).toHaveTextContent('الطاقة المتجددة');
    expect(screen.getByTestId('gov')).toHaveTextContent('شمال الباطنة');
  });

  test('records without an Arabic field fall back to English instead of rendering blank', () => {
    renderProbe();
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('legacy')).toHaveTextContent('Legacy Record Only');
  });
});
