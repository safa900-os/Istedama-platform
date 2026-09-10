import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import PartnerStrip from '../components/PartnerStrip';
import { LanguageProvider } from '../context/LanguageContext';
import { STRATEGIC_PARTNERS } from '../data/partners';
import { translations } from '../i18n/translations';

const renderStrip = () =>
  render(
    <BrowserRouter>
      <LanguageProvider>
        <PartnerStrip />
      </LanguageProvider>
    </BrowserRouter>
  );

/** The one announced copy of the roster; the rest are decoration for the loop. */
const markFor = (partner, lang = 'en') =>
  screen.getByRole('button', { name: new RegExp(partner.name[lang], 'i') });

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

describe('Strategic partner strip', () => {
  test('carries every strategic partner as its own mark', () => {
    renderStrip();
    for (const p of STRATEGIC_PARTNERS) {
      expect(markFor(p)).toBeInTheDocument();
    }
  });

  test('a mark names its partner in full without being pointed at', () => {
    renderStrip();
    const sohar = STRATEGIC_PARTNERS.find((p) => p.id === 'sohar');
    // The details are visual-on-demand, but they must not be *only* visual —
    // a screen reader gets all three from the accessible name.
    const mark = markFor(sohar);
    expect(mark).toHaveAccessibleName(new RegExp(sohar.name.en, 'i'));
    expect(mark).toHaveAccessibleName(new RegExp(sohar.kind.en, 'i'));
    expect(mark).toHaveAccessibleName(new RegExp(sohar.city.en, 'i'));
  });

  test('shows only the logos at rest, with a hint instead of details', () => {
    renderStrip();
    for (const p of STRATEGIC_PARTNERS) {
      expect(screen.queryByText(p.name.en)).toBeNull();
    }
    expect(screen.getByText(translations.en['partnerMap.hint'])).toBeInTheDocument();
  });

  test('pointing at a mark opens that partner’s details', async () => {
    renderStrip();
    const labour = STRATEGIC_PARTNERS.find((p) => p.id === 'labour');
    const mark = markFor(labour);

    fireEvent.mouseEnter(mark);
    await waitFor(() => expect(screen.getByText(labour.name.en)).toBeInTheDocument());
    expect(screen.getByText(labour.city.en)).toBeInTheDocument();
    expect(mark).toHaveAttribute('aria-pressed', 'true');

    fireEvent.mouseLeave(mark);
    await waitFor(() => expect(screen.queryByText(labour.name.en)).toBeNull());
  });

  test('keyboard focus opens them too, so it is not pointer-only', async () => {
    renderStrip();
    const mociip = STRATEGIC_PARTNERS.find((p) => p.id === 'mociip');

    fireEvent.focus(markFor(mociip));
    await waitFor(() => expect(screen.getByText(mociip.name.en)).toBeInTheDocument());
  });

  test('a tap opens them and a second tap closes them, for screens with no hover', async () => {
    renderStrip();
    const spf = STRATEGIC_PARTNERS.find((p) => p.id === 'spf');
    const mark = markFor(spf);

    fireEvent.click(mark);
    await waitFor(() => expect(screen.getByText(spf.name.en)).toBeInTheDocument());

    fireEvent.click(mark);
    await waitFor(() => expect(screen.queryByText(spf.name.en)).toBeNull());
  });

  test('the lead partner is labelled as such rather than by its role line', async () => {
    renderStrip();
    const lead = STRATEGIC_PARTNERS.find((p) => p.primary);

    fireEvent.mouseEnter(markFor(lead));
    await waitFor(() =>
      expect(screen.getByText(translations.en['partnerMap.lead2'])).toBeInTheDocument()
    );
  });

  test('lays the roster end to end often enough that the loop never gaps', () => {
    const { container } = renderStrip();
    const copies = container.querySelectorAll('.pstrip-track > ul');

    // The loop jumps back by one copy, so the copies left behind it have to
    // still fill the strip. Anything less and a blank swings through once a
    // pass.
    expect(copies.length).toBeGreaterThanOrEqual(3);
    for (const copy of copies) {
      expect(copy.querySelectorAll('li')).toHaveLength(STRATEGIC_PARTNERS.length);
    }

    const shift = container
      .querySelector('.pstrip-viewport')
      .style.getPropertyValue('--pstrip-shift');
    // The jump has to be exactly one copy's share of the track.
    expect(shift).toBe(`-${100 / copies.length}%`);
  });

  test('only the first copy is announced', () => {
    const { container } = renderStrip();
    const [first, ...rest] = container.querySelectorAll('.pstrip-track > ul');

    expect(first).not.toHaveAttribute('aria-hidden');
    for (const copy of rest) expect(copy).toHaveAttribute('aria-hidden', 'true');

    // And so each partner resolves to exactly one control, not four.
    for (const p of STRATEGIC_PARTNERS) {
      expect(screen.getAllByRole('button', { name: new RegExp(p.name.en, 'i') })).toHaveLength(1);
    }
  });

  test('the travel direction follows the reading direction', () => {
    const { container, unmount } = renderStrip();
    const shiftOf = (c) =>
      c.querySelector('.pstrip-viewport').style.getPropertyValue('--pstrip-shift');

    // A flex row starts at the left in English, so the strip travels left.
    expect(shiftOf(container).startsWith('-')).toBe(true);
    unmount();

    localStorage.setItem('istidamah_lang', 'ar');
    const { container: rtl } = renderStrip();
    // In Arabic it starts at the right, so it has to travel the other way to
    // keep bringing marks in from off-screen rather than pushing them off.
    expect(shiftOf(rtl).startsWith('-')).toBe(false);
  });

  test('the pass takes as long per partner however many there are', () => {
    const { container } = renderStrip();
    const duration = container
      .querySelector('.pstrip-viewport')
      .style.getPropertyValue('--pstrip-duration');
    // Speed, not total time, is what the reader experiences — so the duration
    // is derived from the partner count rather than fixed.
    expect(duration).toBe(`${STRATEGIC_PARTNERS.length * 4}s`);
  });

  test('offers a way to the full partner page', () => {
    renderStrip();
    expect(screen.getByRole('link', { name: /meet the partners/i })).toHaveAttribute(
      'href',
      '/partners'
    );
  });

  test('names the partners in Arabic when the language is Arabic', async () => {
    localStorage.setItem('istidamah_lang', 'ar');
    renderStrip();

    for (const p of STRATEGIC_PARTNERS) {
      expect(markFor(p, 'ar')).toBeInTheDocument();
    }

    const lead = STRATEGIC_PARTNERS.find((p) => p.primary);
    fireEvent.mouseEnter(markFor(lead, 'ar'));
    await waitFor(() => expect(screen.getByText(lead.name.ar)).toBeInTheDocument());
  });
});
