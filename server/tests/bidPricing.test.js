const {
  priceBid,
  toBaisa,
  toRials,
  percentOf,
  PLATFORM_FEE_RATE,
  DEFAULT_VAT_RATE
} = require('../src/config/bidding');

/**
 * A bid is a financial commitment. These cover the two things that go wrong
 * with money in software: floating-point drift, and charging a percentage of
 * the wrong base.
 */
describe('Pricing a bid', () => {
  test('holds money as whole baisa, so decimals cannot drift', () => {
    // The classic: 0.1 + 0.2 !== 0.3 in binary floating point. Three lines of
    // 0.1 rials must come to exactly 0.3, not 0.30000000000000004.
    const { subtotalBaisa } = priceBid(
      [
        { description: 'a', quantity: 1, unitPrice: 0.1 },
        { description: 'b', quantity: 1, unitPrice: 0.1 },
        { description: 'c', quantity: 1, unitPrice: 0.1 }
      ],
      { vatRate: 0 }
    );
    expect(subtotalBaisa).toBe(300);
    expect(toRials(subtotalBaisa)).toBe(0.3);
  });

  test('forty line items still sum exactly', () => {
    const items = Array.from({ length: 40 }, (_, i) => ({
      description: `line ${i}`,
      quantity: 3,
      unitPrice: 12.345
    }));
    const { subtotalBaisa } = priceBid(items, { vatRate: 0 });
    // 12.345 rials = 12345 baisa; x3 x40
    expect(subtotalBaisa).toBe(12345 * 3 * 40);
    expect(toRials(subtotalBaisa)).toBe(1481.4);
  });

  test('charges the platform fee on the contract value, not on the VAT', () => {
    const p = priceBid([{ description: 'work', quantity: 1, unitPrice: 1000 }], {
      vatRate: 5,
      platformFeeRate: 5
    });

    expect(toRials(p.subtotalBaisa)).toBe(1000);
    expect(toRials(p.vatAmountBaisa)).toBe(50);
    expect(toRials(p.totalBaisa)).toBe(1050);

    // 5% of 1000, not 5% of 1050. VAT belongs to the Tax Authority; billing a
    // commission on it would charge the supplier for the state's money.
    expect(toRials(p.platformFeeBaisa)).toBe(50);
    expect(toRials(p.platformFeeBaisa)).not.toBe(52.5);

    // What actually reaches the bidder.
    expect(toRials(p.netToBidderBaisa)).toBe(1000);
  });

  test('a zero-rated supply pays no VAT but still pays the fee', () => {
    const p = priceBid([{ description: 'export', quantity: 2, unitPrice: 500 }], { vatRate: 0 });
    expect(p.vatAmountBaisa).toBe(0);
    expect(toRials(p.totalBaisa)).toBe(1000);
    expect(toRials(p.platformFeeBaisa)).toBe(50);
    expect(toRials(p.netToBidderBaisa)).toBe(950);
  });

  test('rounds a fee half-up, never quietly in the platform’s favour', () => {
    // 5% of 1.005 rials = 0.05025 rials = 50.25 baisa -> 50, not 51.
    expect(percentOf(toBaisa(1.005), 5)).toBe(50);
    // and a genuine half rounds up, not to even
    expect(percentOf(1010, 5)).toBe(51); // 50.5 -> 51
  });

  test('an empty or malformed bill of quantities prices at zero rather than NaN', () => {
    for (const input of [[], null, undefined, [{ description: 'x' }]]) {
      const p = priceBid(input);
      expect(Number.isFinite(p.subtotalBaisa)).toBe(true);
      expect(p.subtotalBaisa).toBe(0);
      expect(p.netToBidderBaisa).toBe(0);
    }
  });

  test('negative quantities and prices are floored at zero, not credited', () => {
    const p = priceBid([{ description: 'refund?', quantity: -5, unitPrice: -100 }]);
    expect(p.subtotalBaisa).toBe(0);
  });

  test('the defaults are Oman’s VAT and the published platform fee', () => {
    expect(DEFAULT_VAT_RATE).toBe(5);
    expect(PLATFORM_FEE_RATE).toBe(5);
    const p = priceBid([{ description: 'x', quantity: 1, unitPrice: 100 }]);
    expect(p.vatRate).toBe(5);
    expect(p.platformFeeRate).toBe(5);
  });
});
