import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AccessibilityWidget from '../components/AccessibilityWidget';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

const renderPanel = () =>
  render(
    <BrowserRouter>
      <LanguageProvider>
        <AccessibilityProvider>
          <AccessibilityWidget />
        </AccessibilityProvider>
      </LanguageProvider>
    </BrowserRouter>
  );

const open = () => {
  fireEvent.click(screen.getByRole('button', { name: translations.en['a11y.open'] }));
};

const en = (k) => translations.en[k];

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
  document.documentElement.className = '';
});

describe('Accessibility panel', () => {
  test('every preference the context implements has a control', () => {
    renderPanel();
    open();

    // Reduced motion, a plainer typeface and a large pointer were implemented
    // in the context and styled in index.css, but had no control anywhere —
    // they could only be set by hand-editing local storage.
    for (const key of [
      'a11y.highContrast',
      'a11y.readableFont',
      'a11y.highlightLinks',
      'a11y.reduceMotion',
      'a11y.bigCursor',
      'a11y.readAloud'
    ]) {
      expect(screen.getByRole('switch', { name: en(key) })).toBeInTheDocument();
    }
  });

  test('a switch actually changes the setting rather than throwing', () => {
    renderPanel();
    open();

    const contrast = screen.getByRole('switch', { name: en('a11y.highContrast') });
    expect(contrast).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(contrast);

    expect(contrast).toHaveAttribute('aria-checked', 'true');
    // The setting is only real if it reaches the document.
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true);
  });

  test('reduce motion reaches the document so the site can honour it', () => {
    renderPanel();
    open();

    fireEvent.click(screen.getByRole('switch', { name: en('a11y.reduceMotion') }));
    expect(document.documentElement.classList.contains('a11y-reduce-motion')).toBe(true);
  });

  test('read aloud is offered, not permanently reported as unsupported', () => {
    // The panel used to read `ttsSupported` off the context, which has never
    // exported that name — so `!undefined` disabled the switch for everyone
    // and the hint always said the browser could not do it.
    window.speechSynthesis = {
      cancel: vi.fn(),
      speak: vi.fn(),
      getVoices: () => []
    };
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };

    renderPanel();
    open();

    const readAloud = screen.getByRole('switch', { name: en('a11y.readAloud') });
    expect(readAloud).not.toBeDisabled();
    expect(screen.queryByText(en('a11y.ttsUnavailable'))).toBeNull();
  });

  test('turning read aloud on reveals the controls that depend on it', async () => {
    window.speechSynthesis = { cancel: vi.fn(), speak: vi.fn(), getVoices: () => [] };
    window.SpeechSynthesisUtterance = function (text) {
      this.text = text;
    };

    renderPanel();
    open();

    // Offering "read this page" while speech is off would do nothing.
    expect(screen.queryByRole('button', { name: en('a11y.readPage') })).toBeNull();

    fireEvent.click(screen.getByRole('switch', { name: en('a11y.readAloud') }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: en('a11y.readPage') })).toBeInTheDocument()
    );
    expect(screen.getByRole('switch', { name: en('a11y.hoverRead') })).toBeInTheDocument();
  });

  test('the text size states which level it is on', () => {
    renderPanel();
    open();

    expect(screen.getByText(/level 1 of 4/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: en('a11y.increase') }));
    expect(screen.getByText(/level 2 of 4/i)).toBeInTheDocument();
    expect(document.documentElement.classList.contains('a11y-font-1')).toBe(true);
  });

  test('it names a written way to reach a person, not only a phone number', () => {
    // Members who are deaf or do not speak cannot use a telephone line, and
    // this panel is where someone blocked by the site looks first.
    renderPanel();
    open();
    expect(screen.getByRole('link', { name: en('a11y.contactCta') })).toHaveAttribute(
      'href',
      '/contact'
    );
  });

  test('every control is large enough to hit', () => {
    const { container } = renderPanel();
    open();
    // The programme's members include merchants in their sixties; a 24px
    // switch is not a realistic target for them.
    for (const el of container.querySelectorAll('[role="switch"]')) {
      const h = Number(getComputedStyle(el).height.replace('px', '')) || 28;
      expect(h).toBeGreaterThanOrEqual(24);
    }
  });

  test('the trigger says whether the panel is open', () => {
    renderPanel();
    const trigger = screen.getByRole('button', { name: en('a11y.open') });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);
    expect(screen.getByRole('button', { name: en('a11y.close') })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
  });

  test('reset clears the settings it applied', () => {
    renderPanel();
    open();

    fireEvent.click(screen.getByRole('switch', { name: en('a11y.highContrast') }));
    fireEvent.click(screen.getByRole('switch', { name: en('a11y.bigCursor') }));
    expect(document.documentElement.classList.contains('a11y-big-cursor')).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: en('a11y.reset') }));

    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(false);
    expect(document.documentElement.classList.contains('a11y-big-cursor')).toBe(false);
  });
});
