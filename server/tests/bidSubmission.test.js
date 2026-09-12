const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../src/server');
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const { Tender } = require('../src/models/Content');
const Company = require('../src/models/Company');

let mongo;
let token;
let tenderId;

const auth = (req) => req.set('Authorization', `Bearer ${token}`);

/**
 * An approved registration, because bidding now requires one.
 *
 * The gate is the point of reviewing a registration at all: an unchecked party
 * does not take part in a procurement. These suites are about what happens
 * after that check, so they satisfy it up front rather than re-testing it —
 * registrationReview.test.js owns the gate itself.
 */
const approveBidder = (ownerId, crNumber = '1234567') =>
  Company.create({
    companyName: 'Bidder Trading',
    crNumber,
    governorate: 'Muscat',
    employeeCount: 5,
    omaniEmployeeCount: 3,
    location: { lat: 23.58, lng: 58.38 },
    entityType: 'merchant',
    owner: ownerId,
    registrationStatus: 'approved'
  });

const makeTender = (overrides = {}) =>
  Tender.create({
    refNo: Math.floor(Math.random() * 1e6),
    title: 'Fit-out works',
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
    Application.deleteMany(),
    Tender.deleteMany(),
    User.deleteMany(),
    Company.deleteMany()
  ]);

  const res = await request(app).post('/api/auth/register').send({
    name: 'Salim Al Harthy',
    email: 'bidder@example.om',
    password: 'Str0ngPass!23',
    role: 'merchant'
  });
  token = res.body.token || res.body.data?.token;
  await approveBidder(res.body.data._id);

  const tender = await makeTender();
  tenderId = tender._id.toString();
});

const LINES = [
  { description: 'Supply and install', unit: 'm2', quantity: 120, unitPrice: 12.5 },
  { description: 'Site preparation', unit: 'lot', quantity: 1, unitPrice: 400 }
];

/**
 * A bid is a financial commitment against a deadline. These cover the three
 * ways that goes wrong: money the client decides, a deadline nothing enforces,
 * and a submitted bid quietly edited afterwards.
 */
describe('Bidding on a tender', () => {
  test('a draft saves without a summary, so a half-finished bid is not lost', async () => {
    const res = await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      lineItems: LINES
    });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.proposalSummary).toBe('');
  });

  test('the server prices the bid; the client cannot name its own fee', async () => {
    const res = await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      lineItems: LINES,
      // All of these are ignored: they are outputs, not inputs.
      subtotalBaisa: 1,
      platformFeeBaisa: 0,
      platformFeeRate: 0,
      netToBidderBaisa: 99999999
    });

    const bid = res.body.data;
    // 120 x 12.500 = 1500.000, plus 400.000 = 1900.000
    expect(bid.subtotal).toBe(1900);
    expect(bid.vatAmount).toBe(95); // 5%
    expect(bid.total).toBe(1995);
    expect(bid.platformFeeRate).toBe(5);
    expect(bid.platformFee).toBe(95); // 5% of 1900, not of 1995
    expect(bid.netToBidder).toBe(1900);
  });

  test('submitting is refused while the bid is incomplete, and says what is missing', async () => {
    await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      lineItems: LINES
    });

    const res = await auth(request(app).post(`/api/applications/tender/${tenderId}/submit`)).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/proposalSummary/);
    expect(res.body.message).toMatch(/technicalDocument/);
  });

  test('a bid claiming an exception must say what it is', async () => {
    const res = await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      lineItems: LINES,
      hasExceptions: true,
      exceptionsNote: '   '
    });
    expect(res.status).toBe(400);
  });

  test('clearing the exception flag clears the reason with it', async () => {
    await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      hasExceptions: true,
      exceptionsNote: 'Delivery in 90 days, not 60'
    });

    const res = await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      hasExceptions: false
    });
    expect(res.body.data.hasExceptions).toBe(false);
    expect(res.body.data.exceptionsNote).toBe('');
  });

  test('a closed tender takes no bid, however long the form was open', async () => {
    const closed = await makeTender({ status: 'closed' });
    const res = await auth(
      request(app).put(`/api/applications/tender/${closed._id}/draft`)
    ).send({ lineItems: LINES });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no longer accepting/i);
  });

  test('nor does one whose closing date has passed', async () => {
    const expired = await makeTender({ closingDate: new Date(Date.now() - 864e5) });
    const res = await auth(
      request(app).post(`/api/applications/tender/${expired._id}/submit`)
    ).send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/closing date/i);
  });

  test('a submitted bid cannot be edited in place', async () => {
    await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      proposalSummary: 'We will deliver the fit-out in eight weeks with a local crew.',
      lineItems: LINES
    });

    // Give it the technical file the submit requires.
    const bid = await Application.findOne({ tenderId });
    bid.documents.push({
      slot: 'technical',
      storedName: 'x.pdf',
      originalName: 'technical.pdf',
      mimeType: 'application/pdf',
      size: 1024
    });
    await bid.save();

    const submitted = await auth(
      request(app).post(`/api/applications/tender/${tenderId}/submit`)
    ).send({});
    expect(submitted.status).toBe(200);
    expect(submitted.body.data.status).toBe('submitted');
    expect(submitted.body.data.submittedAt).toBeTruthy();

    // The buyer may already be reading it; changing it silently is not an option.
    const edit = await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      lineItems: [{ description: 'Cheaper', quantity: 1, unitPrice: 1 }]
    });
    expect(edit.status).toBe(409);

    const again = await auth(
      request(app).post(`/api/applications/tender/${tenderId}/submit`)
    ).send({});
    expect(again.status).toBe(409);
  });

  test('the bidder can read back their own draft', async () => {
    await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      contactName: 'Salim',
      contactEmail: 'bidder@example.om',
      lineItems: LINES,
      validityDays: 45
    });

    const res = await auth(request(app).get(`/api/applications/tender/${tenderId}/mine`));
    expect(res.status).toBe(200);
    expect(res.body.data.validityDays).toBe(45);
    expect(res.body.data.lineItems).toHaveLength(2);
  });

  test('and gets null rather than an error before there is one', async () => {
    const res = await auth(request(app).get(`/api/applications/tender/${tenderId}/mine`));
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  test('bidding requires a session', async () => {
    const res = await request(app)
      .put(`/api/applications/tender/${tenderId}/draft`)
      .send({ lineItems: LINES });
    expect(res.status).toBe(401);
  });

  test('a new bid starts from the buyer’s bill of quantities, unpriced', async () => {
    const scoped = await makeTender({
      scopeItems: [
        { description: 'Excavation', unit: 'm3', quantity: 40 },
        { description: 'Backfill', unit: 'm3', quantity: 25 }
      ]
    });

    const res = await auth(request(app).put(`/api/applications/tender/${scoped._id}/draft`)).send({
      contactName: 'Salim'
    });

    const lines = res.body.data.lineItems;
    expect(lines).toHaveLength(2);
    expect(lines[0].description).toBe('Excavation');
    expect(lines[0].quantity).toBe(40);
    // The buyer sets the scope; only the rates are the bidder's to give.
    expect(res.body.data.subtotal).toBe(0);
  });

  test('a scoring scheme that does not add up to 100 is refused', async () => {
    await expect(
      makeTender({
        evaluationCriteria: [
          { label: 'Price', weight: 60 },
          { label: 'Technical', weight: 25 }
        ]
      })
    ).rejects.toThrow(/add up to 100/);

    // and a complete one is accepted
    const ok = await makeTender({
      evaluationCriteria: [
        { label: 'Price', weight: 60 },
        { label: 'Technical', weight: 30 },
        { label: 'Local content', weight: 10 }
      ]
    });
    expect(ok.evaluationCriteria).toHaveLength(3);
  });

  test('a validity outside 1–365 days is refused', async () => {
    const res = await auth(request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
      validityDays: 400
    });
    expect(res.status).toBe(400);
  });
});
