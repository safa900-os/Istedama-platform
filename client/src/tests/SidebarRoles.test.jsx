import { describe, test, expect } from 'vitest';
import { menuForRole } from '../components/DashboardSidebar';

/**
 * The sidebar must differ by role. Testing the menu table directly keeps this
 * fast and independent of rendering, while still guarding the actual rule.
 */
describe('Role-based dashboard menus', () => {
  const ids = (role) => menuForRole(role).map((i) => i.id);

  test('each role gets a distinct menu', () => {
    const admin = ids('admin').join();
    const auditor = ids('auditor').join();
    const owner = ids('sme_owner').join();
    const merchant = ids('merchant').join();

    const all = [admin, auditor, owner, merchant];
    expect(new Set(all).size).toBe(4);
  });

  test('only the administrator can manage users and content', () => {
    expect(ids('admin')).toEqual(expect.arrayContaining(['users', 'content']));
    for (const role of ['auditor', 'sme_owner', 'merchant']) {
      expect(ids(role)).not.toContain('users');
      expect(ids(role)).not.toContain('content');
    }
  });

  test('an SME owner and merchant see only their own enterprise, never the full list', () => {
    for (const role of ['sme_owner', 'merchant']) {
      expect(ids(role)).toContain('company');
      expect(ids(role)).not.toContain('enterprises');
    }
  });

  test('the auditor gets an evaluation queue that self-service roles do not', () => {
    expect(ids('auditor')).toContain('queue');
    expect(ids('sme_owner')).not.toContain('queue');
    expect(ids('merchant')).not.toContain('queue');
  });

  test('merchants get advert and tender items an SME owner does not', () => {
    expect(ids('merchant')).toEqual(expect.arrayContaining(['adverts', 'myTenders']));
    expect(ids('sme_owner')).not.toContain('adverts');
  });

  test('an unknown role falls back to the most limited menu', () => {
    expect(ids(undefined)).toEqual(ids('sme_owner'));
    expect(ids('not_a_role')).toEqual(ids('sme_owner'));
  });

  test('every menu starts with an overview so no role lands on a blank panel', () => {
    for (const role of ['admin', 'auditor', 'sme_owner', 'merchant']) {
      expect(ids(role)[0]).toBe('overview');
    }
  });
});
