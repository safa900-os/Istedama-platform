/**
 * Frontend mirror of the backend Istedama Score formula, used for instant
 * client-side previews before an evaluation is submitted to the API
 * (the server always recalculates authoritatively — see server/src/utils/calculateScore.js).
 */
export function calculateIstedamaScore({ omanizationRate, financialStabilityIndex, icvContribution }) {
  const raw = omanizationRate * 0.6 + financialStabilityIndex * 0.3 + icvContribution * 0.1;
  return Math.round(Math.min(100, Math.max(0, raw)) * 100) / 100;
}

export const CERTIFICATION_THRESHOLD = 70;

export function qualifiesForCertificate(score) {
  return score >= CERTIFICATION_THRESHOLD;
}
