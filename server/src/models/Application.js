const mongoose = require('mongoose');
const { priceBid, DEFAULT_VAT_RATE, PLATFORM_FEE_RATE } = require('../config/bidding');

/**
 * A bid submitted against a tender.
 *
 * This is the application record grown into the priced bid the tender workflow
 * needs — one concept, not two. Splitting "who applied" from "what they bid"
 * across two collections would have meant maintaining the lifecycle, the audit
 * trail and the one-per-bidder guarantee twice, and answering "did this firm
 * bid?" by reading both.
 *
 * Status is a controlled lifecycle rather than free text, and the transitions
 * are enforced in the controller so a record cannot jump from `submitted`
 * straight to `accepted` without review. Bidders may withdraw; only staff may
 * move a bid forward.
 *
 * `draft` sits before `submitted` because a bid is long — files, a bill of
 * quantities, pricing — and losing it to a closed laptop is not acceptable. A
 * draft is invisible to the buyer and carries no commitment; submitting is the
 * act that makes it one, and after that the bidder can only withdraw.
 */
const STATUSES = [
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn'
];

/** Who may move a bid into each state. */
const TRANSITIONS = Object.freeze({
  draft: ['submitted', 'withdrawn'],
  submitted: ['under_review', 'withdrawn', 'rejected'],
  under_review: ['shortlisted', 'accepted', 'rejected', 'withdrawn'],
  shortlisted: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: []
});

/** One priced row of the bill of quantities. */
const lineItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 300 },
    unit: { type: String, trim: true, default: '' },
    quantity: { type: Number, required: true, min: 0 },
    // Held in baisa. See config/bidding.js for why money is not a float here.
    unitPriceBaisa: { type: Number, required: true, min: 0 },
    lineTotalBaisa: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

/**
 * Fields a draft may leave blank and a submission may not.
 *
 * Mongoose calls this with the document as `this`, so one predicate serves
 * every such field and they cannot drift apart.
 */
function submittedOnly() {
  return this.status !== 'draft';
}

/** A file attached to a bid. Same shape as a company document. */
const bidDocumentSchema = new mongoose.Schema(
  {
    // 'technical' and 'commercial' are the two the tender asks for; 'other'
    // carries anything else the bidder chooses to include.
    slot: { type: String, required: true, enum: ['technical', 'commercial', 'other'] },
    storedName: { type: String, required: true },
    originalName: { type: String, required: true, maxlength: 260 },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true, min: 1 },
    uploadedAt: { type: Date, default: Date.now },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { _id: true }
);

const applicationSchema = new mongoose.Schema(
  {
    tenderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tender',
      required: true,
      index: true
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },

    /*
      Required to submit, not to save — the same rule as the summary below. A
      draft that demanded these before it would save would stop a bidder from
      saving the pricing they actually came to do.
    */
    contactName: {
      type: String,
      required: [submittedOnly, 'A contact name is required'],
      trim: true,
      maxlength: 120,
      default: ''
    },
    contactEmail: {
      type: String,
      required: [submittedOnly, 'A contact email is required'],
      lowercase: true,
      trim: true,
      default: '',
      // An empty draft has no address to validate; a submitted bid does.
      match: [/^$|^\S+@\S+\.\S+$/, 'Enter a valid email address']
    },
    contactPhone: { type: String, trim: true, default: '' },

    /*
      Required to submit, not to save. A draft exists precisely so a bidder can
      stop halfway; demanding the summary before they may save would defeat it.
      The controller enforces it on the transition to `submitted`.
    */
    proposalSummary: {
      type: String,
      required: [submittedOnly, 'A submitted bid needs a proposal summary'],
      trim: true,
      maxlength: 2000,
      default: ''
    },

    /* ------------------------------------------------------ the money */

    lineItems: { type: [lineItemSchema], default: [] },
    vatRate: { type: Number, min: 0, max: 100, default: DEFAULT_VAT_RATE },
    platformFeeRate: { type: Number, min: 0, max: 100, default: PLATFORM_FEE_RATE },

    /*
      Every figure below is derived, never accepted from the request. `pre save`
      recomputes them from the line items on the way in, so a client cannot name
      its own platform fee or understate its VAT.
    */
    subtotalBaisa: { type: Number, min: 0, default: 0 },
    vatAmountBaisa: { type: Number, min: 0, default: 0 },
    totalBaisa: { type: Number, min: 0, default: 0 },
    platformFeeBaisa: { type: Number, min: 0, default: 0 },
    netToBidderBaisa: { type: Number, min: 0, default: 0 },

    /* How long the bidder stands behind this price. */
    validityDays: { type: Number, min: 1, max: 365, default: 90 },

    /*
      Exceptions are asked as a yes/no with a reason, not as an open box. A
      buyer comparing bids needs to know at a glance which ones are qualified,
      and an empty text field cannot be counted.
    */
    hasExceptions: { type: Boolean, default: false },
    exceptionsNote: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: '',
      validate: {
        validator(v) {
          return !this.hasExceptions || (v && v.trim().length > 0);
        },
        message: 'State the exception you are taking'
      }
    },

    documents: { type: [bidDocumentSchema], default: [] },

    submittedAt: { type: Date, default: null },

    status: { type: String, enum: STATUSES, default: 'draft', index: true },
    reviewerNotes: { type: String, trim: true, maxlength: 2000, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    decidedAt: { type: Date, default: null },

    // Append-only audit trail; every status change is recorded with its author.
    history: [
      {
        _id: false,
        from: String,
        to: String,
        at: { type: Date, default: Date.now },
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: String
      }
    ]
  },
  { timestamps: true }
);

// One bid per applicant per tender.
applicationSchema.index({ tenderId: 1, applicant: 1 }, { unique: true });

/*
  The single point where a bid's money is decided. Anything the request sent for
  the derived fields is overwritten here, so those fields are outputs of the
  line items rather than inputs a caller can set.
*/
applicationSchema.pre('validate', function recomputeMoney(next) {
  const priced = priceBid(
    (this.lineItems || []).map((li) => ({
      ...(li.toObject ? li.toObject() : li),
      // The line items arrive already in baisa from the controller, so hand
      // the pricer rials to keep it one function with one contract.
      unitPrice: (li.unitPriceBaisa || 0) / 1000
    })),
    { vatRate: this.vatRate, platformFeeRate: this.platformFeeRate }
  );

  this.lineItems = priced.lines.map((l) => ({
    description: l.description,
    unit: l.unit || '',
    quantity: l.quantity,
    unitPriceBaisa: l.unitPriceBaisa,
    lineTotalBaisa: l.lineTotalBaisa
  }));
  this.subtotalBaisa = priced.subtotalBaisa;
  this.vatAmountBaisa = priced.vatAmountBaisa;
  this.totalBaisa = priced.totalBaisa;
  this.platformFeeBaisa = priced.platformFeeBaisa;
  this.netToBidderBaisa = priced.netToBidderBaisa;
  next();
});

/* Rials for anything reading this record; baisa stays the stored truth. */
const rials = (b) => Math.round(Number(b || 0)) / 1000;
applicationSchema.virtual('subtotal').get(function () { return rials(this.subtotalBaisa); });
applicationSchema.virtual('vatAmount').get(function () { return rials(this.vatAmountBaisa); });
applicationSchema.virtual('total').get(function () { return rials(this.totalBaisa); });
applicationSchema.virtual('platformFee').get(function () { return rials(this.platformFeeBaisa); });
applicationSchema.virtual('netToBidder').get(function () { return rials(this.netToBidderBaisa); });

applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

applicationSchema.statics.STATUSES = STATUSES;
applicationSchema.statics.TRANSITIONS = TRANSITIONS;

applicationSchema.statics.canTransition = function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
};

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUSES = STATUSES;
module.exports.TRANSITIONS = TRANSITIONS;
