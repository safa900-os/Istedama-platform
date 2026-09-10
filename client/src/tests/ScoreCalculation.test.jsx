import { describe, test, expect } from 'vitest';
import { calculateIstedamaScore, qualifiesForCertificate } from '../utils/scoring';

describe('Istedama Score calculation (frontend mirror)', () => {
  test('applies the weighted formula: Omanization*0.6 + FSI*0.3 + ICV*0.1', () => {
    const score = calculateIstedamaScore({
      omanizationRate: 80,
      financialStabilityIndex: 70,
      icvContribution: 60
    });
    expect(score).toBeCloseTo(75, 2);
  });

  test('a score of exactly 70 qualifies for certification, 69.9 does not', () => {
    expect(qualifiesForCertificate(70)).toBe(true);
    expect(qualifiesForCertificate(69.9)).toBe(false);
  });
});
