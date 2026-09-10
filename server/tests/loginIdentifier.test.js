const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');

/**
 * Signing in with an email address or a phone number.
 *
 * The form offers one field for both, so these cover the cases where that
 * flexibility could otherwise become a way in: a blank identifier, a number
 * shared by two accounts, and a wrong password against a real account.
 */

let mongo;
const PASSWORD = 'secret123';

const makeUser = (over = {}) =>
  User.create({
    name: 'Test User',
    email: `u${Math.random().toString(36).slice(2)}@example.com`,
    password: PASSWORD,
    ...over
  });

const signIn = (body) => request(app).post('/api/auth/login').send(body);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 180000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

afterEach(async () => {
  await User.deleteMany({});
});

describe('Signing in by email', () => {
  test('succeeds and returns a token', async () => {
    const user = await makeUser();
    const res = await signIn({ identifier: user.email, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.data.email).toBe(user.email);
    // The hash must never travel back to the client.
    expect(res.body.data.password).toBeUndefined();
  });

  test('is case-insensitive on the address', async () => {
    const user = await makeUser();
    const res = await signIn({ identifier: user.email.toUpperCase(), password: PASSWORD });
    expect(res.status).toBe(200);
  });

  test('still accepts the older `email` field', async () => {
    const user = await makeUser();
    const res = await signIn({ email: user.email, password: PASSWORD });
    expect(res.status).toBe(200);
  });

  test('a wrong password is refused', async () => {
    const user = await makeUser();
    const res = await signIn({ identifier: user.email, password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});

describe('Signing in by phone', () => {
  test('succeeds for a unique number', async () => {
    await makeUser({ phone: '91234567' });
    const res = await signIn({ identifier: '91234567', password: PASSWORD });
    expect(res.status).toBe(200);
  });

  test('ignores formatting and country code', async () => {
    await makeUser({ phone: '91234567' });
    for (const form of ['+968 9123 4567', '9123-4567', ' 91234567 ']) {
      const res = await signIn({ identifier: form, password: PASSWORD });
      expect(res.status).toBe(200);
    }
  });
});

describe('Cases where a shared field could let the wrong person in', () => {
  test('a blank identifier never matches, even though most accounts store an empty phone', async () => {
    await makeUser();
    await makeUser();
    for (const identifier of ['', '   ']) {
      const res = await signIn({ identifier, password: PASSWORD });
      expect(res.status).toBe(400);
    }
  });

  test('a number shared by two accounts signs in as neither', async () => {
    // `phone` is not unique in the schema, so this is reachable. Picking one
    // arbitrarily would mean the password of either account opened the other.
    await makeUser({ phone: '91234567' });
    await makeUser({ phone: '91234567' });

    const res = await signIn({ identifier: '91234567', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  test('an unknown identifier and a wrong password are indistinguishable', async () => {
    const user = await makeUser();
    const unknown = await signIn({ identifier: 'nobody@example.com', password: PASSWORD });
    const wrongPw = await signIn({ identifier: user.email, password: 'wrongpassword' });

    expect(unknown.status).toBe(wrongPw.status);
    expect(unknown.body.message).toBe(wrongPw.body.message);
  });

  test('a suspended account cannot sign in', async () => {
    const user = await makeUser({ active: false });
    const res = await signIn({ identifier: user.email, password: PASSWORD });
    expect(res.status).toBe(403);
  });

  test('a malformed identifier is rejected before any lookup', async () => {
    const res = await signIn({ identifier: 'not-an-email', password: PASSWORD });
    expect(res.status).toBe(400);
  });

  test('a missing password is rejected', async () => {
    const user = await makeUser();
    const res = await signIn({ identifier: user.email });
    expect(res.status).toBe(400);
  });
});
