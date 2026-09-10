const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
const app = require('../src/server');

const { mayRevealCode, smtpConfigured } = require('../src/utils/notify');

describe('Application routes require a session', () => {
  const ROUTES = [
    ['get', '/api/applications'],
    ['get', '/api/applications/stats'],
    ['get', '/api/applications/507f1f77bcf86cd799439011'],
    ['post', '/api/applications'],
    ['patch', '/api/applications/507f1f77bcf86cd799439011/status']
  ];

  test('all are refused without a token', async () => {
    for (const [method, url] of ROUTES) {
      const res = await request(app)[method](url).send({});
      expect(res.status).toBe(401);
    }
  });

  test('all are refused with a malformed token', async () => {
    for (const [method, url] of ROUTES) {
      const res = await request(app)[method](url).set('Authorization', 'Bearer junk').send({});
      expect(res.status).toBe(401);
    }
  });
});

describe('Verification endpoints validate input before touching the database', () => {
  test('send-code rejects a malformed email', async () => {
    const res = await request(app).post('/api/auth/send-code').send({ email: 'nope' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('verify-code rejects a code that is not six digits', async () => {
    for (const code of ['123', '1234567', 'abcdef', '']) {
      const res = await request(app)
        .post('/api/auth/verify-code')
        .send({ email: 'user@example.com', code });
      expect(res.status).toBe(400);
    }
  });
});

describe('Notification adapter is honest about delivery', () => {
  test('reports SMTP as unconfigured rather than claiming a send', () => {
    expect(smtpConfigured()).toBe(false);
  });

  test('a code may be revealed only outside production and only when undelivered', () => {
    const prev = process.env.NODE_ENV;

    process.env.NODE_ENV = 'development';
    expect(mayRevealCode({ delivered: false })).toBe(true);
    expect(mayRevealCode({ delivered: true })).toBe(false);

    process.env.NODE_ENV = 'production';
    expect(mayRevealCode({ delivered: false })).toBe(false);
    expect(mayRevealCode({ delivered: true })).toBe(false);

    process.env.NODE_ENV = prev;
  });
});
