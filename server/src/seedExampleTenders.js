/**
 * Puts the sample tenders on a database without disturbing anything else.
 *
 * `npm run seed` rebuilds every content collection from scratch: it deletes
 * all companies, evaluations, tenders, facilities, discounts and news first.
 * That is right for a fresh local database and wrong for a live one, where the
 * programme team may have added their own records since.
 *
 * This touches tenders only, matches them by reference number, and never
 * deletes. A sample tender that is already there is refreshed; one that is not
 * is added; every other tender is left exactly as it is.
 *
 * Usage:
 *   npm run seed:tenders             # dry run — reads, reports, writes nothing
 *   npm run seed:tenders -- --apply  # writes
 *
 * A dry run is the default because this is meant to be pointed at a live
 * database, and the command you type by accident should be the harmless one.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { Tender } = require('./models/Content');
const { tenders } = require('./seedContent');

/**
 * Plans, and optionally applies, the sample tenders.
 *
 * A tender that has been awarded is never touched. Refreshing it would reset
 * its status and closing date, reopening a competition that is over and
 * leaving its winning bid pointing at a tender that says it is still open.
 */
async function applyExampleTenders({ apply = false } = {}) {
  const existing = await Tender.find({ refNo: { $in: tenders.map((t) => t.refNo) } })
    .select('refNo title status awardedBid')
    .lean();
  const byRef = new Map(existing.map((t) => [t.refNo, t]));

  const plan = { add: [], refresh: [], skip: [] };

  for (const tender of tenders) {
    const current = byRef.get(tender.refNo);
    if (!current) plan.add.push(tender.refNo);
    else if (current.awardedBid) plan.skip.push(tender.refNo);
    else plan.refresh.push(tender.refNo);
  }

  if (apply) {
    for (const tender of tenders) {
      if (plan.skip.includes(tender.refNo)) continue;
      /*
        runValidators, because updateOne does not validate by default — and the
        scoring-scheme rule (weights add to 100) is exactly the kind of check
        a bulk write would otherwise sail past.
      */
      await Tender.updateOne(
        { refNo: tender.refNo },
        { $set: tender },
        { upsert: true, runValidators: true }
      );
    }
  }

  return plan;
}

/** The host the connection string points at, without its credentials. */
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

    // Say where this is about to write, before it writes. Host only — the
    // connection string carries a password and does not belong in a terminal.
    console.log(`[tenders] target: ${hostOf(uri)}`);
    console.log(`[tenders] mode:   ${apply ? 'APPLY — will write' : 'dry run — writes nothing'}`);

    await mongoose.connect(uri);
    const plan = await applyExampleTenders({ apply });

    console.log(`[tenders] add:     ${plan.add.length ? plan.add.join(', ') : '—'}`);
    console.log(`[tenders] refresh: ${plan.refresh.length ? plan.refresh.join(', ') : '—'}`);
    console.log(`[tenders] skip:    ${plan.skip.length ? plan.skip.join(', ') + ' (awarded — left alone)' : '—'}`);
    console.log('[tenders] nothing is deleted, and no other tender is touched.');
    if (!apply) console.log('[tenders] run again with --apply to write.');

    await mongoose.connection.close();
    process.exit(0);
  })().catch((err) => {
    console.error('[tenders] failed:', err.message);
    process.exit(1);
  });
}

module.exports = { applyExampleTenders };
