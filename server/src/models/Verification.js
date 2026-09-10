const mongoose = require('mongoose');
const crypto = require('crypto');

/**
 * One-time verification codes for account onboarding.
 *
 * Security properties, all deliberate:
 *   - The code is stored as a SHA-256 hash, never in plain text, so a database
 *     leak does not hand out working codes.
 *   - Codes expire after ten minutes and are single-use.
 *   - A capped attempt counter stops a six-digit code being brute-forced;
 *     after five wrong tries the record is spent and a new code is required.
 *   - A TTL index removes expired documents so the collection cannot grow
 *     unbounded with dead codes.
 */
const CODE_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;

const verificationSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    codeHash: { type: String, required: true },
    purpose: {
      type: String,
      enum: ['email_verification', 'password_reset'],
      default: 'email_verification'
    },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    expiresAt: {
      type: Date,
      required: true,
      // MongoDB removes the document once expiresAt passes.
      index: { expires: 0 }
    }
  },
  { timestamps: true }
);

/** Six digits, generated with a CSPRNG rather than Math.random. */
verificationSchema.statics.generateCode = function generateCode() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
};

verificationSchema.statics.hashCode = function hashCode(code) {
  return crypto.createHash('sha256').update(String(code)).digest('hex');
};

verificationSchema.statics.ttlMinutes = CODE_TTL_MINUTES;
verificationSchema.statics.maxAttempts = MAX_ATTEMPTS;

verificationSchema.methods.isUsable = function isUsable() {
  return !this.consumedAt && this.attempts < MAX_ATTEMPTS && this.expiresAt > new Date();
};

/**
 * Constant-time comparison so response timing cannot be used to learn how much
 * of the code was correct.
 */
verificationSchema.methods.matches = function matches(code) {
  const expected = Buffer.from(this.codeHash, 'hex');
  const supplied = Buffer.from(
    mongoose.model('Verification').hashCode(code),
    'hex'
  );
  if (expected.length !== supplied.length) return false;
  return crypto.timingSafeEqual(expected, supplied);
};

module.exports = mongoose.model('Verification', verificationSchema);
