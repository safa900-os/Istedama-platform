const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const Company = require('../src/models/Company');
const { Tender, NewsPost } = require('../src/models/Content');
const { applyExampleTenders } = require('../src/seedExampleTenders');
const { tenders } = require('../src/seedContent');

let mongo;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([Tender.deleteMany(), Company.deleteMany(), NewsPost.deleteMany()]);
});

/**
 * This script exists to be pointed at a live database. The tests that matter
 * are the ones about what it must *not* do.
 */
describe('Putting the sample tenders on a database', () => {
  test('a dry run writes nothing', async () => {
    const plan = await applyExampleTenders();

    expect(plan.add).toHaveLength(tenders.length);
    expect(await Tender.countDocuments()).toBe(0);
  });

  test('applying adds every sample tender with its full terms', async () => {
    await applyExampleTenders({ apply: true });

    expect(await Tender.countDocuments()).toBe(tenders.length);
    const t = await Tender.findOne({ refNo: 21 });
    expect(t.scopeItems.length).toBeGreaterThan(0);
    expect(t.evaluationCriteria.reduce((a, c) => a + c.weight, 0)).toBe(100);
    expect(t.requirements.some((r) => r.kind === 'local_content')).toBe(true);
  });

  test('it never deletes a tender someone else added', async () => {
    await Tender.create({
      refNo: 9001,
      title: 'Added by the programme team',
      orgName: 'Real Buyer',
      closingDate: new Date(Date.now() + 864e5)
    });

    await applyExampleTenders({ apply: true });

    const kept = await Tender.findOne({ refNo: 9001 });
    expect(kept).not.toBeNull();
    expect(kept.title).toBe('Added by the programme team');
  });

  test('it touches no other collection', async () => {
    await Company.create({
      companyName: 'A real registration',
      crNumber: '5551234',
      governorate: 'Muscat',
      employeeCount: 5,
      omaniEmployeeCount: 3,
      location: { lat: 23.58, lng: 58.38 }
    });
    await NewsPost.create({ title: 'Real news', slug: 'real-news', body: 'x' }).catch(() => null);
    const newsBefore = await NewsPost.countDocuments();

    await applyExampleTenders({ apply: true });

    // The full seed would have wiped both. This must not.
    expect(await Company.countDocuments()).toBe(1);
    expect(await NewsPost.countDocuments()).toBe(newsBefore);
  });

  test('an awarded tender is left alone, so a closed competition is not reopened', async () => {
    const awarded = await Tender.create({
      ...tenders[0],
      status: 'awarded',
      awardedBid: new mongoose.Types.ObjectId(),
      awardedAt: new Date()
    });

    const plan = await applyExampleTenders({ apply: true });

    expect(plan.skip).toContain(tenders[0].refNo);
    const after = await Tender.findById(awarded._id);
    expect(after.status).toBe('awarded');
    expect(String(after.awardedBid)).toBe(String(awarded.awardedBid));
  });

  test('running it twice leaves one copy of each, not two', async () => {
    await applyExampleTenders({ apply: true });
    const plan = await applyExampleTenders({ apply: true });

    expect(plan.add).toHaveLength(0);
    expect(plan.refresh).toHaveLength(tenders.length);
    expect(await Tender.countDocuments()).toBe(tenders.length);
  });

  test('a bare sample tender already on the database is refreshed with its terms', async () => {
    // What production holds today: the headline, none of the terms.
    const { scopeItems, evaluationCriteria, phases, requirements, durationDays, ...bare } =
      tenders.find((t) => t.refNo === 17);
    await Tender.create(bare);

    await applyExampleTenders({ apply: true });

    const t = await Tender.findOne({ refNo: 17 });
    expect(t.scopeItems.length).toBeGreaterThan(0);
    expect(t.evaluationCriteria.length).toBeGreaterThan(0);
    expect(await Tender.countDocuments({ refNo: 17 })).toBe(1);
  });
});
