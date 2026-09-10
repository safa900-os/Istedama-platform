const {
  calculateIstedamaScore,
  qualifiesForCertificate,
  CERTIFICATION_THRESHOLD,
  WEIGHTS
} = require('../src/utils/calculateScore');

describe('Istedama Score business logic', () => {
  test('applies the documented weighted formula correctly', () => {
    // Score = (Omanization*0.6) + (FSI*0.3) + (ICV*0.1)
    const score = calculateIstedamaScore({
      omanizationRate: 80,
      financialStabilityIndex: 70,
      icvContribution: 60
    });
    // 80*0.6 + 70*0.3 + 60*0.1 = 48 + 21 + 6 = 75
    expect(score).toBeCloseTo(75, 2);
  });

  test('the weights total exactly one', () => {
    // The invariant behind the formula. Weights that sum to less than one cap
    // the highest achievable score below 100 and quietly move the 70-point
    // certification threshold out of reach; summing to more than one lets a
    // company score above 100 before the clamp hides it.
    const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  test('a perfect return on every measure is exactly 100', () => {
    // The same invariant, checked through the function rather than the table.
    expect(
      calculateIstedamaScore({
        omanizationRate: 100,
        financialStabilityIndex: 100,
        icvContribution: 100
      })
    ).toBe(100);
  });

  test('clamps and rounds edge-case inputs safely', () => {
    const perfect = calculateIstedamaScore({
      omanizationRate: 100,
      financialStabilityIndex: 100,
      icvContribution: 100
    });
    expect(perfect).toBe(100);

    const zero = calculateIstedamaScore({
      omanizationRate: 0,
      financialStabilityIndex: 0,
      icvContribution: 0
    });
    expect(zero).toBe(0);
  });

  test('throws on non-numeric input rather than silently producing NaN', () => {
    expect(() =>
      calculateIstedamaScore({ omanizationRate: 'high', financialStabilityIndex: 50, icvContribution: 50 })
    ).toThrow();
  });

  test('certificate threshold gate works as documented', () => {
    expect(qualifiesForCertificate(CERTIFICATION_THRESHOLD)).toBe(true);
    expect(qualifiesForCertificate(CERTIFICATION_THRESHOLD - 0.01)).toBe(false);
  });
});
