const mongoose = require('mongoose');
const { CATEGORY_KEYS, MAX_CATEGORIES } = require('../config/categories');
const { SLOT_KEYS, requiredSlotsFor } = require('../config/documents');

const OMANI_GOVERNORATES = [
  'Muscat', 'Dhofar', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah',
  'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North',
  'Ash Sharqiyah South', 'Ad Dhahirah', 'Al Wusta'
];

const locationSchema = new mongoose.Schema(
  {
    lat: { type: Number, required: true, min: -90, max: 90 },
    lng: { type: Number, required: true, min: -180, max: 180 },
    address: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

/**
 * One attached file.
 *
 * `storedName` is the name on disk and is generated, never taken from the
 * upload — the client's filename is kept only as `originalName`, for display.
 * Keeping the two apart is what stops a crafted name from escaping the upload
 * directory or overwriting another company's file.
 */
const documentSchema = new mongoose.Schema(
  {
    slot: { type: String, required: true, enum: SLOT_KEYS },
    storedName: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 260 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: true }
);

/**
 * One bank account a merchant or practitioner is paid into.
 *
 * Held as a list rather than four fields on the company because a supplier
 * genuinely has more than one: a rial account for local contracts and a foreign
 * currency account for imports is the ordinary case, not an edge one. Exactly
 * one is marked primary — that is the account the platform pays by default, and
 * "which one do we pay?" must have a single answer at every moment.
 */
const bankAccountSchema = new mongoose.Schema(
  {
    bankName: { type: String, required: true, trim: true, maxlength: 120 },
    accountHolder: { type: String, required: true, trim: true, maxlength: 150 },
    accountNumber: { type: String, trim: true, default: '', maxlength: 40 },
    iban: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: (v) => /^OM\d{2}[A-Z0-9]{3,30}$/.test(v),
        message: 'IBAN must be a valid Omani IBAN starting with OM'
      }
    },
    // Which account gets paid. The hook below guarantees exactly one is set.
    isPrimary: { type: Boolean, default: false },
    label: { type: String, trim: true, default: '', maxlength: 60 }
  },
  { _id: true }
);

const companySchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      minlength: 2,
      maxlength: 150
    },
    crNumber: {
      type: String,
      /*
        A self-employment permit is not a commercial registration, and a
        practitioner holding one has no CR number to give.

        The index is sparse for the same reason. A plain unique index treats a
        missing field as null and indexes it, so the first self-employed record
        would save and the second would collide on null — the whole type would
        be limited to one registrant. Sparse indexes only the documents that
        actually carry a CR, which is exactly the set the uniqueness is about.
      */
      required: [
        function () {
          return this.entityType !== 'freelance';
        },
        'Commercial Registration (CR) number is required'
      ],
      index: { unique: true, sparse: true },
      trim: true,
      match: [/^[0-9]{4,10}$/, 'CR number must be 4-10 digits']
    },
    governorate: {
      type: String,
      required: true,
      enum: OMANI_GOVERNORATES
    },
    // Arabic display name. Optional so the API stays backward compatible;
    // the client falls back to the English name when it is absent.
    // Merchants register as an individual trader, organisations as an entity.
    // The extra banking block is only collected for merchants.
    entityType: {
      type: String,
      enum: ['organization', 'merchant', 'freelance'],
      default: 'organization'
    },
    /*
      The accounts this supplier is paid into. `bankName`, `iban`,
      `accountHolder` and `accountNumber` still read off the primary account as
      virtuals, so everything written against the single-account shape keeps
      working — but the stored truth is the list.
    */
    bankAccounts: {
      type: [bankAccountSchema],
      default: [],
      validate: {
        validator: (v) => !v || v.length <= 5,
        message: 'A record may hold at most 5 bank accounts'
      }
    },
    companyNameAr: {
      type: String,
      trim: true,
      maxlength: 150,
      default: ''
    },
    sector: {
      type: String,
      trim: true,
      default: 'General Trading'
    },
    sectorAr: {
      type: String,
      trim: true,
      default: ''
    },
    /*
      Path to the company's mark, served from the client's public folder.
      Optional: the directory card falls back to a monogram drawn from the
      company's own name, which is honest about there being no logo rather
      than rendering a broken image.
    */
    logo: {
      type: String,
      trim: true,
      default: ''
    },
    employeeCount: {
      type: Number,
      /*
        Required of a firm, not of a person. A self-employment permit covers
        one individual working alone: demanding a staff count there would make
        the form unfillable, and defaulting it to 1 keeps the Omanization
        virtual arithmetic sound without inventing employees.
      */
      required: [
        function () {
          return this.entityType !== 'freelance';
        },
        'A company must state its employee count'
      ],
      default: function () {
        return this.entityType === 'freelance' ? 1 : undefined;
      },
      min: [1, 'A company must have at least 1 employee']
    },
    omaniEmployeeCount: {
      type: Number,
      required: [
        function () {
          return this.entityType !== 'freelance';
        },
        'A company must state its Omani employee count'
      ],
      default: function () {
        return this.entityType === 'freelance' ? 1 : undefined;
      },
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.employeeCount;
        },
        message: 'Omani employee count cannot exceed total employee count'
      }
    },
    /*
      Self-employment.

      These are inert on a merchant or an organisation record and are only
      collected — and only validated — when entityType is 'freelance'. They sit
      on the same collection rather than in one of their own because everything
      downstream (documents, tenders, bids, the directory) already keys off a
      company id, and a parallel collection would have to be threaded through
      all of it for no gain.
    */
    civilNumber: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator(v) {
          // Eight digits, as issued. Empty is allowed for the other types.
          return !v || /^[0-9]{8}$/.test(v);
        },
        message: 'The civil number is eight digits'
      }
    },
    profession: { type: String, trim: true, default: '' },
    professionAr: { type: String, trim: true, default: '' },
    specialisation: { type: String, trim: true, default: '' },
    specialisationAr: { type: String, trim: true, default: '' },
    /* Product and service categories, shared with the merchant form. */
    /*
      What this business sells, from the controlled list in config/categories.
      Validated against it rather than taken as free text, because these are
      what a buyer filters the directory by — and "IT", "I.T." and
      "Information Technology" are three answers to one question, none of
      which a filter finds.
    */
    serviceCategories: {
      type: [String],
      default: [],
      validate: [
        {
          validator: (v) => !v || v.length <= MAX_CATEGORIES,
          message: `Choose at most ${MAX_CATEGORIES} categories`
        },
        {
          validator: (v) => !v || v.every((c) => CATEGORY_KEYS.includes(c)),
          message: 'Unknown category'
        }
      ]
    },
    freelancePermitNo: { type: String, trim: true, default: '' },
    /* Issued by the Ministry of Commerce, Industry and Investment Promotion. */
    ecommerceLicenceNo: { type: String, trim: true, default: '' },
    storeUrl: { type: String, trim: true, default: '' },
    socialUrl: { type: String, trim: true, default: '' },
    /* Verification on Oman's Maroof platform, held as the published link. */
    maroofUrl: { type: String, trim: true, default: '' },
    hasRiyadaCard: {
      type: Boolean,
      default: false
    },
    registrationDate: {
      type: Date,
      default: Date.now
    },
    location: {
      type: locationSchema,
      required: true
    },
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email address']
    },
    contactPhone: { type: String, trim: true, default: '' },

    /* ------------------------------------------------- merchant details */

    legalForm: { type: String, trim: true, default: '', maxlength: 120 },
    address: { type: String, trim: true, default: '', maxlength: 300 },
    website: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || /^https?:\/\/\S+\.\S+/.test(v),
        message: 'Website must be a full URL beginning with http:// or https://'
      }
    },
    category: {
      type: String,
      trim: true,
      default: '',
      enum: ['', 'contracting', 'it', 'supplies', 'consulting']
    },
    // Self-declared at registration; the assessment verifies it separately.
    isSme: { type: Boolean, default: false },

    /* --------------------------------------------- organisation details */

    description: { type: String, trim: true, default: '', maxlength: 2000 },
    organizationType: {
      type: String,
      trim: true,
      default: '',
      enum: ['', 'waqf', 'association', 'civil', 'nonprofit']
    },
    registrationExpiry: { type: Date, default: null },
    proofExpiry: { type: Date, default: null },

    // The person authorised to act for the organisation. Kept on the company
    // rather than the user account: the representative can change without the
    // account changing hands.
    representativeName: { type: String, trim: true, default: '', maxlength: 150 },
    representativeNationalId: { type: String, trim: true, default: '', maxlength: 30 },
    representativePhone: { type: String, trim: true, default: '' },

    /* ------------------------------------------------------ agreements */

    // When the NDA was signed. Null means it was not, and the record should
    // not have been accepted — see the route validation.
    ndaSignedAt: { type: Date, default: null },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // At most one file per slot; re-uploading a slot replaces what was there.
    documents: {
      type: [documentSchema],
      default: []
    }
  },
  { timestamps: true }
);

// Virtual: live Omanization rate, always derived — never stored redundantly.
companySchema.virtual('omanizationRate').get(function () {
  if (!this.employeeCount) return 0;
  return Math.round((this.omaniEmployeeCount / this.employeeCount) * 1000) / 10; // 1 decimal %
});

/**
 * Which mandatory documents are still outstanding.
 *
 * Derived rather than stored: the catalogue decides what is required, and the
 * required set differs by registration type, so caching this on the document
 * would go stale the moment either changes.
 */
companySchema.virtual('missingDocuments').get(function () {
  const present = new Set((this.documents || []).map((d) => d.slot));
  return requiredSlotsFor(this.entityType).filter((slot) => !present.has(slot));
});

companySchema.virtual('documentsComplete').get(function () {
  return this.missingDocuments.length === 0;
});

/*
  Exactly one primary account, always.

  Enforced here rather than trusted from the request, because "which account do
  we pay?" cannot have two answers or none. A list with no primary gets one
  — the first, which for a form that adds accounts in order is the one the
  supplier entered first. A list with several keeps the first and clears the
  rest, so a client that marks two never silently decides which wins.
*/
companySchema.pre('validate', function onePrimaryAccount(next) {
  const accounts = this.bankAccounts || [];
  if (accounts.length) {
    const firstMarked = accounts.findIndex((a) => a.isPrimary);
    const primary = firstMarked === -1 ? 0 : firstMarked;
    accounts.forEach((a, i) => {
      a.isPrimary = i === primary;
    });
  }
  next();
});

/*
  The single-account shape, still readable.

  Everything written before accounts became a list — the directory, exports, the
  registration review screen — asks a company for `iban` and expects a string.
  These keep that true by answering with the primary account, so the change is
  invisible to every reader and explicit only to the code that manages accounts.
*/
companySchema.virtual('primaryBankAccount').get(function () {
  return (this.bankAccounts || []).find((a) => a.isPrimary) || null;
});

for (const field of ['bankName', 'iban', 'accountHolder', 'accountNumber']) {
  companySchema.virtual(field).get(function () {
    return this.primaryBankAccount?.[field] || '';
  });
}

companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

companySchema.index({ companyName: 'text', crNumber: 'text' });

module.exports = mongoose.model('Company', companySchema);
module.exports.OMANI_GOVERNORATES = OMANI_GOVERNORATES;
