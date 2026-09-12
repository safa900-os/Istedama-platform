const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

// Uploads go to a scratch directory, set before anything reads the setting.
const TMP_UPLOADS = fs.mkdtempSync(path.join(os.tmpdir(), 'istidamah-bids-'));
process.env.UPLOAD_DIR = TMP_UPLOADS;

const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const { Tender } = require('../src/models/Content');
const { rootFor } = require('../src/middleware/upload');

const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64, 0x20)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 0)
]);

let mongo;
let tenderId;
let mine;
let rival;

/** Registers an account and returns its token. */
const signUp = async (email) => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Bidder', email, password: 'Str0ngPass!23', role: 'merchant' });
  return res.body.token;
};

const asUser = (token, req) => req.set('Authorization', `Bearer ${token}`);

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  fs.rmSync(TMP_UPLOADS, { recursive: true, force: true });
});

beforeEach(async () => {
  await Promise.all([Application.deleteMany(), Tender.deleteMany(), User.deleteMany()]);

  mine = await signUp('bidder@example.om');
  rival = await signUp('rival@example.om');

  const tender = await Tender.create({
    refNo: Math.floor(Math.random() * 1e6),
    title: 'Fit-out works',
    orgName: 'Buyer LLC',
    closingDate: new Date(Date.now() + 7 * 864e5),
    status: 'open'
  });
  tenderId = tender._id.toString();

  // A draft to attach files to.
  await asUser(mine, request(app).put(`/api/applications/tender/${tenderId}/draft`)).send({
    contactName: 'Salim'
  });
});

const upload = (token, slot, buffer, name) =>
  asUser(token, request(app).post(`/api/applications/tender/${tenderId}/documents/${slot}`)).attach(
    'file',
    buffer,
    name
  );

/**
 * A bid's files are the supplier's prices and method. The tests that matter are
 * about who may read them, and when they stop being editable.
 */
describe('Bid documents', () => {
  test('a technical proposal attaches to the draft', async () => {
    const res = await upload(mine, 'technical', PDF, 'technical.pdf');

    expect(res.status).toBe(201);
    const docs = res.body.data.documents;
    expect(docs).toHaveLength(1);
    expect(docs[0].slot).toBe('technical');
    expect(docs[0].originalName).toBe('technical.pdf');
    // Filed under bids, not among company paperwork.
    expect(fs.existsSync(path.join(rootFor('bids'), docs[0].storedName))).toBe(true);
    expect(fs.existsSync(path.join(rootFor('companies'), docs[0].storedName))).toBe(false);
  });

  test('the binding documents are PDF only, so what is opened is what was sent', async () => {
    const res = await upload(mine, 'commercial', PNG, 'prices.png');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/pdf/i);

    // An image is still fine as a supporting attachment.
    expect((await upload(mine, 'other', PNG, 'site.png')).status).toBe(201);
  });

  test('re-uploading replaces, so the buyer never has two to choose between', async () => {
    const first = await upload(mine, 'technical', PDF, 'v1.pdf');
    const oldName = first.body.data.documents[0].storedName;

    const second = await upload(mine, 'technical', PDF, 'v2.pdf');
    const docs = second.body.data.documents;

    expect(docs).toHaveLength(1);
    expect(docs[0].originalName).toBe('v2.pdf');
    // The superseded file is gone from disk, not merely unlinked from the record.
    expect(fs.existsSync(path.join(rootFor('bids'), oldName))).toBe(false);
  });

  test('supporting attachments accumulate rather than replace each other', async () => {
    await upload(mine, 'other', PDF, 'a.pdf');
    const res = await upload(mine, 'other', PDF, 'b.pdf');
    expect(res.body.data.documents).toHaveLength(2);
  });

  test('a rival bidder cannot read the prices on my bid', async () => {
    const up = await upload(mine, 'commercial', PDF, 'prices.pdf');
    const docId = up.body.data.documents[0]._id;

    const theirs = await asUser(
      rival,
      request(app).get(`/api/applications/tender/${tenderId}/documents/${docId}`)
    );
    expect(theirs.status).toBe(403);

    const ours = await asUser(
      mine,
      request(app).get(`/api/applications/tender/${tenderId}/documents/${docId}`)
    );
    expect(ours.status).toBe(200);
  });

  test('a rival cannot attach a file to my bid either', async () => {
    // The rival has no bid of their own on this tender, so there is nothing to
    // attach to — and certainly not mine.
    const res = await upload(rival, 'technical', PDF, 'theirs.pdf');
    expect(res.status).toBe(404);

    const bid = await Application.findOne({ tenderId }).sort({ createdAt: 1 });
    expect(bid.documents).toHaveLength(0);
  });

  test('files cannot be added or removed once the bid is submitted', async () => {
    const up = await upload(mine, 'technical', PDF, 'technical.pdf');
    const docId = up.body.data.documents[0]._id;

    const submitted = await asUser(
      mine,
      request(app).post(`/api/applications/tender/${tenderId}/submit`)
    ).send({
      contactEmail: 'bidder@example.om',
      proposalSummary: 'Eight weeks, local crew.',
      lineItems: [{ description: 'Works', quantity: 1, unitPrice: 100 }]
    });
    expect(submitted.status).toBe(200);

    expect((await upload(mine, 'other', PDF, 'late.pdf')).status).toBe(409);

    const del = await asUser(
      mine,
      request(app).delete(`/api/applications/tender/${tenderId}/documents/${docId}`)
    );
    expect(del.status).toBe(409);

    // and it is still readable afterwards
    const read = await asUser(
      mine,
      request(app).get(`/api/applications/tender/${tenderId}/documents/${docId}`)
    );
    expect(read.status).toBe(200);
  });

  test('deleting a draft attachment removes the file from disk as well', async () => {
    const up = await upload(mine, 'other', PDF, 'draft-note.pdf');
    const { _id: docId, storedName } = up.body.data.documents[0];

    const res = await asUser(
      mine,
      request(app).delete(`/api/applications/tender/${tenderId}/documents/${docId}`)
    );
    expect(res.status).toBe(200);
    expect(res.body.data.documents).toHaveLength(0);
    expect(fs.existsSync(path.join(rootFor('bids'), storedName))).toBe(false);
  });

  test('an unknown slot is refused before anything is written', async () => {
    const count = () => (fs.existsSync(rootFor('bids')) ? fs.readdirSync(rootFor('bids')).length : 0);
    const before = count();

    const res = await upload(mine, 'financials', PDF, 'x.pdf');

    expect(res.status).toBe(400);
    // The rejection happens in the filter, so the buffer never reaches disk.
    expect(count()).toBe(before);
  });

  test('attaching requires a session', async () => {
    const res = await request(app)
      .post(`/api/applications/tender/${tenderId}/documents/technical`)
      .attach('file', PDF, 'x.pdf');
    expect(res.status).toBe(401);
  });
});
