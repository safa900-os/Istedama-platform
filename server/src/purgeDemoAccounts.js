/**
 * Removes the seeded demo accounts from a database.
 *
 * Their passwords are written in seed.js, which is in the repository. Once that
 * repository is public — or simply shared with somebody — those four logins are
 * open doors, and `admin@istidamah.om` is an open door to the administration of
 * a live platform. Changing the seed does nothing for a database that already
 * has them; they have to be deleted.
 *
 * It removes those four addresses and nothing else. It will not delete the last
 * administrator: an installation with no admin cannot approve a registration,
 * cannot award a tender, and cannot make itself another admin through the site.
 * So a real administrator has to exist first.
 *
 * Usage:
 *   npm run demo:purge             # dry run — reads, reports, deletes nothing
 *   npm run demo:purge -- --apply  # deletes
 *
 * Dry run is the default because this is pointed at a live database, and the
 * command typed by accident should be the harmless one.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Company = require('./models/Company');

/** The addresses seed.js creates. Nothing outside this list is ever touched. */
const DEMO_EMAILS = [
  'admin@istidamah.om',
  'owner@istidamah.om',
  'merchant@istidamah.om',
  'auditor@istidamah.om'
];

/**
 * Plans, and optionally performs, the removal.
 *
 * Returns what it found rather than printing, so the same function serves the
 * command line and the tests.
 */
async function purgeDemoAccounts({ apply = false } = {}) {
  const found = await User.find({ email: { $in: DEMO_EMAILS } }).select('email role').lean();

  /*
    Is there an administrator who is not one of these? Checked before anything
    is deleted, because the failure it prevents — a platform with no admin and
    no way to appoint one through the site — is not recoverable from the
    browser. `npm run make-admin` is the way out, and it is better to be told
    to run it first than to discover it afterwards.
  */
  const realAdmins = await User.countDocuments({
    role: 'admin',
    email: { $nin: DEMO_EMAILS }
  });

  const plan = {
    found: found.map((u) => u.email),
    realAdmins,
    deleted: 0,
    blocked: false,
    orphanedCompanies: []
  };

  const removingAnAdmin = found.some((u) => u.role === 'admin');
  if (removingAnAdmin && realAdmins === 0) {
    plan.blocked = true;
    return plan;
  }

  /*
    Companies these accounts own. Reported, not deleted — removing a login is a
    small, reversible act; removing the company records attached to it is not,
    and nothing here knows whether they still matter to somebody.
  */
  const ids = found.map((u) => u._id);
  if (ids.length) {
    const owned = await Company.find({ owner: { $in: ids } }).select('companyName').lean();
    plan.orphanedCompanies = owned.map((c) => c.companyName);
  }

  if (apply && found.length) {
    const result = await User.deleteMany({ email: { $in: DEMO_EMAILS } });
    plan.deleted = result.deletedCount;
  }

  return plan;
}

/** The host a connection string points at, without its credentials. */
const hostOf = (uri) => {
  try {
    return new URL(String(uri).replace(/^mongodb(\+srv)?:/, 'http:')).hostname;
  } catch {
    return '(unparseable)';
  }
};

if (require.main === module) {
  (async () => {
    const apply = process.argv.includes('--apply');
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('MONGO_URI is not set.');
      process.exit(1);
    }

    console.log(`[purge] target: ${hostOf(uri)}`);
    console.log(`[purge] mode:   ${apply ? 'APPLY — will delete' : 'dry run — deletes nothing'}`);

    await mongoose.connect(uri);
    const plan = await purgeDemoAccounts({ apply });

    if (!plan.found.length) {
      console.log('[purge] no demo accounts on this database. Nothing to do.');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log(`[purge] found:  ${plan.found.join(', ')}`);

    if (plan.blocked) {
      console.error('');
      console.error('[purge] REFUSED: this would remove the only administrator.');
      console.error('[purge] An installation with no admin cannot approve a registration,');
      console.error('[purge] award a tender, or appoint another admin through the site.');
      console.error('[purge] Register through the platform, then run:');
      console.error('[purge]   npm run make-admin -- you@example.com');
      console.error('[purge] and run this again.');
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log(`[purge] other admins on this database: ${plan.realAdmins}`);

    if (plan.orphanedCompanies.length) {
      console.log('[purge] these company records were owned by those accounts and are');
      console.log('[purge] left in place, without an owner:');
      for (const name of plan.orphanedCompanies) console.log(`[purge]   - ${name}`);
    }

    if (apply) {
      console.log(`[purge] deleted ${plan.deleted} account(s).`);
      console.log('[purge] Their passwords are still in the repository history, but they');
      console.log('[purge] no longer open anything.');
    } else {
      console.log('[purge] run again with --apply to delete.');
    }

    await mongoose.connection.close();
    process.exit(0);
  })().catch((err) => {
    console.error('[purge] failed:', err.message);
    process.exit(1);
  });
}

module.exports = { purgeDemoAccounts, DEMO_EMAILS };
