const request = require('supertest');
const mongoose = require('mongoose');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const Notification = require('../src/models/Notification');

let mongo;
let applicant;
let other;
let staff;

const as = (token, req) => req.set('Authorization', `Bearer ${token}`);

let crSeq = 0;

const account = async (email, role = 'merchant') => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Person', email, password: 'Str0ngPass!23', role });
  return { token: res.body.token, user: res.body.data };
};

const registration = async (ownerId, overrides = {}) => {
  crSeq += 1;
  return Company.create({
    companyName: 'Al Nahda Trading',
    companyNameAr: 'النهضة للتجارة',
    crNumber: String(3000000 + crSeq),
    governorate: 'Muscat',
    employeeCount: 5,
    omaniEmployeeCount: 3,
    location: { lat: 23.58, lng: 58.38 },
    entityType: 'merchant',
    owner: ownerId,
    ...overrides
  });
};

const expiredDoc = (days) => ({
  slot: 'cr',
  storedName: 'a.pdf',
  originalName: 'cr.pdf',
  mimeType: 'application/pdf',
  size: 1024,
  expiryDate: new Date(Date.now() - days * 864e5)
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
  await Promise.all([Company.deleteMany(), User.deleteMany(), Notification.deleteMany()]);

  applicant = await account('applicant@example.om');
  other = await account('other@example.om');

  const admin = await account('staff@example.om');
  await User.findByIdAndUpdate(admin.user._id, { role: 'admin' });
  staff = (
    await request(app)
      .post('/api/auth/login')
      .send({ identifier: 'staff@example.om', password: 'Str0ngPass!23' })
  ).body.token;
});

/**
 * A registration decision is the moment somebody learns whether they may
 * trade. These cover that it reaches them, that it says when, that it says
 * why when it is a refusal, and that it reaches nobody else.
 */
describe('Telling an applicant what was decided', () => {
  test('an approval reaches the applicant, with the moment it was made', async () => {
    const company = await registration(applicant.user._id);
    const before = Date.now();

    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/approve`));

    const res = await as(applicant.token, request(app).get('/api/notifications'));
    expect(res.status).toBe(200);
    expect(res.body.unreadCount).toBe(1);

    const notice = res.body.data[0];
    expect(notice.kind).toBe('registration_approved');
    // The date and time the decision was made, carried on the notice itself.
    expect(new Date(notice.createdAt).getTime()).toBeGreaterThanOrEqual(before);
    expect(notice.isRead).toBe(false);
  });

  test('the notice is written in both languages', async () => {
    const company = await registration(applicant.user._id);
    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/approve`));

    const notice = (await as(applicant.token, request(app).get('/api/notifications'))).body.data[0];

    expect(notice.titleAr).toBeTruthy();
    expect(notice.bodyAr).toBeTruthy();
    expect(notice.titleAr).not.toBe(notice.title);
    // The Arabic body names the company by its Arabic name.
    expect(notice.bodyAr).toContain('النهضة للتجارة');
  });

  test('a rejection carries the reason, so the applicant need not go and ask', async () => {
    const company = await registration(applicant.user._id);

    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/reject`)).send({
      reason: 'The commercial registration has expired.'
    });

    const notice = (await as(applicant.token, request(app).get('/api/notifications'))).body.data[0];
    expect(notice.kind).toBe('registration_rejected');
    expect(notice.body).toContain('The commercial registration has expired.');
    expect(notice.bodyAr).toContain('The commercial registration has expired.');
  });

  test('a notice reaches its owner and nobody else', async () => {
    const company = await registration(applicant.user._id);
    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/approve`));

    const theirs = await as(other.token, request(app).get('/api/notifications'));
    expect(theirs.body.data).toHaveLength(0);
    expect(theirs.body.unreadCount).toBe(0);
  });

  test('a notification can be marked read, and only by its owner', async () => {
    const company = await registration(applicant.user._id);
    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/approve`));
    const notice = (await as(applicant.token, request(app).get('/api/notifications'))).body.data[0];

    // Somebody else's id must not even confirm the notice exists.
    const theirs = await as(other.token, request(app).patch(`/api/notifications/${notice._id}/read`));
    expect(theirs.status).toBe(404);

    const mine = await as(applicant.token, request(app).patch(`/api/notifications/${notice._id}/read`));
    expect(mine.status).toBe(200);
    expect(mine.body.data.readAt).toBeTruthy();

    const after = await as(applicant.token, request(app).get('/api/notifications'));
    expect(after.body.unreadCount).toBe(0);
  });

  test('the unread filter returns only what has not been seen', async () => {
    const company = await registration(applicant.user._id);
    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/review`));
    await as(staff, request(app).patch(`/api/admin/registrations/${company._id}/approve`));

    const all = await as(applicant.token, request(app).get('/api/notifications'));
    expect(all.body.data).toHaveLength(2);

    await as(applicant.token, request(app).patch('/api/notifications/read-all'));

    const unread = await as(applicant.token, request(app).get('/api/notifications?unread=true'));
    expect(unread.body.data).toHaveLength(0);
    expect(unread.body.unreadCount).toBe(0);
  });

  test('reading notifications requires a session', async () => {
    const res = await request(app).get('/api/notifications');
    expect(res.status).toBe(401);
  });
});

/**
 * A reviewer approving a company whose commercial registration lapsed last
 * month admits an entity that, on paper, no longer trades. So the queue has to
 * show it.
 */
describe('Documents that have expired', () => {
  test('the reviewer sees which documents have lapsed, and which are about to', async () => {
    await registration(applicant.user._id, {
      documents: [
        expiredDoc(10),
        {
          slot: 'riyada',
          storedName: 'b.pdf',
          originalName: 'riyada.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          expiryDate: new Date(Date.now() + 10 * 864e5)
        },
        {
          slot: 'logo',
          storedName: 'c.png',
          originalName: 'logo.png',
          mimeType: 'image/png',
          size: 512
        }
      ]
    });

    const res = await as(staff, request(app).get('/api/admin/registrations'));
    const row = res.body.data[0];

    expect(row.expiredDocuments.map((d) => d.slot)).toEqual(['cr']);
    expect(row.expiringDocuments.map((d) => d.slot)).toEqual(['riyada']);
    // A logo does not expire, so it is in neither list.
    expect(row.documentsCurrent).toBe(false);
  });

  test('a record with nothing lapsed reads as current', async () => {
    await registration(applicant.user._id, { documents: [] });

    const res = await as(staff, request(app).get('/api/admin/registrations'));
    expect(res.body.data[0].documentsCurrent).toBe(true);
    expect(res.body.data[0].expiredDocuments).toHaveLength(0);
  });

  test('the reviewer can tell the applicant what has lapsed, by name', async () => {
    const company = await registration(applicant.user._id, { documents: [expiredDoc(10)] });

    const res = await as(
      staff,
      request(app).post(`/api/admin/registrations/${company._id}/notify-expiry`)
    );
    expect(res.status).toBe(200);

    const notice = (await as(applicant.token, request(app).get('/api/notifications'))).body.data[0];
    expect(notice.kind).toBe('document_expired');
    // Named, not "a document" — the applicant has to know which one to replace.
    expect(notice.body).toContain('Commercial Registration');
    expect(notice.bodyAr).toContain('السجل التجاري');
  });

  test('no notice is sent when nothing has actually lapsed', async () => {
    const company = await registration(applicant.user._id, { documents: [] });

    const res = await as(
      staff,
      request(app).post(`/api/admin/registrations/${company._id}/notify-expiry`)
    );

    expect(res.status).toBe(409);
    expect(await Notification.countDocuments()).toBe(0);
  });

  test('the expiry notice is built from the record now, not from the request', async () => {
    const company = await registration(applicant.user._id, { documents: [expiredDoc(10)] });

    // A reviewer cannot name documents of their own choosing.
    const res = await as(
      staff,
      request(app).post(`/api/admin/registrations/${company._id}/notify-expiry`)
    ).send({ expired: [{ slot: 'freelancePermit' }] });

    expect(res.body.data.expired.map((d) => d.slot)).toEqual(['cr']);
  });

  test('only staff may send one', async () => {
    const company = await registration(applicant.user._id, { documents: [expiredDoc(10)] });

    const res = await as(
      applicant.token,
      request(app).post(`/api/admin/registrations/${company._id}/notify-expiry`)
    );

    expect([401, 403]).toContain(res.status);
    expect(await Notification.countDocuments()).toBe(0);
  });
});
