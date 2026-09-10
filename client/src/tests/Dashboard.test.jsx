import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import { AuthProvider } from '../context/AuthContext';
import { LanguageProvider } from '../context/LanguageContext';
import api from '../api/axios';

vi.mock('../api/axios');

describe('Dashboard component rendering', () => {
  beforeEach(() => {
    api.get.mockImplementation((url) => {
      if (url.includes('stats/overview')) {
        return Promise.resolve({ data: { data: { totalCompanies: 5, avgOmanizationRate: 62.4, byGovernorate: [] } } });
      }
      if (url.includes('evaluations')) {
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: null } });
    });
  });

  test('renders headline stats once data resolves', async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <AuthProvider>
            <Dashboard />
          </AuthProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    expect(await screen.findByText('5')).toBeInTheDocument();
    expect(screen.getByText('62.4%')).toBeInTheDocument();
    expect(screen.getByText(/registered smes/i)).toBeInTheDocument();
  });
});
