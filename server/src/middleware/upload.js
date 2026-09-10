const multer = require('multer');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const { FILE_TYPES, DOCUMENT_SLOTS, typeFromMime, magicMatches } = require('../config/documents');

/**
 * Company document uploads.
 *
 * Files are buffered in memory, checked, and only then written to disk. The
 * alternative — multer's disk storage — writes the file first and validates
 * after, which leaves unvalidated content on the filesystem for as long as the
 * check takes, and leaves a stray file behind whenever the check fails.
 *
 * The upload directory sits outside anything Express serves statically. These
 * are commercial registrations, tax cards and insurance certificates; they are
 * readable only through the authenticated download route, never by URL.
 */

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const UPLOAD_ROOT = path.resolve(
  process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads'),
  'companies'
);

/** Rejects with a 400-shaped error so the handler reports it like any other. */
const badRequest = (message) => {
  const err = new Error(message);
  err.status = 400;
  return err;
};

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_BYTES,
    files: 1,
    // The route needs `slot` only; capping the rest keeps a request from
    // carrying an unbounded number of text fields.
    fields: 4
  },
  fileFilter(req, file, cb) {
    const slot = DOCUMENT_SLOTS[req.params.slot];
    if (!slot) return cb(badRequest(`Unknown document slot '${req.params.slot}'`));

    const type = typeFromMime(file.mimetype);
    if (!type || !slot.accept.includes(type)) {
      const allowed = slot.accept.map((t) => FILE_TYPES[t].ext).join(', ');
      return cb(badRequest(`This document must be one of: ${allowed}`));
    }
    cb(null, true);
  }
}).single('file');

/**
 * Wraps multer so its own errors arrive as ordinary HTTP failures rather than
 * as an unhandled multipart error.
 */
const receiveDocument = (req, res, next) => {
  memoryUpload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      res.status(400);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new Error(`File is larger than the ${MAX_BYTES / 1024 / 1024} MB limit`));
      }
      if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new Error('Upload one file at a time, in the "file" field'));
      }
      return next(new Error(err.message));
    }
    res.status(err.status || 400);
    next(err);
  });
};

/**
 * Verifies the buffer really is what it claims and writes it under a generated
 * name.
 *
 * Returns the metadata the Company document stores. The name is random, so two
 * uploads never collide and nothing about the caller's filename reaches the
 * filesystem.
 */
async function persistDocument(file, slotKey) {
  const type = typeFromMime(file.mimetype);
  if (!magicMatches(type, file.buffer)) {
    throw badRequest('File contents do not match its type — the file may be corrupt or renamed');
  }

  await fs.mkdir(UPLOAD_ROOT, { recursive: true });
  const storedName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}${FILE_TYPES[type].ext}`;
  await fs.writeFile(path.join(UPLOAD_ROOT, storedName), file.buffer, { flag: 'wx' });

  return {
    slot: slotKey,
    storedName,
    // Kept for display only. Trimmed to the basename so a path in the name
    // cannot survive into the UI, and length-capped to match the schema.
    originalName: path.basename(String(file.originalname || 'document')).slice(0, 260),
    mimeType: FILE_TYPES[type].mime,
    size: file.size
  };
}

/**
 * Resolves a stored name to an absolute path, refusing anything that is not a
 * plain filename directly inside the upload directory.
 *
 * Stored names are generated, so this should never fire — it is here because a
 * path that reaches `fs` should be checked at the point of use rather than
 * trusted because of where it was supposed to have come from.
 */
function resolveStoredPath(storedName) {
  if (!storedName || path.basename(storedName) !== storedName) {
    throw badRequest('Invalid document reference');
  }
  const full = path.join(UPLOAD_ROOT, storedName);
  const rel = path.relative(UPLOAD_ROOT, full);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw badRequest('Invalid document reference');
  }
  return full;
}

/** Best-effort delete; a missing file is not an error worth failing a request. */
async function removeStoredFile(storedName) {
  try {
    await fs.unlink(resolveStoredPath(storedName));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

module.exports = {
  receiveDocument,
  persistDocument,
  resolveStoredPath,
  removeStoredFile,
  UPLOAD_ROOT,
  MAX_BYTES
};
