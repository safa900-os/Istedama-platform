/**
 * Client mirror of server/src/utils/credentials.js.
 *
 * Kept identical on purpose: the client copy exists only to give instant
 * feedback, while the server remains the authority. If the two ever drift,
 * the server wins and the user sees its message instead.
 */
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const PASSWORD_CHECKS = [
  { id: 'length', test: (v) => v.length >= PASSWORD_MIN && v.length <= PASSWORD_MAX },
  { id: 'lower', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', test: (v) => /[A-Z]/.test(v) },
  { id: 'digit', test: (v) => /[0-9]/.test(v) },
  { id: 'symbol', test: (v) => /[^A-Za-z0-9]/.test(v) }
];

export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  if (v.length === 0 || v.length > 254) return false;
  if (v.includes('..')) return false;
  return EMAIL_RE.test(v);
}

export function passwordFailures(value) {
  if (typeof value !== 'string') return PASSWORD_CHECKS.map((c) => c.id);
  return PASSWORD_CHECKS.filter((c) => !c.test(value)).map((c) => c.id);
}

export function isStrongPassword(value) {
  return passwordFailures(value).length === 0;
}

/** 0-4, used only to size and colour the strength meter. */
export function passwordScore(value) {
  if (!value) return 0;
  return PASSWORD_CHECKS.length - passwordFailures(value).length;
}
