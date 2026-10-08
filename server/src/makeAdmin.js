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
 *   npm run make-admin -- someone@example.com admin --activate
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
  // Flags are filtered out so `-- me@example.om --activate` still reads the
  // role from its own position rather than taking the flag as one.
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const activate = process.argv.includes('--activate');

  const email = (args[0] || '').trim().toLowerCase();
  const role = (args[1] || 'admin').trim();

  if (!email) {
    console.error('Usage: npm run make-admin -- someone@example.com [role] [--activate]');
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

  /*
    A deactivated account is refused at sign-in and again by `protect` on every
    request, so promoting one produces an administrator who cannot administer
    anything — and the only clue is a login that keeps failing for no stated
    reason. Reactivating is a separate decision from appointing, though, so it
    is asked for separately rather than done quietly.
  */
  const wasInactive = user.active === false;
  if (wasInactive && activate) user.active = true;

  await user.save();

  console.log(`${user.name || email}: ${was} -> ${role}`);

  if (wasInactive && activate) {
    console.log('Account reactivated.');
  } else if (wasInactive) {
    console.warn('');
    console.warn('WARNING: this account is deactivated, so it cannot sign in —');
    console.warn('the new role will not take effect until it is active again.');
    console.warn('Run this with --activate to reactivate it at the same time:');
    console.warn(`  npm run make-admin -- ${email} ${role} --activate`);
  }

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
