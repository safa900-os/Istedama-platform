const { AD_RATES } = require('../src/controllers/contentController');

/**
 * The advertising page renders the rate card with .map() and .find(), so the
 * shape of this export is a contract. Returning an object here previously
 * crashed the page to a blank screen.
 */
describe('Advertising rate card', () => {
  test('is exposed as an array, not a keyed object', () => {
    expect(Array.isArray(AD_RATES)).toBe(true);
    expect(AD_RATES.length).toBeGreaterThan(0);
  });

  test('every entry has an id and a numeric weekly price', () => {
    for (const rate of AD_RATES) {
      expect(typeof rate.id).toBe('string');
      expect(typeof rate.weeklyPrice).toBe('number');
      expect(rate.weeklyPrice).toBeGreaterThan(0);
    }
  });

  test('covers exactly the placements the Advertisement model allows', () => {
    const ids = AD_RATES.map((r) => r.id).sort();
    expect(ids).toEqual(['featured', 'homepage_banner', 'services_card']);
  });

  test('matches the prices published on the advertising page', () => {
    // 15, 25 and 40 rials a week. An advertiser reads these on the page before
    // ever reaching the form, so the table here is what makes the quote honest.
    const priceOf = (id) => AD_RATES.find((r) => r.id === id).weeklyPrice;
    expect(priceOf('services_card')).toBe(15);
    expect(priceOf('homepage_banner')).toBe(25);
    expect(priceOf('featured')).toBe(40);
  });

  test('every entry names itself in both languages', () => {
    // The placement menu renders this label; without one it showed a bare
    // price with no name beside it.
    for (const rate of AD_RATES) {
      expect(rate.label.length).toBeGreaterThan(0);
      expect(rate.labelAr.length).toBeGreaterThan(0);
    }
  });

  test('ids are unique so find() is unambiguous', () => {
    const ids = AD_RATES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
