import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import About from '../pages/About';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

vi.mock('../api/axios', () => ({
  default: { get: () => Promise.resolve({ data: { data: null } }) }
}));

const renderAbout = () =>
  render(
    <BrowserRouter>
      <LanguageProvider>
        <About />
      </LanguageProvider>
    </BrowserRouter>
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

describe('About the programme', () => {
  test('says what Istedama is, which the page previously never did', () => {
    renderAbout();
    expect(screen.getByText(translations.en['about.whatTitle'])).toBeInTheDocument();
    expect(screen.getByText(translations.en['about.whatP1'])).toBeInTheDocument();
    for (const k of ['about.whatB1', 'about.whatB2', 'about.whatB3']) {
      expect(screen.getByText(translations.en[k])).toBeInTheDocument();
    }
  });

  test('carries all six platform objectives', () => {
    renderAbout();
    for (let i = 1; i <= 6; i += 1) {
      expect(screen.getByText(translations.en[`about.obj${i}Title`])).toBeInTheDocument();
      expect(screen.getByText(translations.en[`about.obj${i}Body`])).toBeInTheDocument();
    }
  });

  test('carries all four values', () => {
    renderAbout();
    for (let i = 1; i <= 4; i += 1) {
      expect(screen.getByText(translations.en[`about.val${i}Title`])).toBeInTheDocument();
    }
  });

  test('no heading is printed twice as its own eyebrow', () => {
    renderAbout();
    // `SectionHead` was handed the same string for eyebrow and title, so
    // "Governance and integrity" and "The programme in numbers" each appeared
    // stacked on top of themselves.
    for (const k of ['about.governanceTitle', 'about.statsTitle']) {
      expect(screen.getAllByText(translations.en[k])).toHaveLength(1);
    }
  });

  test('vision and mission read as the programme states them', () => {
    renderAbout();
    expect(screen.getByText(translations.en['about.visionBody'])).toBeInTheDocument();
    expect(screen.getByText(translations.en['about.missionBody'])).toBeInTheDocument();
  });

  test('carries the published impact figures, marked as published', () => {
    renderAbout();
    for (let i = 1; i <= 4; i += 1) {
      expect(screen.getByText(translations.en[`about.imp${i}Label`])).toBeInTheDocument();
    }
    expect(screen.getByText('5,000+')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();
    // One of these answers the same question as the live company count lower
    // down the page, so the block has to say which kind of number it is.
    expect(screen.getByText(translations.en['about.impactNote'])).toBeInTheDocument();
  });

  test('closes with an invitation into the services', () => {
    renderAbout();
    expect(screen.getByText(translations.en['about.ctaTitle'])).toBeInTheDocument();
    expect(screen.getByRole('link', { name: new RegExp(translations.en['about.ctaAction'], 'i') }))
      .toHaveAttribute('href', '/services');
  });

  test('renders in Arabic when the language is Arabic', () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderAbout();
    expect(screen.getByText(translations.ar['about.whatTitle'])).toBeInTheDocument();
    expect(screen.getByText(translations.ar['about.obj6Title'])).toBeInTheDocument();
    expect(document.documentElement.dir).toBe('rtl');
  });
});
