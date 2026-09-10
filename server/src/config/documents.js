/**
 * The document catalogue.
 *
 * One definition of every file a company can attach: which registration types
 * ask for it, whether it is mandatory, and what it may be. Validation, the
 * upload filter, the completeness check and the client's checklist all read
 * from here, so a slot cannot be accepted by one layer and unknown to another.
 *
 * The set comes from the registration forms on the legacy site — eight slots
 * for a merchant, three for an organisation — with the two shared by both
 * (`logo`, `other`) collapsed into single entries.
 */

/** Accepted types, keyed by the token used in a slot's `accept` list. */
const FILE_TYPES = {
  pdf: {
    mime: 'application/pdf',
    ext: '.pdf',
    // %PDF
    magic: [Buffer.from([0x25, 0x50, 0x44, 0x46])]
  },
  jpg: {
    mime: 'image/jpeg',
    ext: '.jpg',
    // JPEG SOI + APP marker
    magic: [Buffer.from([0xff, 0xd8, 0xff])]
  },
  png: {
    mime: 'image/png',
    ext: '.png',
    magic: [Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])]
  }
};

/** Alternate MIME strings browsers send for the same type. */
const MIME_ALIASES = {
  'image/jpg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/x-png': 'png',
  'application/pdf': 'pdf',
  'application/x-pdf': 'pdf'
};

const MERCHANT = 'merchant';
const ORGANIZATION = 'organization';
const BOTH = [MERCHANT, ORGANIZATION];

const DOCUMENT_SLOTS = {
  cr: {
    entityTypes: BOTH,
    required: true,
    accept: ['pdf'],
    label: { en: 'Commercial Registration', ar: 'السجل التجاري' }
  },
  chamber: {
    entityTypes: [MERCHANT],
    required: true,
    accept: ['pdf'],
    label: {
      en: 'Chamber of Commerce membership',
      ar: 'شهادة انتساب غرفة التجارة والصناعة'
    }
  },
  riyada: {
    entityTypes: [MERCHANT],
    required: false,
    accept: ['pdf', 'jpg', 'png'],
    label: { en: 'Riyada card', ar: 'بطاقة ريادة' }
  },
  socialInsurance: {
    entityTypes: [MERCHANT],
    required: false,
    accept: ['pdf'],
    label: { en: 'Social insurance certificate', ar: 'شهادة التأمينات الاجتماعية' }
  },
  omanization: {
    entityTypes: [MERCHANT],
    required: false,
    accept: ['pdf'],
    label: { en: 'Omanization rate certificate', ar: 'شهادة نسبة التعمين' }
  },
  tax: {
    entityTypes: [MERCHANT],
    required: false,
    accept: ['pdf'],
    label: { en: 'Tax registration card', ar: 'بطاقة التسجيل الضريبي' }
  },
  boardResolution: {
    entityTypes: [ORGANIZATION],
    required: false,
    accept: ['pdf', 'jpg', 'png'],
    label: { en: 'Board resolution or power of attorney', ar: 'مستند الوكالة أو القرار' }
  },
  registrationProof: {
    entityTypes: [ORGANIZATION],
    required: true,
    accept: ['pdf', 'jpg', 'png'],
    label: { en: 'Proof of registration', ar: 'إثبات التسجيل' }
  },
  logo: {
    entityTypes: BOTH,
    required: false,
    accept: ['jpg', 'png'],
    label: { en: 'Organisation logo', ar: 'شعار المؤسسة' }
  },
  other: {
    entityTypes: BOTH,
    required: false,
    accept: ['pdf', 'jpg', 'png'],
    label: { en: 'Other', ar: 'أخرى' }
  }
};

const SLOT_KEYS = Object.keys(DOCUMENT_SLOTS);

/** Slots that apply to a registration type, in catalogue order. */
const slotsFor = (entityType) =>
  SLOT_KEYS.filter((key) => DOCUMENT_SLOTS[key].entityTypes.includes(entityType));

/** Mandatory slots for a registration type. */
const requiredSlotsFor = (entityType) =>
  slotsFor(entityType).filter((key) => DOCUMENT_SLOTS[key].required);

/**
 * Resolves an uploaded file's declared MIME to a catalogue type token, or null
 * when it is not a type we accept at all.
 */
const typeFromMime = (mime) => MIME_ALIASES[String(mime).toLowerCase()] || null;

/**
 * Confirms the file's leading bytes match the type it claims to be.
 *
 * The browser's Content-Type and the filename are both attacker-controlled, so
 * neither is evidence on its own — a `.pdf` that is really an HTML document
 * would otherwise be stored and later served back. Reading the signature is
 * the cheap check that makes the declared type mean something.
 */
const magicMatches = (type, buffer) => {
  const spec = FILE_TYPES[type];
  if (!spec || !Buffer.isBuffer(buffer)) return false;
  return spec.magic.some(
    (sig) => buffer.length >= sig.length && buffer.subarray(0, sig.length).equals(sig)
  );
};

module.exports = {
  FILE_TYPES,
  DOCUMENT_SLOTS,
  SLOT_KEYS,
  MERCHANT,
  ORGANIZATION,
  slotsFor,
  requiredSlotsFor,
  typeFromMime,
  magicMatches
};
