/**
 * Promotes an existing account to admin.
 *
 * The seed refuses to create its demo accounts in production, because their
 * passwords are written in this repository. So the first administrator of a
 * deployed platform is made this way: register normally through the site, then
 * run this once against that email.
 *
 * Usage:
 *   npm run make-admin -- someone@example.com
 *
 * It never creates an account and never sets a password — it only changes the
 * role of somebody who has already signed up, so there is no way for it to
 * leave a login behind that nobody chose.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const VALID = ['admin', 'auditor', 'sme_owner', 'merchant', 'freelancer'];

(async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  const role = (process.argv[3] || 'admin').trim();

  if (!email) {
    console.error('Usage: npm run make-admin -- someone@example.com [role]');
    console.error('Roles:', VALID.join(', '));
    process.exit(1);
  }
  if (!VALID.includes(role)) {
    console.error(`"${role}" is not a role. Use one of: ${VALID.join(', ')}`);
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No account with the email ${email}.`);
    console.error('Register through the site first, then run this again.');
    await mongoose.disconnect();
    process.exit(1);
  }

  const was = user.role;
  user.role = role;
  await user.save();

  console.log(`${user.name || email}: ${was} -> ${role}`);
  await mongoose.disconnect();
})().catch(async (err) => {
  console.error('Failed:', err.message);
  try {
    await mongoose.disconnect();
  } catch {
    /* already closed */
  }
  process.exit(1);
});
