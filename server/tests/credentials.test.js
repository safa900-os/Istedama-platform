const { isValidEmail, isStrongPassword, passwordFailures } = require('../src/utils/credentials');

describe('Email validation', () => {
  test.each([
    'user@example.com',
    'first.last@sub.domain.co.uk',
    'a+tag@example.om',
    'name_1@example-host.com'
  ])('accepts %s', (e) => expect(isValidEmail(e)).toBe(true));

  test.each([
    'plainaddress',
    '@no-local.com',
    'no-domain@',
    'two@@at.com',
    'space in@example.com',
    'trailing.dot.@example.com',
    'double..dot@example.com',
    'no-tld@example',
    'bad@-hyphenstart.com',
    ''
  ])('rejects %s', (e) => expect(isValidEmail(e)).toBe(false));

  test('rejects an over-length address rather than running the regex on it', () => {
    expect(isValidEmail('a'.repeat(250) + '@example.com')).toBe(false);
  });
});

describe('Password strength', () => {
  test('accepts a password meeting every rule', () => {
    expect(isStrongPassword('Istidamah#2026')).toBe(true);
  });

  test.each([
    ['Short1!', 'length'],
    ['alllowercase1!', 'upper'],
    ['ALLUPPERCASE1!', 'lower'],
    ['NoDigitsHere!!', 'digit'],
    ['NoSymbols1234', 'symbol']
  ])('%s fails the %s rule', (pw, rule) => {
    expect(passwordFailures(pw)).toContain(rule);
    expect(isStrongPassword(pw)).toBe(false);
  });

  test('reports every unmet rule at once, not just the first', () => {
    expect(passwordFailures('abc')).toEqual(
      expect.arrayContaining(['length', 'upper', 'digit', 'symbol'])
    );
  });

  test('handles non-string input without throwing', () => {
    expect(isStrongPassword(undefined)).toBe(false);
    expect(isStrongPassword(null)).toBe(false);
  });

  test('every seeded demo password satisfies the policy', () => {
    for (const pw of ['ChangeMe123!', 'Owner123!', 'Auditor123!']) {
      expect(isStrongPassword(pw)).toBe(true);
    }
  });
});
