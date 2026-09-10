const mongoose = require('mongoose');
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
      required: [true, 'Commercial Registration (CR) number is required'],
      unique: true,
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
      enum: ['organization', 'merchant'],
      default: 'organization'
    },
    bankName: { type: String, trim: true, default: '' },
    iban: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      validate: {
        validator: (v) => !v || /^OM\d{2}[A-Z0-9]{3,30}$/.test(v),
        message: 'IBAN must be a valid Omani IBAN starting with OM'
      }
    },
    accountHolder: { type: String, trim: true, default: '' },
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
      required: true,
      min: [1, 'A company must have at least 1 employee']
    },
    omaniEmployeeCount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (v) {
          return v <= this.employeeCount;
        },
        message: 'Omani employee count cannot exceed total employee count'
      }
    },
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
    // Held alongside the IBAN because the registration form collects both.
    accountNumber: { type: String, trim: true, default: '', maxlength: 40 },

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

companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

companySchema.index({ companyName: 'text', crNumber: 'text' });

module.exports = mongoose.model('Company', companySchema);
module.exports.OMANI_GOVERNORATES = OMANI_GOVERNORATES;
