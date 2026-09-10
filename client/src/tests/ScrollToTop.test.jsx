import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import ScrollToTop from '../components/ScrollToTop';

/** A page that exposes the router's navigate so a test can drive it. */
let go;
function Page({ name }) {
  go = useNavigate();
  return <div>{name}</div>;
}

const renderApp = (initial = ['/']) =>
  render(
    <MemoryRouter initialEntries={initial}>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Page name="home" />} />
        <Route path="/about" element={<Page name="about" />} />
        <Route path="/services" element={<Page name="services" />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  window.scrollTo = vi.fn();
});

describe('ScrollToTop', () => {
  test('sends a new page to its top', () => {
    renderApp();
    window.scrollTo.mockClear();

    act(() => go('/about'));

    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 0, left: 0 })
    );
  });

  test('does not animate the jump', () => {
    renderApp();
    window.scrollTo.mockClear();

    act(() => go('/about'));

    // The site sets `scroll-behavior: smooth` globally, which would otherwise
    // drag the outgoing page past the reader on every navigation.
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'instant' })
    );
  });

  test('leaves a hash link alone, since it names a place on the page', () => {
    renderApp();
    window.scrollTo.mockClear();

    act(() => go('/about#objectives'));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });

  test('going back restores the position rather than jumping to the top', () => {
    renderApp();
    act(() => go('/about'));
    act(() => go('/services'));
    window.scrollTo.mockClear();

    // Returning to where you were is the whole point of the back button.
    act(() => go(-1));

    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
