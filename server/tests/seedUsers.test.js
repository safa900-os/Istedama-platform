const fs = require('fs');
const path = require('path');

/**
 * The seeded demo accounts are the only way into the app before anyone
 * registers, so guard their shape. Parsing the literal out of seed.js keeps
 * this test free of a database connection.
 */
const src = fs.readFileSync(path.join(__dirname, '../src/seed.js'), 'utf8');

function extractDemoUsers() {
  const start = src.indexOf('const DEMO_USERS = [');
  const end = src.indexOf('\n  ];', start) + 4;
  const literal = src.slice(start + 'const DEMO_USERS = '.length, end);
  // eslint-disable-next-line no-eval
  return eval(literal);
}

describe('Seeded demo accounts', () => {
  const users = extractDemoUsers();

  test('provides exactly one account per role in the system', () => {
    const roles = users.map((u) => u.role).sort();
    expect(roles).toEqual(['admin', 'auditor', 'merchant', 'sme_owner']);
  });

  test('every seeded password satisfies the live strength policy', () => {
    const { isStrongPassword } = require('../src/utils/credentials');
    for (const u of users) {
      expect(isStrongPassword(u.password)).toBe(true);
    }
  });

  test('every account has a valid email and a password the User model accepts', () => {
    for (const u of users) {
      expect(u.email).toMatch(/^\S+@\S+\.\S+$/);
      // User schema enforces minlength 6
      expect(u.password.length).toBeGreaterThanOrEqual(6);
      expect(u.name.trim().length).toBeGreaterThan(0);
    }
  });

  test('emails are unique, since the User model has a unique index on email', () => {
    const emails = users.map((u) => u.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  test('seeding is idempotent — existing users are looked up before being created', () => {
    // A bare create() would throw a duplicate-key error on a second run.
    expect(src).toMatch(/User\.findOne\(\{\s*email:\s*spec\.email\s*\}\)/);
  });

  test('companies are owned by the SME owner and evaluations signed by the auditor', () => {
    expect(src).toContain('owner: ownerUser._id');
    expect(src).toContain('evaluatedBy: auditorUser._id');
  });
});
