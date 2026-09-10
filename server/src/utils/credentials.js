/**
 * Credential rules, defined once.
 *
 * The client imports a mirror of these to give instant feedback; the server
 * treats this file as authoritative, so a request crafted outside the UI is
 * held to exactly the same policy.
 *
 * Deliberate asymmetry: the strength rules apply to *registration only*.
 * Login checks format and presence but never re-tests strength — doing so
 * would lock out any account created before a policy change and would leak
 * the password policy to anyone probing the login endpoint.
 */

// Local part, single @, dotted domain, TLD of 2+ letters, no consecutive dots.
const EMAIL_RE = /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]*[A-Za-z0-9])?@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)*\.[A-Za-z]{2,}$/;

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

const PASSWORD_CHECKS = [
  { id: 'length', test: (v) => v.length >= PASSWORD_MIN && v.length <= PASSWORD_MAX },
  { id: 'lower', test: (v) => /[a-z]/.test(v) },
  { id: 'upper', test: (v) => /[A-Z]/.test(v) },
  { id: 'digit', test: (v) => /[0-9]/.test(v) },
  { id: 'symbol', test: (v) => /[^A-Za-z0-9]/.test(v) }
];

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const v = value.trim();
  // Guard the length first; long inputs against a complex regex are a DoS risk.
  if (v.length === 0 || v.length > 254) return false;
  if (v.includes('..')) return false;
  return EMAIL_RE.test(v);
}

/** Returns the ids of every rule the password fails, empty when it passes. */
function passwordFailures(value) {
  if (typeof value !== 'string') return PASSWORD_CHECKS.map((c) => c.id);
  return PASSWORD_CHECKS.filter((c) => !c.test(value)).map((c) => c.id);
}

function isStrongPassword(value) {
  return passwordFailures(value).length === 0;
}

module.exports = {
  EMAIL_RE,
  PASSWORD_MIN,
  PASSWORD_MAX,
  PASSWORD_CHECKS,
  isValidEmail,
  passwordFailures,
  isStrongPassword
};
