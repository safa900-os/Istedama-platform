/**
 * Core Istedama Score business logic.
 *
 * Score = (Omanization Rate * 0.6) + (Financial Stability Index * 0.3) + (ICV Contribution * 0.1)
 *
 * The three weights must always total 1. In-country value was reweighted
 * from 0.3 to 0.1 and the freed 0.2 went to Omanization, keeping the sum
 * at 1 — a set of weights that does not add up silently caps the maximum
 * achievable score below 100 and moves the certification threshold with it.
 *
 * All three inputs are expected as percentages on a 0-100 scale.
 * The result is rounded to 2 decimal places and clamped to [0, 100]
 * to guard against any accumulated floating point drift.
 */
const WEIGHTS = Object.freeze({
  omanizationRate: 0.6,
  financialStabilityIndex: 0.3,
  icvContribution: 0.1
});

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function calculateIstedamaScore({ omanizationRate, financialStabilityIndex, icvContribution }) {
  [omanizationRate, financialStabilityIndex, icvContribution].forEach((v) => {
    if (typeof v !== 'number' || Number.isNaN(v)) {
      throw new Error('All score inputs must be numeric');
    }
  });

  const raw =
    omanizationRate * WEIGHTS.omanizationRate +
    financialStabilityIndex * WEIGHTS.financialStabilityIndex +
    icvContribution * WEIGHTS.icvContribution;

  return Math.round(clamp(raw) * 100) / 100;
}

// A company earns its official Sustainability Certificate once the composite
// score crosses this threshold. Centralized here so the rule is defined once.
const CERTIFICATION_THRESHOLD = 70;

function qualifiesForCertificate(score) {
  return score >= CERTIFICATION_THRESHOLD;
}

function generateCertificateSerial(companyId) {
  const stamp = Date.now().toString(36).toUpperCase();
  const shortId = companyId.toString().slice(-6).toUpperCase();
  return `IST-${shortId}-${stamp}`;
}

module.exports = {
  WEIGHTS,
  CERTIFICATION_THRESHOLD,
  calculateIstedamaScore,
  qualifiesForCertificate,
  generateCertificateSerial
};
