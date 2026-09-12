const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const { CATEGORY_KEYS, MAX_CATEGORIES, normaliseCategories } = require('../src/config/categories');

let mongo;
let token;

const IBAN_A = 'OM810180000001299123456';
const IBAN_B = 'OM220280000009988776655';
const IBAN_C = 'OM330380000004455667788';

/** The fields every company needs, whatever else the test is about. */
const base = (overrides = {}) => ({
  companyName: 'Al Nahda Trading',
  crNumber: '1234567',
  governorate: 'Muscat',
  employeeCount: 12,
  omaniEmployeeCount: 8,
  location: { lat: 23.58, lng: 58.38 },
  ...overrides
});

const account = (iban, overrides = {}) => ({
  bankName: 'Bank Muscat',
  accountHolder: 'Al Nahda Trading LLC',
  accountNumber: '0299123456',
  iban,
  ...overrides
});

const post = (body) =>
  request(app).post('/api/companies').set('Authorization', `Bearer ${token}`).send(body);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Company.deleteMany(), User.deleteMany()]);
  const res = await request(app).post('/api/auth/register').send({
    name: 'Khalid Al Amri',
    email: 'merchant@example.om',
    password: 'Str0ngPass!23',
    role: 'merchant'
  });
  token = res.body.token;
});

/**
 * A merchant is paid, and is found by what they sell. Both have a rule that
 * cannot bend: exactly one account is the one we pay, and a category is only
 * useful if it is the same string every other record uses.
 */
describe('A merchant’s bank accounts', () => {
  test('more than one account can be held, and exactly one is primary', async () => {
    const res = await post(
      base({
        bankAccounts: [account(IBAN_A), account(IBAN_B, { bankName: 'Sohar International' })]
      })
    );

    expect(res.status).toBe(201);
    const accounts = res.body.data.bankAccounts;
    expect(accounts).toHaveLength(2);
    expect(accounts.filter((a) => a.isPrimary)).toHaveLength(1);
    // Nothing was marked, so the first one entered is the one we pay.
    expect(accounts[0].isPrimary).toBe(true);
  });

  test('the account the merchant marked is the primary one', async () => {
    const res = await post(
      base({
        bankAccounts: [account(IBAN_A), account(IBAN_B, { isPrimary: true })]
      })
    );

    const accounts = res.body.data.bankAccounts;
    expect(accounts[1].isPrimary).toBe(true);
    expect(accounts[0].isPrimary).toBe(false);
    expect(res.body.data.iban).toBe(IBAN_B);
  });

  test('two accounts cannot both be primary — there is one answer to who we pay', async () => {
    const res = await post(
      base({
        bankAccounts: [
          account(IBAN_A, { isPrimary: true }),
          account(IBAN_B, { isPrimary: true }),
          account(IBAN_C, { isPrimary: true })
        ]
      })
    );

    const accounts = res.body.data.bankAccounts;
    expect(accounts.filter((a) => a.isPrimary)).toHaveLength(1);
    expect(accounts[0].isPrimary).toBe(true);
  });

  test('the single-account shape still works and still reads back', async () => {
    // What every client sent before accounts became a list.
    const res = await post(
      base({
        bankName: 'Bank Muscat',
        accountHolder: 'Al Nahda Trading LLC',
        accountNumber: '0299123456',
        iban: IBAN_A
      })
    );

    expect(res.status).toBe(201);
    expect(res.body.data.bankAccounts).toHaveLength(1);
    expect(res.body.data.bankAccounts[0].isPrimary).toBe(true);
    // and the flat fields still answer, reading off the primary account
    expect(res.body.data.iban).toBe(IBAN_A);
    expect(res.body.data.bankName).toBe('Bank Muscat');
    expect(res.body.data.accountNumber).toBe('0299123456');
  });

  test('a malformed IBAN is refused wherever it sits in the list', async () => {
    const res = await post(
      base({ bankAccounts: [account(IBAN_A), account('GB29NWBK60161331926819')] })
    );

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/IBAN/i);
  });

  test('an account with no IBAN is not stored as a half-account', async () => {
    const res = await post(
      base({ bankAccounts: [account(IBAN_A), { bankName: '', accountHolder: '', iban: '' }] })
    );

    expect(res.status).toBe(201);
    expect(res.body.data.bankAccounts).toHaveLength(1);
  });

  test('an organisation carries no bank account — it is the buyer here', async () => {
    const owner = await request(app).post('/api/auth/register').send({
      name: 'Salim',
      email: 'owner@example.om',
      password: 'Str0ngPass!23',
      role: 'sme_owner'
    });

    const res = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${owner.body.token}`)
      .send(base({ crNumber: '7654321', bankAccounts: [account(IBAN_A)] }));

    expect(res.status).toBe(201);
    expect(res.body.data.bankAccounts).toHaveLength(0);
    expect(res.body.data.iban).toBe('');
  });

  test('updating keeps exactly one primary, hooks and all', async () => {
    const created = await post(base({ bankAccounts: [account(IBAN_A)] }));
    const id = created.body.data._id;

    const res = await request(app)
      .put(`/api/companies/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        bankAccounts: [account(IBAN_A), account(IBAN_B, { isPrimary: true })]
      });

    expect(res.status).toBe(200);
    const accounts = res.body.data.bankAccounts;
    expect(accounts).toHaveLength(2);
    expect(accounts.filter((a) => a.isPrimary)).toHaveLength(1);
    expect(res.body.data.iban).toBe(IBAN_B);
  });

  test('more than five accounts is refused', async () => {
    const many = Array.from({ length: 6 }, (_, i) =>
      account(`OM${String(10 + i)}0180000001299${String(100000 + i)}`)
    );
    const res = await post(base({ bankAccounts: many }));
    expect(res.status).toBe(400);
  });
});

describe('What a merchant sells', () => {
  test('several categories can be chosen at once', async () => {
    const res = await post(base({ serviceCategories: ['it', 'consulting', 'training'] }));

    expect(res.status).toBe(201);
    expect(res.body.data.serviceCategories).toEqual(['it', 'consulting', 'training']);
  });

  test('a category outside the published list is refused', async () => {
    const res = await post(base({ serviceCategories: ['it', 'time-travel'] }));

    expect(res.status).toBe(400);
    expect(JSON.stringify(res.body)).toMatch(/category/i);
  });

  test('the same category twice counts once', async () => {
    // Through the model directly: the normaliser is what the controller applies.
    expect(normaliseCategories(['it', 'it', 'consulting'])).toEqual(['it', 'consulting']);
  });

  test('a supplier cannot tick every box and be findable by none', async () => {
    const res = await post(base({ serviceCategories: CATEGORY_KEYS.slice(0, MAX_CATEGORIES + 1) }));
    expect(res.status).toBe(400);
  });

  test('the vocabulary is published in both languages', async () => {
    const res = await request(app).get('/api/companies/categories');

    expect(res.status).toBe(200);
    expect(res.body.data.max).toBe(MAX_CATEGORIES);
    expect(res.body.data.categories.length).toBe(CATEGORY_KEYS.length);
    for (const c of res.body.data.categories) {
      expect(c.key).toBeTruthy();
      expect(c.en).toBeTruthy();
      expect(c.ar).toBeTruthy();
      // Arabic, not a copy of the English label.
      expect(c.ar).not.toBe(c.en);
    }
  });

  test('the list route is not read as a company id', async () => {
    const res = await request(app).get('/api/companies/categories');
    expect(res.body.data.categories).toBeDefined();
  });
});
