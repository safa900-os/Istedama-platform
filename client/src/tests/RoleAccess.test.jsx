import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../components/ProtectedRoute';
import { AuthProvider } from '../context/AuthContext';
import api from '../api/axios';

vi.mock('../api/axios', () => ({ default: { get: vi.fn(), post: vi.fn() } }));

function renderAs(role) {
  localStorage.setItem('istidamah_token', 'fake');
  api.get.mockResolvedValue({ data: { data: role ? { _id: '1', name: 'X', email: 'x@y.z', role } : null } });

  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>public home</p>} />
          <Route path="/login" element={<p>login page</p>} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['admin', 'auditor']}>
                <p>staff dashboard</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('Dashboard access by role', () => {
  beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });

  test('an admin reaches the dashboard', async () => {
    renderAs('admin');
    expect(await screen.findByText('staff dashboard')).toBeInTheDocument();
  });

  test('an auditor reaches the dashboard', async () => {
    renderAs('auditor');
    expect(await screen.findByText('staff dashboard')).toBeInTheDocument();
  });

  test('an SME owner is redirected away, even typing the URL directly', async () => {
    renderAs('sme_owner');
    expect(await screen.findByText('public home')).toBeInTheDocument();
    expect(screen.queryByText('staff dashboard')).not.toBeInTheDocument();
  });

  test('a signed-out visitor is sent to login', async () => {
    localStorage.clear();
    api.get.mockRejectedValue(new Error('no session'));
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<p>login page</p>} />
            <Route
              path="/dashboard"
              element={<ProtectedRoute roles={['admin']}><p>staff dashboard</p></ProtectedRoute>}
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText('login page')).toBeInTheDocument();
  });
});
