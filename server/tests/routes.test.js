const request = require('supertest');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const app = require('../src/server');

/**
 * Verifies app wiring, auth guards and error shaping.
 * These paths all resolve before any database call, so the suite runs
 * without a live MongoDB instance.
 */
describe('API wiring and guards', () => {
  test('health endpoint responds', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('unknown routes return a structured 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('all write routes reject requests without a JWT', async () => {
    const cases = [
      ['post', '/api/companies'],
      ['put', '/api/companies/507f1f77bcf86cd799439011'],
      ['delete', '/api/companies/507f1f77bcf86cd799439011'],
      ['post', '/api/evaluations'],
      ['delete', '/api/evaluations/507f1f77bcf86cd799439011']
    ];
    for (const [method, url] of cases) {
      const res = await request(app)[method](url).send({});
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    }
  });

  test('a malformed token is rejected rather than throwing a 500', async () => {
    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', 'Bearer not-a-real-token')
      .send({});
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });
});
