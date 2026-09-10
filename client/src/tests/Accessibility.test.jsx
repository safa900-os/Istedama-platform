import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AccessibilityProvider, useAccessibility } from '../context/AccessibilityContext';

// jsdom has no SpeechSynthesis; stub just enough to assert our wiring.
const spoken = [];
beforeEach(() => {
  spoken.length = 0;
  localStorage.clear();
  document.documentElement.className = '';
  window.speechSynthesis = {
    cancel: vi.fn(),
    speak: vi.fn((u) => spoken.push(u)),
    getVoices: () => []
  };
  window.SpeechSynthesisUtterance = function (text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
  };
});

function Probe() {
  const a = useAccessibility();
  return (
    <div>
      <button onClick={() => a.setHighContrast(true)}>contrast</button>
      <button onClick={() => a.setSpeechEnabled(true)}>enable-speech</button>
      <button onClick={() => a.speak('Hello there')}>say</button>
      <button onClick={a.increaseFont}>bigger</button>
      <button onClick={a.reset}>reset</button>
      <span data-testid="supported">{String(a.speechSupported)}</span>
    </div>
  );
}

const renderProbe = () => render(<AccessibilityProvider><Probe /></AccessibilityProvider>);

describe('Accessibility layer', () => {
  test('context exposes a single working speech API', () => {
    renderProbe();
    expect(screen.getByTestId('supported')).toHaveTextContent('true');
    fireEvent.click(screen.getByText('say'));
    expect(spoken).toHaveLength(1);
    expect(spoken[0].text).toBe('Hello there');
  });

  test('high contrast and font size apply classes to the document root', () => {
    renderProbe();
    fireEvent.click(screen.getByText('contrast'));
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(true);

    fireEvent.click(screen.getByText('bigger'));
    expect(document.documentElement.classList.contains('a11y-font-1')).toBe(true);
  });

  test('preferences persist and reset clears them', () => {
    renderProbe();
    fireEvent.click(screen.getByText('contrast'));
    expect(JSON.parse(localStorage.getItem('istidamah_a11y')).highContrast).toBe(true);

    act(() => { fireEvent.click(screen.getByText('reset')); });
    expect(document.documentElement.classList.contains('a11y-high-contrast')).toBe(false);
  });

  test('disabling speech cancels anything mid-sentence', () => {
    renderProbe();
    fireEvent.click(screen.getByText('enable-speech'));
    fireEvent.click(screen.getByText('say'));
    act(() => { fireEvent.click(screen.getByText('reset')); });
    expect(window.speechSynthesis.cancel).toHaveBeenCalled();
  });
});
