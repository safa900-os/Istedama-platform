import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import { translations } from '../i18n/translations';

function renderNavbar() {
  return render(
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <Navbar />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

describe('Navbar navigation', () => {
  test('renders the top-level navigation links', () => {
    renderNavbar();
    expect(screen.getAllByRole('link', { name: /^home$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^about$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^tenders$/i }).length).toBeGreaterThan(0);
    // The dashboard is staff-only, so it must NOT appear for a signed-out visitor
    expect(screen.queryByRole('link', { name: /^dashboard$/i })).not.toBeInTheDocument();
  });

  test('secondary destinations live behind the services menu', () => {
    renderNavbar();
    const trigger = screen.getByRole('button', { name: /^services$/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('link', { name: /^directory$/i }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: /^facilities$/i }).length).toBeGreaterThan(0);
  });

});
