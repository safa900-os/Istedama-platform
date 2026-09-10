const { hoursBetween, AD_RATES } = require('../src/controllers/contentController');

describe('Booking duration and pricing helpers', () => {
  test('computes whole and fractional hours correctly', () => {
    expect(hoursBetween('09:00', '12:00')).toBe(3);
    expect(hoursBetween('09:30', '11:00')).toBe(1.5);
    expect(hoursBetween('08:15', '08:45')).toBe(0.5);
  });

  test('returns 0 for inverted or malformed ranges so cost can never go negative', () => {
    expect(hoursBetween('14:00', '09:00')).toBe(0);
    expect(hoursBetween('10:00', '10:00')).toBe(0);
    expect(hoursBetween('abc', '10:00')).toBe(0);
    expect(hoursBetween(undefined, undefined)).toBe(0);
  });

  test('advertising rate card exposes a price for every supported placement', () => {
    ['services_card', 'homepage_banner', 'featured'].forEach((p) => {
      const entry = AD_RATES.find((r) => r.id === p);
      expect(entry).toBeDefined();
      expect(typeof entry.weeklyPrice).toBe('number');
      expect(entry.weeklyPrice).toBeGreaterThan(0);
    });
  });

  test('a 30-day booking of the cheapest placement costs more than a 7-day one', () => {
    const weekly = AD_RATES.find((r) => r.id === 'services_card').weeklyPrice;
    const price = (days) => Math.round(weekly * (days / 7) * 100) / 100;
    expect(price(30)).toBeGreaterThan(price(7));
    expect(price(7)).toBe(weekly);
  });
});
