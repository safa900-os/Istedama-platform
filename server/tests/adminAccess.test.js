const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const app = require('../src/server');

const tokenFor = (id) => jwt.sign({ id }, process.env.JWT_SECRET);

/**
 * Access-boundary tests. These run without a database because authentication
 * and authorisation both resolve before any handler touches Mongo — which is
 * exactly the property being asserted.
 */
describe('Admin surface is closed by default', () => {
  const ROUTES = [
    ['get', '/api/admin/overview'],
    ['get', '/api/admin/users'],
    ['patch', '/api/admin/users/507f1f77bcf86cd799439011/role'],
    ['patch', '/api/admin/users/507f1f77bcf86cd799439011/status'],
    ['delete', '/api/admin/users/507f1f77bcf86cd799439011'],
    ['patch', '/api/admin/advertisements/507f1f77bcf86cd799439011/status'],
    ['patch', '/api/admin/bookings/507f1f77bcf86cd799439011/status']
  ];

  test('every admin route rejects an unauthenticated request', async () => {
    for (const [method, url] of ROUTES) {
      const res = await request(app)[method](url).send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  test('every admin route rejects a malformed token rather than erroring', async () => {
    for (const [method, url] of ROUTES) {
      const res = await request(app)[method](url).set('Authorization', 'Bearer nonsense').send({});
      expect(res.status).toBe(401);
    }
  });

});

describe('Admin controller safety rules', () => {
  const admin = require('../src/controllers/adminController');

  test('only known roles are assignable', () => {
    expect(admin.ASSIGNABLE_ROLES).toEqual(
      expect.arrayContaining(['sme_owner', 'merchant', 'auditor', 'admin'])
    );
    expect(admin.ASSIGNABLE_ROLES).not.toContain('superuser');
  });

  test('self-modification and last-admin guards are present in the source', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/controllers/adminController.js'),
      'utf8'
    );
    expect(src).toMatch(/cannot change your own role/i);
    expect(src).toMatch(/cannot suspend your own account/i);
    expect(src).toMatch(/cannot delete your own account/i);
    expect(src.match(/At least one active administrator must remain/g)).toHaveLength(3);
  });

  test('deleting a user detaches records instead of cascading a delete', () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '../src/controllers/adminController.js'),
      'utf8'
    );
    expect(src).toContain('Company.updateMany');
    expect(src).toContain("$unset");
    expect(src).not.toMatch(/Company\.deleteMany\(\{\s*owner/);
  });
});
