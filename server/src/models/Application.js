const mongoose = require('mongoose');

/**
 * An application submitted against a tender.
 *
 * Status is a controlled lifecycle rather than free text, and the transitions
 * are enforced in the controller so a record cannot jump from `submitted`
 * straight to `awarded` without review. Applicants may withdraw; only staff
 * may move an application forward.
 */
const STATUSES = ['submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];

/** Who may move an application into each state. */
const TRANSITIONS = Object.freeze({
  submitted: ['under_review', 'withdrawn', 'rejected'],
  under_review: ['shortlisted', 'accepted', 'rejected', 'withdrawn'],
  shortlisted: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: []
});

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

    contactName: { type: String, required: true, trim: true, maxlength: 120 },
    contactEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address']
    },
    contactPhone: { type: String, trim: true, default: '' },

    proposalSummary: { type: String, required: true, trim: true, maxlength: 2000 },
    // Quoted amount in OMR. Optional because advisory tenders are not always priced.
    quotedAmount: { type: Number, min: 0, default: null },

    // File names only — storage is not wired up yet, so we record what the
    // applicant said they attached rather than pretending to hold the bytes.
    attachments: [{ type: String, trim: true }],

    status: { type: String, enum: STATUSES, default: 'submitted', index: true },
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

// One application per applicant per tender.
applicationSchema.index({ tenderId: 1, applicant: 1 }, { unique: true });

applicationSchema.statics.STATUSES = STATUSES;
applicationSchema.statics.TRANSITIONS = TRANSITIONS;

applicationSchema.statics.canTransition = function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]) && TRANSITIONS[from].includes(to);
};

module.exports = mongoose.model('Application', applicationSchema);
module.exports.STATUSES = STATUSES;
module.exports.TRANSITIONS = TRANSITIONS;
