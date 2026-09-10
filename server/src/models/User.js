const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    password: { type: String, required: true, minlength: 6, select: false },
    // Onboarding covers individuals, companies and institutions (awqaf,
    // charities and similar), which the programme treats differently.
    accountType: {
      type: String,
      enum: ['individual', 'company', 'institution'],
      default: 'company'
    },
    phone: { type: String, trim: true, default: '' },
    emailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date, default: null },

    // Suspended accounts keep their data but cannot authenticate.
    active: { type: Boolean, default: true },
    role: {
      type: String,
      enum: ['sme_owner', 'merchant', 'auditor', 'admin'],
      default: 'sme_owner'
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
