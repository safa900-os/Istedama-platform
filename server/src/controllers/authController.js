const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Verification = require('../models/Verification');
const { sendEmail, mayRevealCode } = require('../utils/notify');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

/**
 * Creates a fresh code for an address, retiring any earlier unconsumed one so
 * only the most recent code can ever work.
 */
async function issueCode(email) {
  await Verification.deleteMany({ email, purpose: 'email_verification', consumedAt: null });

  const code = Verification.generateCode();
  await Verification.create({
    email,
    codeHash: Verification.hashCode(code),
    purpose: 'email_verification',
    expiresAt: new Date(Date.now() + Verification.ttlMinutes * 60 * 1000)
  });

  const delivery = await sendEmail({
    to: email,
    subject: 'Istedama verification code',
    text: `Your verification code is ${code}. It expires in ${Verification.ttlMinutes} minutes.`
  });

  return {
    sent: delivery.delivered,
    expiresInMinutes: Verification.ttlMinutes,
    // Only ever populated outside production when nothing delivered it.
    devCode: mayRevealCode(delivery) ? code : undefined
  };
}

const sanitize = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  accountType: user.accountType,
  emailVerified: Boolean(user.emailVerified),
  active: user.active !== false
});

// @desc  Register a new user
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, accountType, phone } = req.body;

  // Defence in depth: even if the route validator were bypassed, a visitor
  // can never register themselves as an auditor or administrator. Those two
  // roles are provisioned internally.
  const SELF_SERVICE_ROLES = ['sme_owner', 'merchant', 'freelancer'];
  const safeRole = SELF_SERVICE_ROLES.includes(role) ? role : 'sme_owner';

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const user = await User.create({ name, email, password, role: safeRole, accountType, phone });

  /*
    The code goes out before the response does, so an account never exists in
    an unverifiable state: if issuing throws, registration fails and the caller
    retries rather than being handed a token for an address nothing can reach.
  */
  const issued = await issueCode(user.email);

  res.status(201).json({
    success: true,
    data: sanitize(user),
    token: signToken(user._id),
    verification: issued
  });
});

/**
 * Resolves a sign-in identifier to exactly one account.
 *
 * The form accepts an email address or a phone number in a single field, so the
 * lookup has to cover both. Two rules keep that safe:
 *
 *   - A blank identifier never matches. Most accounts carry `phone: ''`, so an
 *     empty value would otherwise match whichever of them came back first.
 *   - `phone` is not unique in the schema, unlike `email`. If a number resolves
 *     to more than one account there is no way to know which was meant, so this
 *     returns nothing rather than signing in as an arbitrary one.
 */
/**
 * Reduces a phone number to the form accounts are stored in: eight local
 * digits.
 *
 * Separators are dropped, and a leading Omani country code is removed only
 * when exactly eight digits remain after it — so "+968 9123 4567", "968
 * 91234567" and "9123-4567" all reduce to "91234567", while a number that
 * merely happens to begin with 968 is left alone.
 */
function normalizePhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('968')) return digits.slice(3);
  return digits;
}

async function findUserByIdentifier(identifier) {
  const value = String(identifier || '').trim();
  if (!value) return null;

  const byEmail = await User.findOne({ email: value.toLowerCase() }).select('+password');
  if (byEmail) return byEmail;

  const digits = normalizePhone(value);
  if (!digits) return null;

  const candidates = await User.find({ phone: { $nin: ['', null] } }).select('+password phone');
  const matches = candidates.filter((u) => normalizePhone(u.phone) === digits);
  return matches.length === 1 ? matches[0] : null;
}

// @desc  Authenticate user & return token
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { identifier, email, password } = req.body;

  // `email` is still read so any client written against the old shape keeps
  // working; the new form sends `identifier`.
  const user = await findUserByIdentifier(identifier || email);
  if (!user || !(await user.matchPassword(password))) {
    // Deliberately does not say which half was wrong, and reads the same
    // whether the identifier was an address or a number.
    res.status(401);
    throw new Error('Invalid credentials');
  }

  // Checked after the password so a suspended account is not revealed to
  // someone guessing addresses.
  if (user.active === false) {
    res.status(403);
    throw new Error('This account has been suspended. Contact the programme team.');
  }

  res.json({
    success: true,
    data: sanitize(user),
    token: signToken(user._id)
  });
});

// @desc  Get current authenticated user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  res.json({ success: true, data: sanitize(req.user) });
});

// @desc  Send (or resend) an email verification code
// @route POST /api/auth/send-code
const sendVerificationCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });

  // Always answer the same way, so this endpoint cannot be used to discover
  // which addresses have accounts.
  if (!user || user.emailVerified) {
    return res.json({ success: true, data: { sent: true, expiresInMinutes: Verification.ttlMinutes } });
  }

  const issued = await issueCode(email);
  return res.json({ success: true, data: issued });
});

// @desc  Confirm an emailed code
// @route POST /api/auth/verify-code
const verifyCode = asyncHandler(async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { code } = req.body;

  const record = await Verification.findOne({
    email,
    purpose: 'email_verification',
    consumedAt: null
  }).sort({ createdAt: -1 });

  if (!record || !record.isUsable()) {
    res.status(400);
    throw new Error('This code has expired or is no longer valid. Request a new one.');
  }

  if (!record.matches(code)) {
    record.attempts += 1;
    await record.save();
    res.status(400);
    const left = Math.max(Verification.maxAttempts - record.attempts, 0);
    throw new Error(
      left > 0
        ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
        : 'Too many incorrect attempts. Request a new code.'
    );
  }

  record.consumedAt = new Date();
  await record.save();

  const user = await User.findOne({ email });
  if (user) {
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    await user.save();
  }

  res.json({ success: true, data: user ? sanitize(user) : {} });
});

module.exports = { registerUser, loginUser, getMe, sendVerificationCode, verifyCode, issueCode };
