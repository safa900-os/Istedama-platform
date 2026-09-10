import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import GccChambers from '../components/GccChambers';
import { LanguageProvider } from '../context/LanguageContext';
import { GCC_CHAMBERS } from '../data/programme';

const renderWith = (ui) =>
  render(
    <BrowserRouter>
      <LanguageProvider>{ui}</LanguageProvider>
    </BrowserRouter>
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

describe('GCC chambers read as a map, not a second card list', () => {
  test('every chamber is a link on the map, named for assistive tech', () => {
    renderWith(<GccChambers />);
    for (const c of GCC_CHAMBERS) {
      const link = screen.getByRole('link', { name: new RegExp(c.chamber.en, 'i') });
      expect(link).toHaveAttribute('href', c.url);
      // Opening someone else's site in a new tab needs the opener severed.
      expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
    }
  });

  test('no name is painted on the map until a marker is pointed at', () => {
    renderWith(<GccChambers />);
    // Six permanent pills would overlap around the Gulf, where four capitals
    // sit close together — which is why only the pointed-at one is drawn.
    for (const c of GCC_CHAMBERS) {
      expect(screen.queryByText(c.chamber.en)).not.toBeInTheDocument();
    }
  });

  test('pointing at a marker paints that chamber onto the map', async () => {
    renderWith(<GccChambers />);
    const oman = GCC_CHAMBERS.find((c) => c.id === 'oman');
    const link = screen.getByRole('link', { name: new RegExp(oman.chamber.en, 'i') });

    fireEvent.mouseOver(link);
    await waitFor(() => expect(within(link).getByText(oman.chamber.en)).toBeInTheDocument());

    fireEvent.mouseOut(link);
    await waitFor(() => expect(screen.queryByText(oman.chamber.en)).not.toBeInTheDocument());
  });

  test('keyboard focus shows the name too, so it is not hover-only', async () => {
    renderWith(<GccChambers />);
    const qatar = GCC_CHAMBERS.find((c) => c.id === 'qatar');
    const link = screen.getByRole('link', { name: new RegExp(qatar.chamber.en, 'i') });

    // A name available only on hover is unreachable by keyboard and by touch.
    fireEvent.focus(link);
    await waitFor(() => expect(within(link).getByText(qatar.chamber.en)).toBeInTheDocument());
  });

  test('stays map-only, with no card list growing back beside it', () => {
    const { container } = renderWith(<GccChambers />);

    // This section and the partner section above it were both a map paired
    // with a list of buttons, which made the page read as one component shown
    // twice. Partners are a moving strip now and this is the page's only map;
    // the guard is that it does not sprout a list again.
    expect(container.querySelectorAll('ul button')).toHaveLength(0);

    // Every chamber lives on the drawing itself.
    const pins = container.querySelectorAll('ul li a');
    expect(pins).toHaveLength(GCC_CHAMBERS.length);
  });
});
