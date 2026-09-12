const asyncHandler = require('express-async-handler');
const fs = require('fs');
const Company = require('../models/Company');
const { DOCUMENT_SLOTS, slotsFor } = require('../config/documents');
const {
  persistDocument,
  resolveStoredPath,
  removeStoredFile,
  MAX_BYTES
} = require('../middleware/upload');

/**
 * Company document attachments.
 *
 * Every route here loads the company and authorises against it before doing
 * anything else. Attachments are commercial registrations, tax cards and
 * insurance certificates: the directory they live in is not served statically,
 * and the download route below is the only way to read one.
 */

/** Who may see or change a company's documents. */
const READ_ROLES = ['admin', 'auditor'];

const loadCompany = async (id, res) => {
  const company = await Company.findById(id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  return company;
};

/**
 * Owners manage their own records; admins and auditors may read any of them,
 * because reviewing submitted documents is the job. Auditors deliberately do
 * not get write access — an auditor replacing evidence they are assessing
 * would defeat the point of the review.
 */
const assertCanRead = (company, user, res) => {
  const isOwner = company.owner && user._id.equals(company.owner);
  if (isOwner || READ_ROLES.includes(user.role)) return;
  res.status(403);
  throw new Error('Not authorized to view these documents');
};

const assertCanWrite = (company, user, res) => {
  const isOwner = company.owner && user._id.equals(company.owner);
  if (isOwner || user.role === 'admin') return;
  res.status(403);
  throw new Error('Not authorized to change these documents');
};

/**
 * The catalogue for a registration type, with nothing company-specific in it.
 *
 * Public on purpose: it is the shape of a form, not anyone's data, and the
 * registration wizard needs it before a company — or a session — exists. The
 * client renders its checklist from this rather than keeping its own copy,
 * so the two cannot disagree about what is required.
 */
// @desc  Document slots that apply to a registration type
// @route GET /api/companies/documents/catalogue?entityType=merchant
const getCatalogue = asyncHandler(async (req, res) => {
  /*
    Three registration types, not two. This read `=== 'merchant' ? merchant :
    organization`, which quietly served a self-employed applicant the
    institution's catalogue — so the form asked a permit holder for documents
    that do not apply to them and never asked for the permit.
  */
  const ENTITY_TYPES = ['merchant', 'organization', 'freelance'];
  const entityType = ENTITY_TYPES.includes(req.query.entityType)
    ? req.query.entityType
    : 'organization';

  const slots = slotsFor(entityType).map((key) => ({
    slot: key,
    label: DOCUMENT_SLOTS[key].label,
    required: DOCUMENT_SLOTS[key].required,
    accept: DOCUMENT_SLOTS[key].accept,
    // Whether this document carries an expiry date, so the form asks for one
    // only where one exists.
    expires: Boolean(DOCUMENT_SLOTS[key].expires)
  }));
  res.json({ success: true, data: { entityType, slots, maxBytes: MAX_BYTES } });
});

/** The catalogue as it applies to one company, with what has been supplied. */
// @desc  List a company's document slots and their current state
// @route GET /api/companies/:id/documents
const listDocuments = asyncHandler(async (req, res) => {
  const company = await loadCompany(req.params.id, res);
  assertCanRead(company, req.user, res);

  const uploaded = new Map((company.documents || []).map((d) => [d.slot, d]));
  const slots = slotsFor(company.entityType).map((key) => {
    const def = DOCUMENT_SLOTS[key];
    const file = uploaded.get(key);
    return {
      slot: key,
      label: def.label,
      required: def.required,
      accept: def.accept,
      file: file
        ? {
            id: file._id,
            originalName: file.originalName,
            size: file.size,
            mimeType: file.mimeType,
            uploadedAt: file.uploadedAt
          }
        : null
    };
  });

  res.json({
    success: true,
    data: {
      entityType: company.entityType,
      slots,
      missing: company.missingDocuments,
      complete: company.documentsComplete
    }
  });
});

// @desc  Attach (or replace) the file in one slot
// @route POST /api/companies/:id/documents/:slot
const uploadDocument = asyncHandler(async (req, res) => {
  const { slot } = req.params;
  const definition = DOCUMENT_SLOTS[slot];
  if (!definition) {
    res.status(400);
    throw new Error(`Unknown document slot '${slot}'`);
  }

  const company = await loadCompany(req.params.id, res);
  assertCanWrite(company, req.user, res);

  if (!definition.entityTypes.includes(company.entityType)) {
    res.status(400);
    throw new Error(`'${slot}' does not apply to a ${company.entityType} registration`);
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No file received');
  }

  const meta = await persistDocument(req.file, slot);
  meta.uploadedBy = req.user._id;

  // A slot holds one file. Replacing drops the previous one from disk, but only
  // once the new record is safely saved — losing the old file and then failing
  // to persist the new one would leave the slot pointing at nothing.
  const previous = company.documents.find((d) => d.slot === slot);
  company.documents = company.documents.filter((d) => d.slot !== slot);
  company.documents.push(meta);
  await company.save();

  if (previous) await removeStoredFile(previous.storedName);

  const saved = company.documents.find((d) => d.slot === slot);
  res.status(201).json({
    success: true,
    data: {
      slot,
      file: {
        id: saved._id,
        originalName: saved.originalName,
        size: saved.size,
        mimeType: saved.mimeType,
        uploadedAt: saved.uploadedAt
      },
      missing: company.missingDocuments,
      complete: company.documentsComplete
    }
  });
});

// @desc  Stream one document back to an authorised reader
// @route GET /api/companies/:id/documents/:slot/file
const downloadDocument = asyncHandler(async (req, res) => {
  const company = await loadCompany(req.params.id, res);
  assertCanRead(company, req.user, res);

  const doc = (company.documents || []).find((d) => d.slot === req.params.slot);
  if (!doc) {
    res.status(404);
    throw new Error('No document in that slot');
  }

  const fullPath = resolveStoredPath(doc.storedName);
  if (!fs.existsSync(fullPath)) {
    res.status(404);
    throw new Error('Document file is missing from storage');
  }

  res.setHeader('Content-Type', doc.mimeType);
  res.setHeader('Content-Length', doc.size);
  // `attachment` keeps a PDF or image from being rendered in the origin's
  // context, and the quoted name stops a filename from breaking the header.
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(doc.originalName)}"`
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  fs.createReadStream(fullPath).pipe(res);
});

// @desc  Remove the file in one slot
// @route DELETE /api/companies/:id/documents/:slot
const deleteDocument = asyncHandler(async (req, res) => {
  const company = await loadCompany(req.params.id, res);
  assertCanWrite(company, req.user, res);

  const doc = (company.documents || []).find((d) => d.slot === req.params.slot);
  if (!doc) {
    res.status(404);
    throw new Error('No document in that slot');
  }

  company.documents = company.documents.filter((d) => d.slot !== req.params.slot);
  await company.save();
  await removeStoredFile(doc.storedName);

  res.json({
    success: true,
    data: {
      slot: req.params.slot,
      missing: company.missingDocuments,
      complete: company.documentsComplete
    }
  });
});

module.exports = {
  getCatalogue,
  listDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument
};
