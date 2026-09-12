const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { registerUser, loginUser, getMe, sendVerificationCode, verifyCode } = require('../controllers/authController');
const { isValidEmail, passwordFailures, PASSWORD_MIN } = require('../utils/credentials');

const router = express.Router();

// Roles a visitor may self-select. `auditor` and `admin` are assigned
// internally, never claimed at sign-up.
// Roles a visitor may give themselves at sign-up. Auditor and admin stay
// out of it: those are provisioned internally.
const SELF_SERVICE_ROLES = ['sme_owner', 'merchant', 'freelancer'];

const PASSWORD_MESSAGES = {
  length: `Password must be at least ${PASSWORD_MIN} characters`,
  lower: 'Password must include a lowercase letter',
  upper: 'Password must include an uppercase letter',
  digit: 'Password must include a number',
  symbol: 'Password must include a special character'
};

router.post(
  '/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 80 })
      .withMessage('Name must be between 2 and 80 characters'),

    body('email')
      .trim()
      .custom((v) => {
        if (!isValidEmail(v)) throw new Error('Enter a valid email address');
        return true;
      })
      .normalizeEmail({ gmail_remove_dots: false }),

    body('password').custom((v) => {
      const failures = passwordFailures(v);
      if (failures.length) {
        // Report every unmet rule at once rather than one per attempt.
        throw new Error(failures.map((f) => PASSWORD_MESSAGES[f]).join('; '));
      }
      return true;
    }),

    body('role')
      .optional()
      .isIn(SELF_SERVICE_ROLES)
      .withMessage('Choose a valid account type'),

    body('accountType')
      .optional()
      .isIn(['individual', 'company', 'institution'])
      .withMessage('Choose a valid registrant type')
  ],
  validate,
  registerUser
);

// Login validates shape only. Re-checking strength here would lock out
// accounts created under an older policy and would advertise the rules.
router.post(
  '/login',
  [
    // One field carries either an address or a number, so the shape check is
    // "looks like one of the two" rather than "is a valid email". Anything
    // finer would tell an attacker which identifiers exist.
    body('identifier')
      .optional()
      .trim()
      .custom((v) => {
        const digits = String(v).replace(/\D/g, '');
        if (isValidEmail(v) || digits.length >= 8) return true;
        throw new Error('Enter a valid email address or phone number');
      }),
    body('email')
      .optional()
      .trim()
      .custom((v) => {
        if (!isValidEmail(v)) throw new Error('Enter a valid email address');
        return true;
      }),
    body().custom((body) => {
      if (!body.identifier && !body.email) {
        throw new Error('Enter your email address or phone number');
      }
      return true;
    }),
    body('password').notEmpty().withMessage('Enter your password')
  ],
  validate,
  loginUser
);

router.get('/me', protect, getMe);


// Verification codes. Rate-limiting these at the edge is advisable in
// production; the model already caps attempts per code.
router.post(
  '/send-code',
  [body('email').trim().custom((v) => {
    if (!isValidEmail(v)) throw new Error('Enter a valid email address');
    return true;
  })],
  validate,
  sendVerificationCode
);

router.post(
  '/verify-code',
  [
    body('email').trim().custom((v) => {
      if (!isValidEmail(v)) throw new Error('Enter a valid email address');
      return true;
    }),
    body('code').isLength({ min: 6, max: 6 }).withMessage('Enter the 6-digit code')
      .isNumeric().withMessage('The code is six digits')
  ],
  validate,
  verifyCode
);

module.exports = router;
