import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Vision2040 from '../components/Vision2040';
import VisitorStats from '../components/VisitorStats';
import CertifiedDirectoryCta from '../components/CertifiedDirectoryCta';
import ChairmanWord from '../components/ChairmanWord';
import ProgrammeBenefits from '../components/ProgrammeBenefits';
import CertificateSteps from '../components/CertificateSteps';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';
import {
  VISION_2040,
  CERTIFIED_DIRECTORY,
  CHAIRMAN,
  VISITOR_STATS,
  PROGRAMME_BENEFITS,
  CERTIFICATE_STEPS
} from '../data/programme';

/*
 * The shared setup stubs IntersectionObserver with one that never fires, so
 * anything gated on `whileInView` stays hidden and any count-up stays at its
 * starting value. These sections are entirely in-view content, so the stub is
 * replaced here with one that reports an immediate intersection — otherwise
 * the tests would assert against a permanently unrevealed component.
 */
class ImmediateObserver {
  constructor(cb) {
    this.cb = cb;
  }
  observe(el) {
    this.cb([{ isIntersecting: true, target: el, boundingClientRect: { top: 0 } }], this);
  }
  unobserve() {}
  disconnect() {}
}

let originalIO;
beforeAll(() => {
  originalIO = global.IntersectionObserver;
  global.IntersectionObserver = ImmediateObserver;
});
afterAll(() => {
  global.IntersectionObserver = originalIO;
});

/*
 * These assertions are written against the English strings and Western digits,
 * so the language has to be pinned. The provider reads the stored preference on
 * mount, and a value left behind by another suite would render the figures in
 * Arabic-Indic digits and fail the match for reasons unrelated to the code.
 */
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

const renderWith = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </BrowserRouter>
  );

describe('Oman Vision 2040 band', () => {
  test('does not restate counts the live impact band already reports', () => {
    renderWith(<Vision2040 />);
    // It used to print its own totals for companies and certifications —
    // static numbers that disagreed with the database-backed panel on the
    // same page. There is now one place the platform counts itself.
    expect(VISION_2040.impact).toBeUndefined();
    expect(screen.queryByText('26,959')).toBeNull();
  });

  test('carries the Vision mark rather than a drawn numeral', () => {
    renderWith(<Vision2040 />);
    const logo = screen.getByRole('img', { name: /oman vision 2040/i });
    expect(logo.tagName).toBe('IMG');
    expect(logo.getAttribute('src')).toMatch(/oman-vision-2040/);
  });

  test('each readiness meter exposes its value to assistive tech', () => {
    renderWith(<Vision2040 />);
    for (const m of VISION_2040.meters) {
      // The bar is graphical, so the percentage has to be readable as text
      // somewhere — here, on the track's own accessible name.
      expect(
        screen.getByRole('img', { name: new RegExp(`${m.label.en}.*${m.value}%`) })
      ).toBeInTheDocument();
    }
  });

  test('states plainly that the figures are published, not live', () => {
    renderWith(<Vision2040 />);
    expect(screen.getByText(/published programme targets, not live measurements/i)).toBeInTheDocument();
  });

  test('lists the pillars and the activation track', () => {
    renderWith(<Vision2040 />);
    for (const p of VISION_2040.pillars) {
      expect(screen.getByText(p.title.en)).toBeInTheDocument();
    }
    for (const s of VISION_2040.track) {
      expect(screen.getByText(s.label.en)).toBeInTheDocument();
    }
  });
});

describe('Site audience figures', () => {
  /*
   * Asserted through the reduced-motion path.
   *
   * CountUp otherwise eases toward its value across ~1.2s of animation frames,
   * and asserting on the settled result means racing a timer — which is what
   * makes such a test pass alone and fail under load. Under reduced motion the
   * component skips straight to the final value, so the figure can be checked
   * exactly. That path is also the one a real reduced-motion visitor sees.
   */
  test('shows each figure at its full value', () => {
    const realMatchMedia = window.matchMedia;
    window.matchMedia = (q) => ({
      matches: q.includes('prefers-reduced-motion'),
      media: q,
      addEventListener() {},
      removeEventListener() {}
    });
    try {
      renderWith(<VisitorStats />);
      expect(screen.getByText('15,000')).toBeInTheDocument();
      expect(screen.getByText('3.5')).toBeInTheDocument();
      expect(screen.getByText('42%')).toBeInTheDocument();
    } finally {
      window.matchMedia = realMatchMedia;
    }
  });

  test('labels every figure', () => {
    renderWith(<VisitorStats />);
    for (const s of VISITOR_STATS) {
      expect(screen.getAllByText(s.label.en).length).toBeGreaterThan(0);
    }
  });

  test('says on the page that the figures are not a live feed', () => {
    renderWith(<VisitorStats />);
    expect(screen.getByText(/not a live feed/i)).toBeInTheDocument();
  });
});

describe('The chairman’s message', () => {
  test('carries his portrait', () => {
    renderWith(<ChairmanWord />);
    const img = screen.getByAltText(
      new RegExp(CHAIRMAN.name.en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    );
    expect(img).toHaveAttribute('src', CHAIRMAN.portrait);
  });

  test('the portrait is described by who it is and what he does', () => {
    renderWith(<ChairmanWord />);
    // A portrait with an empty alt leaves the section unattributed for anyone
    // not seeing it, and the name alone does not say why he is speaking.
    const img = screen.getByAltText(new RegExp(CHAIRMAN.role.en, 'i'));
    expect(img.getAttribute('alt')).toContain(CHAIRMAN.name.en);
  });

  test('falls back to the mark if the portrait is ever missing', () => {
    const { container } = renderWith(<ChairmanWord />);
    const img = screen.getByAltText(new RegExp(CHAIRMAN.role.en, 'i'));
    img.dispatchEvent(new Event('error'));
    return waitFor(() =>
      expect(container.querySelector('img[src="/promo/lockup.png"]')).not.toBeNull()
    );
  });

  test('names him and his role in Arabic when the language is Arabic', () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderWith(<ChairmanWord />);
    expect(screen.getByText(CHAIRMAN.name.ar)).toBeInTheDocument();
    expect(screen.getByText(CHAIRMAN.role.ar)).toBeInTheDocument();
  });
});

describe('Certified directory call to action', () => {
  test('links to the directory', () => {
    renderWith(<CertifiedDirectoryCta />);
    const link = screen.getByRole('link', { name: /open the directory/i });
    expect(link).toHaveAttribute('href', '/companies');
  });

  test('shows the photograph, described by what is in it', () => {
    renderWith(<CertifiedDirectoryCta />);
    // Matched through the copy rather than a phrase typed out here: the alt
    // used to say "committee meeting", which stopped describing the picture
    // the moment a different one was supplied.
    const img = screen.getByAltText(translations.en['certified.photoAlt']);
    expect(img).toHaveAttribute('src', CERTIFIED_DIRECTORY.photo);
  });

  test('falls back to a drawn panel if the photograph is ever missing', () => {
    renderWith(<CertifiedDirectoryCta />);
    // The file ships with the site, but a deployment without it should show a
    // stand-in rather than a broken image.
    const img = screen.getByAltText(translations.en['certified.photoAlt']);
    img.dispatchEvent(new Event('error'));
    return waitFor(() =>
      expect(screen.getByText(translations.en['certified.photoPending'])).toBeInTheDocument()
    );
  });
});

describe('Benefits and certificate steps', () => {
  test('all four benefits render, and none of them is numbered', () => {
    const { container } = renderWith(<ProgrammeBenefits />);
    for (const b of PROGRAMME_BENEFITS) {
      expect(screen.getByText(b.title.en)).toBeInTheDocument();
    }
    // These are four things a member gains, not four stages to work through,
    // so an ordinal on the card would state an order that does not exist.
    expect(screen.queryAllByText(/^0[1-9]$/)).toHaveLength(0);
    expect(container.querySelectorAll('ul > li')).toHaveLength(PROGRAMME_BENEFITS.length);
  });

  test('all six certificate steps render in order, without printed numbers', () => {
    const { container } = renderWith(<CertificateSteps />);
    const items = container.querySelectorAll('ol li');
    expect(items).toHaveLength(CERTIFICATE_STEPS.length);
    CERTIFICATE_STEPS.forEach((s, i) => {
      expect(within(items[i]).getByText(s.label.en)).toBeInTheDocument();
    });
    // The order lives in the list element itself — an `<ol>`, which assistive
    // technology already announces positionally — so the badges are gone.
    expect(screen.queryAllByText(/^0[1-9]$/)).toHaveLength(0);
    expect(container.querySelector('ol')).not.toBeNull();
  });
});
