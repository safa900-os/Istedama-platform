import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';

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

describe('Arabic localisation and RTL', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.dir = 'ltr';
  });

  test('switching to Arabic translates the navigation labels', () => {
    renderNavbar();
    expect(screen.getByRole('link', { name: /^home$/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: /switch language|تغيير اللغة/i })[0]);

    expect(screen.getAllByRole('link', { name: 'الرئيسية' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'عن استدامة' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: /^home$/i })).not.toBeInTheDocument();
  });

  test('switching to Arabic sets the document direction to RTL', () => {
    renderNavbar();
    expect(document.documentElement.dir).toBe('ltr');

    fireEvent.click(screen.getAllByRole('button', { name: /switch language|تغيير اللغة/i })[0]);

    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  test('the chosen language persists across reloads', () => {
    const { unmount } = renderNavbar();
    fireEvent.click(screen.getAllByRole('button', { name: /switch language|تغيير اللغة/i })[0]);
    expect(localStorage.getItem('istidamah_lang')).toBe('ar');

    unmount();
    renderNavbar();
    expect(screen.getAllByRole('link', { name: 'الرئيسية' }).length).toBeGreaterThan(0);
  });
});
