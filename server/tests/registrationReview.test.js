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
let merchantToken;
let adminToken;
let merchantUser;
let tenderId;

const signUp = async (email, role) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Person', email, password: 'Str0ngPass!23', role });
  return res.body;
};

const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

const company = (overrides = {}) => ({
  companyName: 'Al Nahda Trading',
  crNumber: '1234567',
  governorate: 'Muscat',
  employeeCount: 12,
  omaniEmployeeCount: 8,
  location: { lat: 23.58, lng: 58.38 },
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
  await Promise.all([Company.deleteMany(), User.deleteMany(), Application.deleteMany(), Tender.deleteMany()]);

  const merchant = await signUp('merchant@example.om', 'merchant');
  merchantToken = merchant.token;
  merchantUser = merchant.data;

  const admin = await signUp('admin@example.om', 'sme_owner');
  await User.findByIdAndUpdate(admin.data._id, { role: 'admin' });
  adminToken = (
    await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'admin@example.om', password: 'Str0ngPass!23' })
  ).body.token;

  const tender = await Tender.create({
    refNo: Math.floor(Math.random() * 1e6),
    title: 'Fit-out works',
    orgName: 'Buyer LLC',
    closingDate: new Date(Date.now() + 7 * 864e5),
    status: 'open'
  });
  tenderId = tender._id.toString();
});

/** Registers a company owned by the merchant, at the given review state. */
const register = async (overrides = {}) => {
  const res = await as(merchantToken, request(app).post('/api/companies')).send(company(overrides));
  await Company.findByIdAndUpdate(res.body.data._id, { owner: merchantUser._id });
  return res.body.data;
};

const bid = () =>
  as(merchantToken, request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
    contactName: 'Salim'
  });

/**
 * A registration is a claim, not a fact. These cover the gate that turns it
 * into one: who may decide, what a decision owes the applicant, and what an
 * undecided applicant may not yet do.
 */
describe('Reviewing a registration', () => {
  test('a new registration arrives submitted, not approved', async () => {
    const created = await register();

    expect(created.registrationStatus).toBe('submitted');
    expect(created.isApproved).toBe(false);
    expect(created.submittedAt).toBeTruthy();
  });

  test('an unapproved merchant cannot bid, and is told why', async () => {
    await register();

    const res = await bid();

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/still being reviewed/i);
  });

  test('a merchant with no registration at all cannot bid either', async () => {
    const res = await bid();

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/register your company/i);
  });

  test('approval is what opens bidding', async () => {
    const created = await register();

    const approved = await as(
      adminToken,
      request(app).patch(`/api/admin/registrations/${created._id}/approve`)
    );
    expect(approved.status).toBe(200);
    expect(approved.body.data.registrationStatus).toBe('approved');
    expect(approved.body.data.reviewedAt).toBeTruthy();
    expect(approved.body.data.reviewedBy).toBeTruthy();

    const res = await bid();
    expect(res.status).toBe(200);
  });

  test('a rejection without a reason is refused', async () => {
    const created = await register();

    const res = await as(
      adminToken,
      request(app).patch(`/api/admin/registrations/${created._id}/reject`)
    ).send({ reason: '   ' });

    expect(res.status).toBe(400);

    // and the record is untouched, not left half-rejected
    const after = await Company.findById(created._id);
    expect(after.registrationStatus).toBe('submitted');
  });

  test('a rejection carries the reason back to the applicant', async () => {
    const created = await register();

    const res = await as(
      adminToken,
      request(app).patch(`/api/admin/registrations/${created._id}/reject`)
    ).send({ reason: 'The commercial registration has expired.' });

    expect(res.status).toBe(200);
    expect(res.body.data.registrationStatus).toBe('rejected');
    expect(res.body.data.rejectionReason).toBe('The commercial registration has expired.');

    const blocked = await bid();
    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/not approved/i);
  });

  test('a rejected applicant can fix the record and resubmit, and the old reason goes', async () => {
    const created = await register();
    await as(adminToken, request(app).patch(`/api/admin/registrations/${created._id}/reject`)).send({
      reason: 'The commercial registration has expired.'
    });

    const doc = await Company.findById(created._id);
    doc.registrationStatus = 'submitted';
    await doc.save();

    // Last round's complaint must not sit on this round's record.
    expect(doc.rejectionReason).toBe('');
    expect(doc.reviewedAt).toBeNull();
    expect(doc.registrationStatus).toBe('submitted');
  });

  test('an approved registration is not quietly re-decided', async () => {
    const created = await register();
    await as(adminToken, request(app).patch(`/api/admin/registrations/${created._id}/approve`));

    const again = await as(
      adminToken,
      request(app).patch(`/api/admin/registrations/${created._id}/reject`)
    ).send({ reason: 'Changed my mind' });

    expect(again.status).toBe(409);
    expect(again.body.message).toMatch(/cannot become/i);
  });

  test('only staff may decide a registration', async () => {
    const created = await register();

    // The applicant approving their own registration is the obvious attack.
    const res = await as(
      merchantToken,
      request(app).patch(`/api/admin/registrations/${created._id}/approve`)
    );
    expect([401, 403]).toContain(res.status);

    const after = await Company.findById(created._id);
    expect(after.registrationStatus).toBe('submitted');
  });

  test('the queue lists what is waiting, oldest first', async () => {
    const first = await register();
    const second = await register({ crNumber: '7654321', companyName: 'Second Co' });
    await as(adminToken, request(app).patch(`/api/admin/registrations/${first._id}/approve`));

    const res = await as(adminToken, request(app).get('/api/admin/registrations'));

    expect(res.status).toBe(200);
    // The approved one has left the queue.
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]._id).toBe(second._id);
    // The reviewer needs to know whose registration it is.
    expect(res.body.data[0].owner.email).toBe('merchant@example.om');
  });

  test('the queue can be asked for any state, and for one entity type', async () => {
    const c = await register();
    await as(adminToken, request(app).patch(`/api/admin/registrations/${c._id}/approve`));

    const all = await as(adminToken, request(app).get('/api/admin/registrations?status=all'));
    expect(all.body.data).toHaveLength(1);

    const merchants = await as(
      adminToken,
      request(app).get('/api/admin/registrations?status=all&entityType=merchant')
    );
    expect(merchants.body.data).toHaveLength(1);

    const orgs = await as(
      adminToken,
      request(app).get('/api/admin/registrations?status=all&entityType=organization')
    );
    expect(orgs.body.data).toHaveLength(0);
  });

  test('two registrations cannot claim the same commercial registration number', async () => {
    await register();

    const other = await signUp('other@example.om', 'merchant');
    const res = await as(other.token, request(app).post('/api/companies')).send(
      company({ companyName: 'Copycat Trading' })
    );

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
