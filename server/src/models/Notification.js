const mongoose = require('mongoose');

/**
 * Something the platform told a user.
 *
 * Stored rather than emailed and forgotten. A registration decision is the
 * moment an applicant finds out whether they may trade, and the first thing
 * they ask afterwards is *when* — so the record carries its own timestamp and
 * survives a lost inbox, a changed address, and a spam filter.
 *
 * Both languages are written at the moment the notice is created, not resolved
 * at read time from a key. A notice is a statement of what was said then; if
 * the wording of an approval message changes next year, the notices already
 * sent must still read as they did when they were sent.
 */
const KINDS = [
  'registration_approved',
  'registration_rejected',
  'registration_under_review',
  'document_expired',
  'document_expiring',
  'bid_awarded',
  'bid_rejected',
  'general'
];

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    kind: { type: String, enum: KINDS, required: true, index: true },

    title: { type: String, required: true, trim: true, maxlength: 200 },
    titleAr: { type: String, trim: true, default: '', maxlength: 200 },
    body: { type: String, trim: true, default: '', maxlength: 2000 },
    bodyAr: { type: String, trim: true, default: '', maxlength: 2000 },

    /*
      What the notice is about, so the interface can link to it. Loose rather
      than a hard reference: a notice outlives the thing it describes, and a
      populate that fails on a deleted record should not take the list with it.
    */
    subjectType: {
      type: String,
      enum: ['company', 'tender', 'application', 'document', null],
      default: null
    },
    subjectId: { type: mongoose.Schema.Types.ObjectId, default: null },

    /** Who caused it, when that was a person rather than the system. */
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    readAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// The unread badge is the most frequent read in the app: one user, newest first.
notificationSchema.index({ user: 1, createdAt: -1 });

notificationSchema.virtual('isRead').get(function () {
  return this.readAt !== null;
});

notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

/**
 * Writes a notice, and never fails the thing it was reporting on.
 *
 * An approval that succeeded must not be rolled back because the notice could
 * not be stored — the applicant is approved either way, and losing that to a
 * failed insert would be worse than a missing notification. So this swallows
 * its own errors and says so in the log.
 */
notificationSchema.statics.notify = async function notify(payload) {
  try {
    return await this.create(payload);
  } catch (err) {
    console.error('[notify] could not store a notification:', err.message);
    return null;
  }
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
module.exports.KINDS = KINDS;
