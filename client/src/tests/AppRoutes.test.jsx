import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { AuthProvider } from '../context/AuthContext';
import { translations } from '../i18n/translations';

vi.mock('../api/axios', () => ({
  default: { get: () => Promise.resolve({ data: { data: null } }), post: () => Promise.resolve({ data: {} }) }
}));

vi.mock('../components/LocationPicker', () => ({ default: () => <div /> }));

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div>{children}</div>,
  Popup: ({ children }) => <div>{children}</div>
}));

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <LanguageProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </AccessibilityProvider>
      </LanguageProvider>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem('istidamah_lang', 'en');
});

/**
 * A smoke test over the route table itself.
 *
 * Nothing rendered `App` before, so a malformed route block compiled in the
 * unit tests and only fell over at build time — which is exactly what happened
 * while `/register-company` was being removed from it.
 */
describe('Route table', () => {
  test('the shell renders', async () => {
    renderAt('/about');
    await waitFor(() => expect(screen.getByRole('banner')).toBeInTheDocument());
  });

  test('/register still serves the registration wizard', async () => {
    renderAt('/register');
    await waitFor(() =>
      expect(screen.getAllByText(translations.en['rw.s.documents']).length).toBeGreaterThan(0)
    );
  });

  test('/register-company is gone and falls through to not-found', async () => {
    // It was a second registration page duplicating the wizard above.
    renderAt('/register-company');
    await waitFor(() =>
      expect(screen.getByText(translations.en['notfound.title'])).toBeInTheDocument()
    );
  });
});
