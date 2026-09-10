const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const os = require('os');

process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';

// Point uploads at a scratch directory before anything reads the setting, so a
// test run never writes into the real upload folder.
const TMP_UPLOADS = fs.mkdtempSync(path.join(os.tmpdir(), 'istidamah-docs-'));
process.env.UPLOAD_DIR = TMP_UPLOADS;

const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/server');
const User = require('../src/models/User');
const Company = require('../src/models/Company');
const { slotsFor, requiredSlotsFor, magicMatches, typeFromMime } = require('../src/config/documents');
const { UPLOAD_ROOT } = require('../src/middleware/upload');

/** Smallest byte sequences that carry a valid signature for each type. */
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(64, 0x20)]);
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(64, 0)
]);

let mongo;
const token = (user) => jwt.sign({ id: user._id.toString() }, process.env.JWT_SECRET);

const makeUser = (over = {}) =>
  User.create({
    name: 'Test User',
    email: `u${Math.random().toString(36).slice(2)}@example.com`,
    password: 'secret123',
    ...over
  });

const makeCompany = (owner, over = {}) =>
  Company.create({
    companyName: 'Test Co',
    crNumber: String(Math.floor(1000000 + Math.random() * 8999999)),
    governorate: 'Muscat',
    employeeCount: 10,
    omaniEmployeeCount: 5,
    location: { lat: 23.6, lng: 58.5 },
    owner: owner._id,
    ...over
  });

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 180000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
  fs.rmSync(TMP_UPLOADS, { recursive: true, force: true });
});

afterEach(async () => {
  await Promise.all([User.deleteMany({}), Company.deleteMany({})]);
});

/* ------------------------------------------------------------- catalogue */

describe('Document catalogue', () => {
  test('each registration type gets its own slot set', () => {
    const merchant = slotsFor('merchant');
    const organization = slotsFor('organization');

    expect(merchant).toEqual(expect.arrayContaining(['cr', 'chamber', 'tax', 'riyada']));
    expect(merchant).not.toContain('boardResolution');

    expect(organization).toEqual(expect.arrayContaining(['cr', 'registrationProof']));
    expect(organization).not.toContain('chamber');

    // Shared slots really are shared, not duplicated per type.
    for (const shared of ['logo', 'other']) {
      expect(merchant).toContain(shared);
      expect(organization).toContain(shared);
    }
  });

  test('required sets differ by type', () => {
    expect(requiredSlotsFor('merchant').sort()).toEqual(['chamber', 'cr']);
    expect(requiredSlotsFor('organization').sort()).toEqual(['cr', 'registrationProof']);
  });

  test('signature check accepts a real header and rejects a renamed file', () => {
    expect(magicMatches('pdf', PDF)).toBe(true);
    expect(magicMatches('png', PNG)).toBe(true);

    // An HTML document sent as application/pdf — the case the check exists for.
    const html = Buffer.from('<!doctype html><script>alert(1)</script>');
    expect(magicMatches('pdf', html)).toBe(false);
    // A PDF is not a PNG just because the slot would accept one.
    expect(magicMatches('png', PDF)).toBe(false);
  });

  test('mime aliases resolve, unknown types do not', () => {
    expect(typeFromMime('image/jpg')).toBe('jpg');
    expect(typeFromMime('IMAGE/PNG')).toBe('png');
    expect(typeFromMime('application/x-pdf')).toBe('pdf');
    expect(typeFromMime('application/zip')).toBeNull();
    expect(typeFromMime(undefined)).toBeNull();
  });
});

/* ---------------------------------------------------------- completeness */

describe('Completeness is derived, not stored', () => {
  test('a merchant is incomplete until both mandatory slots are filled', async () => {
    const owner = await makeUser({ role: 'merchant' });
    const company = await makeCompany(owner, { entityType: 'merchant' });

    expect(company.documentsComplete).toBe(false);
    expect(company.missingDocuments.sort()).toEqual(['chamber', 'cr']);

    company.documents.push({
      slot: 'cr',
      storedName: 'x.pdf',
      originalName: 'cr.pdf',
      mimeType: 'application/pdf',
      size: 10
    });
    expect(company.missingDocuments).toEqual(['chamber']);

    company.documents.push({
      slot: 'chamber',
      storedName: 'y.pdf',
      originalName: 'ch.pdf',
      mimeType: 'application/pdf',
      size: 10
    });
    expect(company.documentsComplete).toBe(true);
  });

  test('the same files leave an organisation incomplete — it needs different ones', async () => {
    const owner = await makeUser();
    const company = await makeCompany(owner, { entityType: 'organization' });
    company.documents.push({
      slot: 'cr',
      storedName: 'x.pdf',
      originalName: 'cr.pdf',
      mimeType: 'application/pdf',
      size: 10
    });
    expect(company.missingDocuments).toEqual(['registrationProof']);
  });
});

/* --------------------------------------------------------------- access */

describe('Document routes reject anonymous callers', () => {
  const id = '507f1f77bcf86cd799439011';
  const ROUTES = [
    ['get', `/api/companies/${id}/documents`],
    ['post', `/api/companies/${id}/documents/cr`],
    ['get', `/api/companies/${id}/documents/cr/file`],
    ['delete', `/api/companies/${id}/documents/cr`]
  ];

  test('no token is a 401', async () => {
    for (const [method, url] of ROUTES) {
      const res = await request(app)[method](url);
      expect(res.status).toBe(401);
    }
  });

  test('a forged token is a 401', async () => {
    for (const [method, url] of ROUTES) {
      const res = await request(app)[method](url).set('Authorization', 'Bearer junk');
      expect(res.status).toBe(401);
    }
  });
});

describe('Authorisation is per company, not merely per session', () => {
  test("a signed-in stranger cannot read another company's documents", async () => {
    const owner = await makeUser();
    const stranger = await makeUser();
    const company = await makeCompany(owner);

    const res = await request(app)
      .get(`/api/companies/${company._id}/documents`)
      .set('Authorization', `Bearer ${token(stranger)}`);

    expect(res.status).toBe(403);
  });

  test('the owner can read their own', async () => {
    const owner = await makeUser();
    const company = await makeCompany(owner);

    const res = await request(app)
      .get(`/api/companies/${company._id}/documents`)
      .set('Authorization', `Bearer ${token(owner)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.complete).toBe(false);
  });

  test('an auditor may read but may not write', async () => {
    const owner = await makeUser();
    const auditor = await makeUser({ role: 'auditor' });
    const company = await makeCompany(owner);

    const read = await request(app)
      .get(`/api/companies/${company._id}/documents`)
      .set('Authorization', `Bearer ${token(auditor)}`);
    expect(read.status).toBe(200);

    const write = await request(app)
      .post(`/api/companies/${company._id}/documents/cr`)
      .set('Authorization', `Bearer ${token(auditor)}`)
      .attach('file', PDF, { filename: 'cr.pdf', contentType: 'application/pdf' });
    expect(write.status).toBe(403);
  });

  test('an admin may write', async () => {
    const owner = await makeUser();
    const admin = await makeUser({ role: 'admin' });
    const company = await makeCompany(owner);

    const res = await request(app)
      .post(`/api/companies/${company._id}/documents/cr`)
      .set('Authorization', `Bearer ${token(admin)}`)
      .attach('file', PDF, { filename: 'cr.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
  });
});

/* --------------------------------------------------------------- upload */

describe('Uploading', () => {
  let owner;
  let company;
  let auth;

  beforeEach(async () => {
    owner = await makeUser({ role: 'merchant' });
    company = await makeCompany(owner, { entityType: 'merchant' });
    auth = `Bearer ${token(owner)}`;
  });

  const post = (slot, buf, opts) =>
    request(app)
      .post(`/api/companies/${company._id}/documents/${slot}`)
      .set('Authorization', auth)
      .attach('file', buf, opts);

  test('a valid PDF lands in the slot and clears it from the missing list', async () => {
    const res = await post('cr', PDF, { filename: 'my cr.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(201);
    expect(res.body.data.slot).toBe('cr');
    expect(res.body.data.missing).toEqual(['chamber']);
    expect(res.body.data.complete).toBe(false);

    const saved = await Company.findById(company._id);
    const doc = saved.documents.find((d) => d.slot === 'cr');
    // The stored name is generated; the caller's name survives only for display.
    expect(doc.originalName).toBe('my cr.pdf');
    expect(doc.storedName).not.toBe('my cr.pdf');
    expect(doc.storedName).toMatch(/^\d+-[0-9a-f]{32}\.pdf$/);
    expect(fs.existsSync(path.join(UPLOAD_ROOT, doc.storedName))).toBe(true);
  });

  test('a file renamed to beat the type check is refused, and nothing is written', async () => {
    const before = fs.existsSync(UPLOAD_ROOT) ? fs.readdirSync(UPLOAD_ROOT).length : 0;

    const html = Buffer.from('<!doctype html><script>alert(1)</script>');
    const res = await post('cr', html, { filename: 'cr.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/do not match/i);

    const after = fs.existsSync(UPLOAD_ROOT) ? fs.readdirSync(UPLOAD_ROOT).length : 0;
    expect(after).toBe(before);
  });

  test('a type the slot does not accept is refused', async () => {
    // `cr` takes PDF only, so a genuine PNG is still wrong here.
    const res = await post('cr', PNG, { filename: 'cr.png', contentType: 'image/png' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must be one of/i);
  });

  test('a slot belonging to the other registration type is refused', async () => {
    const res = await post('boardResolution', PDF, {
      filename: 'board.pdf',
      contentType: 'application/pdf'
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/does not apply/i);
  });

  test('an unknown slot is refused', async () => {
    const res = await post('notaslot', PDF, {
      filename: 'x.pdf',
      contentType: 'application/pdf'
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/unknown document slot/i);
  });

  test('a traversal attempt in the slot never reaches the handler', async () => {
    // Express normalises the path before routing, so this does not match the
    // route at all. Asserted so the guarantee is a test rather than a habit.
    const res = await post('../../etc/passwd', PDF, {
      filename: 'x.pdf',
      contentType: 'application/pdf'
    });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);

    const files = fs.existsSync(UPLOAD_ROOT) ? fs.readdirSync(UPLOAD_ROOT) : [];
    expect(files.every((f) => /^\d+-[0-9a-f]{32}\.(pdf|jpg|png)$/.test(f))).toBe(true);
  });

  test('re-uploading replaces the file and deletes the one it replaced', async () => {
    const first = await post('cr', PDF, { filename: 'one.pdf', contentType: 'application/pdf' });
    expect(first.status).toBe(201);
    const oldName = (await Company.findById(company._id)).documents.find((d) => d.slot === 'cr')
      .storedName;

    const second = await post('cr', PDF, { filename: 'two.pdf', contentType: 'application/pdf' });
    expect(second.status).toBe(201);

    const saved = await Company.findById(company._id);
    const slots = saved.documents.filter((d) => d.slot === 'cr');
    expect(slots).toHaveLength(1);
    expect(slots[0].originalName).toBe('two.pdf');
    expect(fs.existsSync(path.join(UPLOAD_ROOT, oldName))).toBe(false);
  });
});

/* ------------------------------------------------------ download/delete */

describe('Reading and removing', () => {
  let owner;
  let company;

  beforeEach(async () => {
    owner = await makeUser({ role: 'merchant' });
    company = await makeCompany(owner, { entityType: 'merchant' });
    await request(app)
      .post(`/api/companies/${company._id}/documents/cr`)
      .set('Authorization', `Bearer ${token(owner)}`)
      .attach('file', PDF, { filename: 'cr.pdf', contentType: 'application/pdf' });
  });

  test('the owner gets the bytes back, as an attachment', async () => {
    const res = await request(app)
      .get(`/api/companies/${company._id}/documents/cr/file`)
      .set('Authorization', `Bearer ${token(owner)}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(/^attachment/);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.body.subarray(0, 4).toString()).toBe('%PDF');
  });

  test('a stranger cannot download it', async () => {
    const stranger = await makeUser();
    const res = await request(app)
      .get(`/api/companies/${company._id}/documents/cr/file`)
      .set('Authorization', `Bearer ${token(stranger)}`);
    expect(res.status).toBe(403);
  });

  test('deleting clears the slot and removes the file', async () => {
    const saved = await Company.findById(company._id);
    const storedName = saved.documents.find((d) => d.slot === 'cr').storedName;

    const res = await request(app)
      .delete(`/api/companies/${company._id}/documents/cr`)
      .set('Authorization', `Bearer ${token(owner)}`);

    expect(res.status).toBe(200);
    expect(res.body.data.missing).toEqual(expect.arrayContaining(['cr']));
    expect(fs.existsSync(path.join(UPLOAD_ROOT, storedName))).toBe(false);
    expect((await Company.findById(company._id)).documents).toHaveLength(0);
  });

  test('an empty slot is a 404, not a 500', async () => {
    const res = await request(app)
      .get(`/api/companies/${company._id}/documents/tax/file`)
      .set('Authorization', `Bearer ${token(owner)}`);
    expect(res.status).toBe(404);
  });
});
