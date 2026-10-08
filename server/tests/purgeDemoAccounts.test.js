const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const User = require('../src/models/User');
const Company = require('../src/models/Company');
const { purgeDemoAccounts, DEMO_EMAILS } = require('../src/purgeDemoAccounts');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([User.deleteMany(), Company.deleteMany()]);
});

/** The four accounts seed.js creates, at the roles it gives them. */
const seedDemoAccounts = () =>
  User.create([
    { name: 'Demo Admin', email: 'admin@istidamah.om', password: 'ChangeMe123!', role: 'admin' },
    { name: 'Demo Owner', email: 'owner@istidamah.om', password: 'Owner123!', role: 'sme_owner' },
    { name: 'Demo Merchant', email: 'merchant@istidamah.om', password: 'Merchant123!', role: 'merchant' },
    { name: 'Demo Auditor', email: 'auditor@istidamah.om', password: 'Auditor123!', role: 'auditor' }
  ]);

const realAdmin = () =>
  User.create({
    name: 'Safa Al Hatmi',
    email: 'safa@example.om',
    password: 'Str0ngPass!23',
    role: 'admin'
  });

/**
 * This deletes accounts on a live database. The tests that matter are the ones
 * about what it must not do: touch anything outside the list, or leave the
 * platform with nobody who can administer it.
 */
describe('Removing the seeded demo accounts', () => {
  test('a dry run deletes nothing', async () => {
    await seedDemoAccounts();
    await realAdmin();

    const plan = await purgeDemoAccounts();

    expect(plan.found).toHaveLength(4);
    expect(plan.deleted).toBe(0);
    expect(await User.countDocuments()).toBe(5);
  });

  test('applying removes the four, and only the four', async () => {
    await seedDemoAccounts();
    await realAdmin();
    await User.create({
      name: 'A real merchant',
      email: 'someone@example.om',
      password: 'Str0ngPass!23',
      role: 'merchant'
    });

    const plan = await purgeDemoAccounts({ apply: true });

    expect(plan.deleted).toBe(4);
    const left = await User.find().select('email').lean();
    expect(left.map((u) => u.email).sort()).toEqual(['safa@example.om', 'someone@example.om']);
  });

  test('it refuses to remove the last administrator', async () => {
    await seedDemoAccounts();
    // No admin but the demo one.

    const plan = await purgeDemoAccounts({ apply: true });

    expect(plan.blocked).toBe(true);
    expect(plan.realAdmins).toBe(0);
    // Nothing was deleted — not even the three that would have been safe.
    expect(await User.countDocuments()).toBe(4);
  });

  test('once a real admin exists, it proceeds', async () => {
    await seedDemoAccounts();
    await realAdmin();

    const plan = await purgeDemoAccounts({ apply: true });

    expect(plan.blocked).toBe(false);
    expect(plan.realAdmins).toBe(1);
    expect(await User.countDocuments({ role: 'admin' })).toBe(1);
  });

  test('an account that merely looks like a demo one is left alone', async () => {
    await User.create({
      name: 'Not a demo account',
      email: 'admin@istidamah.com', // .com, not .om
      password: 'Str0ngPass!23',
      role: 'admin'
    });

    const plan = await purgeDemoAccounts({ apply: true });

    expect(plan.found).toHaveLength(0);
    expect(await User.countDocuments()).toBe(1);
  });

  test('companies owned by a demo account are reported, not deleted', async () => {
    const [, owner] = await seedDemoAccounts();
    await realAdmin();
    await Company.create({
      companyName: 'Seeded Company',
      crNumber: '1234567',
      governorate: 'Muscat',
      employeeCount: 5,
      omaniEmployeeCount: 3,
      location: { lat: 23.58, lng: 58.38 },
      owner: owner._id
    });

    const plan = await purgeDemoAccounts({ apply: true });

    expect(plan.orphanedCompanies).toEqual(['Seeded Company']);
    // Removing a login is small and reversible. Removing the records attached
    // to it is not, and this does not know whether they still matter.
    expect(await Company.countDocuments()).toBe(1);
  });

  test('running it twice is not an error', async () => {
    await seedDemoAccounts();
    await realAdmin();

    await purgeDemoAccounts({ apply: true });
    const again = await purgeDemoAccounts({ apply: true });

    expect(again.found).toHaveLength(0);
    expect(again.deleted).toBe(0);
  });

  test('the list is exactly what seed.js creates', async () => {
    const fs = require('fs');
    const path = require('path');
    const src = fs.readFileSync(path.join(__dirname, '../src/seed.js'), 'utf8');

    // A demo account added to the seed and not to this list would survive the
    // purge, which is the one way this tool quietly stops working.
    const emails = [...src.matchAll(/email: '([^']+@istidamah\.om)'/g)].map((m) => m[1]);
    expect([...new Set(emails)].sort()).toEqual([...DEMO_EMAILS].sort());
  });
});
