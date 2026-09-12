const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Application = require('../src/models/Application');
const { Tender } = require('../src/models/Content');

let mongo;
let invited;
let outsider;
let staff;
let publicTender;
let closedTender;

const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

let crSeq = 0;

/** An approved supplier, with their token, user and company. */
const supplier = async (email) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Supplier', email, password: 'Str0ngPass!23', role: 'merchant' });

  crSeq += 1;
  const company = await Company.create({
    companyName: `Supplier ${crSeq}`,
    crNumber: String(2000000 + crSeq),
    governorate: 'Muscat',
    employeeCount: 5,
    omaniEmployeeCount: 3,
    location: { lat: 23.58, lng: 58.38 },
    entityType: 'merchant',
    owner: res.body.data._id,
    registrationStatus: 'approved'
  });

  return { token: res.body.token, user: res.body.data, company };
};

const makeTender = (overrides = {}) =>
  Tender.create({
    refNo: Math.floor(Math.random() * 1e6),
    title: 'Works',
    orgName: 'Buyer LLC',
    closingDate: new Date(Date.now() + 7 * 864e5),
    status: 'open',
    ...overrides
  });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

beforeEach(async () => {
  await Promise.all([
    Company.deleteMany(),
    User.deleteMany(),
    Application.deleteMany(),
    Tender.deleteMany()
  ]);

  invited = await supplier('invited@example.om');
  outsider = await supplier('outsider@example.om');

  const admin = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Staff', email: 'staff@example.om', password: 'Str0ngPass!23', role: 'merchant' });
  await User.findByIdAndUpdate(admin.body.data._id, { role: 'admin' });
  staff = (
    await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'staff@example.om', password: 'Str0ngPass!23' })
  ).body.token;

  publicTender = await makeTender({ title: 'Open call' });
  closedTender = await makeTender({
    title: 'Closed competition',
    visibility: 'invited',
    invitedCompanies: [invited.company._id]
  });
});

/**
 * An invited tender is a closed competition between named suppliers. The rule
 * only means something if it holds on every read — including the one where
 * somebody types the id straight into the address bar.
 */
describe('Who may see a tender', () => {
  test('a visitor who is not signed in sees only the public ones', async () => {
    const res = await request(app).get('/api/content/tenders');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Open call');
  });

  test('an invited supplier sees the closed competition as well', async () => {
    const res = await as(invited.token, request(app).get('/api/content/tenders'));

    const titles = res.body.data.map((t) => t.title).sort();
    expect(titles).toEqual(['Closed competition', 'Open call']);
  });

  test('a supplier who was not invited does not', async () => {
    const res = await as(outsider.token, request(app).get('/api/content/tenders'));

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Open call');
  });

  test('guessing the id is not a way round an invitation', async () => {
    const mine = await as(
      invited.token,
      request(app).get(`/api/content/tenders/${closedTender._id}`)
    );
    expect(mine.status).toBe(200);

    const theirs = await as(
      outsider.token,
      request(app).get(`/api/content/tenders/${closedTender._id}`)
    );
    expect(theirs.status).toBe(404);

    const anonymous = await request(app).get(`/api/content/tenders/${closedTender._id}`);
    expect(anonymous.status).toBe(404);
  });

  test('staff see everything, because they administer it', async () => {
    const res = await as(staff, request(app).get('/api/content/tenders'));
    expect(res.body.data).toHaveLength(2);

    const one = await as(staff, request(app).get(`/api/content/tenders/${closedTender._id}`));
    expect(one.status).toBe(200);
  });

  test('the invitations view narrows to closed competitions this supplier is named in', async () => {
    const mine = await as(invited.token, request(app).get('/api/content/tenders?invited=true'));
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].title).toBe('Closed competition');

    // It cannot widen anything — an outsider's invitations list is empty.
    const theirs = await as(outsider.token, request(app).get('/api/content/tenders?invited=true'));
    expect(theirs.body.data).toHaveLength(0);
  });

  test('a stale token degrades to the public view rather than failing the page', async () => {
    const res = await request(app)
      .get('/api/content/tenders')
      .set('Authorization', 'Bearer not-a-real-token');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

/** Awarding is one decision with two halves: one bid wins, the rest are closed. */
describe('Awarding a tender', () => {
  /** A submitted bid from this supplier on the public tender. */
  const bidOn = async (who, summary) => {
    await as(who.token, request(app).put(`/api/applications/tender/${publicTender._id}/draft`)).send({
      contactName: 'Contact',
      contactEmail: 'c@example.om',
      proposalSummary: summary,
      lineItems: [{ description: 'Works', quantity: 1, unitPrice: 100 }]
    });

    const bid = await Application.findOne({ tenderId: publicTender._id, applicant: who.user._id });
    bid.documents.push({
      slot: 'technical',
      storedName: 'x.pdf',
      originalName: 'technical.pdf',
      mimeType: 'application/pdf',
      size: 1024
    });
    await bid.save();

    await as(who.token, request(app).post(`/api/applications/tender/${publicTender._id}/submit`)).send(
      {}
    );
    return Application.findById(bid._id);
  };

  /*
    Moves a submitted bid into review, which is what a buyer does before
    awarding. The lifecycle refuses 'submitted' straight to 'accepted' so that
    "the bids were evaluated" is recorded rather than assumed.
  */
  const review = (bidId) =>
    as(staff, request(app).patch(`/api/applications/${bidId}/status`)).send({
      status: 'under_review'
    });

  test('the winner is accepted and every other bid is closed in the same act', async () => {
    const winner = await bidOn(invited, 'We will do it in eight weeks.');
    const loser = await bidOn(outsider, 'We will do it in ten weeks.');
    await review(winner._id);

    const res = await as(
      staff,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${winner._id}`)
    );

    expect(res.status).toBe(200);
    expect(res.body.data.closed).toBe(1);

    expect((await Application.findById(winner._id)).status).toBe('accepted');
    // Nobody is left believing they are still in a competition that is over.
    expect((await Application.findById(loser._id)).status).toBe('rejected');

    const tender = await Tender.findById(publicTender._id);
    expect(tender.status).toBe('awarded');
    expect(String(tender.awardedBid)).toBe(String(winner._id));
    expect(tender.awardedAt).toBeTruthy();
  });

  test('the audit trail records where each bid came from', async () => {
    const winner = await bidOn(invited, 'Our offer.');
    await review(winner._id);
    await as(
      staff,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${winner._id}`)
    );

    const after = await Application.findById(winner._id);
    const last = after.history[after.history.length - 1];
    expect(last.to).toBe('accepted');
    // Not 'accepted' — the state it was in before the award.
    expect(last.from).toBe('under_review');
  });

  test('a tender is not awarded twice', async () => {
    const winner = await bidOn(invited, 'Our offer.');
    const other = await bidOn(outsider, 'Our other offer.');
    await review(winner._id);
    await review(other._id);

    await as(
      staff,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${winner._id}`)
    );
    const again = await as(
      staff,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${other._id}`)
    );

    expect(again.status).toBe(409);
    expect(again.body.message).toMatch(/already been awarded/i);
  });

  test('a draft cannot be awarded — its author never stood behind that price', async () => {
    await as(invited.token, request(app).put(`/api/applications/tender/${publicTender._id}/draft`)).send({
      contactName: 'Contact',
      lineItems: [{ description: 'Works', quantity: 1, unitPrice: 1 }]
    });
    const draft = await Application.findOne({ tenderId: publicTender._id });

    const res = await as(
      staff,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${draft._id}`)
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/never submitted/i);
  });

  test('a bid from another tender cannot be awarded this one', async () => {
    const winner = await bidOn(invited, 'Our offer.');
    await review(winner._id);

    const res = await as(
      staff,
      request(app).post(`/api/applications/tender/${closedTender._id}/award/${winner._id}`)
    );

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not on this tender/i);
  });

  test('a bid that was never reviewed cannot be awarded', async () => {
    const winner = await bidOn(invited, 'Our offer.');

    const res = await as(
      staff,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${winner._id}`)
    );

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/into review/i);
    // The tender is untouched, not half-awarded.
    expect((await Tender.findById(publicTender._id)).status).toBe('open');
  });

  test('a bidder cannot award the tender to themselves', async () => {
    const winner = await bidOn(invited, 'Our offer.');
    await review(winner._id);

    const res = await as(
      invited.token,
      request(app).post(`/api/applications/tender/${publicTender._id}/award/${winner._id}`)
    );

    expect(res.status).toBe(403);
    expect((await Application.findById(winner._id)).status).toBe('under_review');
  });
});
