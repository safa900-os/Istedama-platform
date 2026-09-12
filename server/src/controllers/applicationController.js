const fs = require('fs');
const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const { Tender } = require('../models/Content');
const Company = require('../models/Company');
const { toBaisa } = require('../config/bidding');
const {
  persistDocument,
  resolveStoredPath,
  removeStoredFile,
  BID_SLOTS
} = require('../middleware/upload');

/**
 * Applications against tenders.
 *
 * Two rules run through every handler:
 *   1. An applicant may only ever see and act on their own applications.
 *      Staff (admin, auditor) see everything. This is checked against the
 *      record, not against anything the client sends.
 *   2. Status moves follow the lifecycle in the model. Applicants may only
 *      withdraw; moving an application forward is a staff action.
 */

const STAFF = ['admin', 'auditor'];
const isStaff = (user) => STAFF.includes(user?.role);

/**
 * Whether a tender can still take a bid.
 *
 * Checked on the server on every write, not once when the page loaded. A form
 * left open across the deadline would otherwise submit against a closed
 * tender, and the bidder would believe they had made it.
 */
const tenderIsOpen = (tender) =>
  tender.status === 'open' && (!tender.closingDate || new Date(tender.closingDate) >= new Date());

/**
 * Normalises a bill of quantities from the request.
 *
 * Prices arrive as rials because that is what the bidder typed; they are stored
 * as baisa. Everything derived from them — subtotal, VAT, the platform fee, the
 * net — is recomputed by the model, so nothing a caller sends for those fields
 * is read.
 */
const normaliseLineItems = (raw) =>
  (Array.isArray(raw) ? raw : [])
    .slice(0, 200)
    .filter((li) => li && String(li.description || '').trim())
    .map((li) => ({
      description: String(li.description).trim().slice(0, 300),
      unit: String(li.unit || '').trim().slice(0, 40),
      quantity: Math.max(0, Number(li.quantity) || 0),
      unitPriceBaisa: Math.max(0, toBaisa(li.unitPrice)),
      lineTotalBaisa: 0 // recomputed on save
    }));

/** The fields a bidder owns on their own bid. */
const applyBidFields = (bid, body) => {
  const set = (k, v) => {
    if (v !== undefined) bid[k] = v;
  };
  set('contactName', body.contactName);
  set('contactEmail', body.contactEmail);
  set('contactPhone', body.contactPhone);
  set('proposalSummary', body.proposalSummary);
  set('validityDays', body.validityDays);
  set('vatRate', body.vatRate);
  if (body.lineItems !== undefined) bid.lineItems = normaliseLineItems(body.lineItems);
  if (body.hasExceptions !== undefined) {
    bid.hasExceptions = Boolean(body.hasExceptions);
    // Dropping the flag drops the reason with it, so a stale note cannot sit on
    // a bid that no longer claims an exception.
    bid.exceptionsNote = bid.hasExceptions ? String(body.exceptionsNote || '').trim() : '';
  }
  /*
    platformFeeRate is deliberately not settable. It is the platform's published
    commission, and a bid that could name its own would be able to zero it.
  */
};

// @desc  List applications — own by default, all for staff
// @route GET /api/applications
const listApplications = asyncHandler(async (req, res) => {
  const { status, tenderId } = req.query;
  const query = {};

  if (!isStaff(req.user)) query.applicant = req.user._id;
  if (status && status !== 'all') query.status = status;
  if (tenderId) query.tenderId = tenderId;

  const applications = await Application.find(query)
    .populate('tenderId', 'refNo title titleAr category status closingDate')
    .sort({ createdAt: -1 });

  res.json({ success: true, count: applications.length, data: applications });
});

// @desc  Get one application
// @route GET /api/applications/:id
const getApplication = asyncHandler(async (req, res) => {
  const application = await Application.findById(req.params.id)
    .populate('tenderId', 'refNo title titleAr category status closingDate');

  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  if (!isStaff(req.user) && !application.applicant.equals(req.user._id)) {
    // 404 rather than 403 so the existence of other applications is not leaked.
    res.status(404);
    throw new Error('Application not found');
  }

  res.json({ success: true, data: application });
});

// @desc  Apply to a tender
// @route POST /api/applications
const createApplication = asyncHandler(async (req, res) => {
  const { tenderId, contactName, contactEmail, contactPhone, proposalSummary, quotedAmount, attachments } = req.body;

  const tender = await Tender.findById(tenderId);
  if (!tender) {
    res.status(404);
    throw new Error('Tender not found');
  }

  // A closed tender cannot receive new applications, and neither can an
  // expired one — checked server-side so a stale page cannot submit.
  if (tender.status !== 'open') {
    res.status(400);
    throw new Error('This tender is no longer accepting applications');
  }
  if (tender.closingDate && new Date(tender.closingDate) < new Date()) {
    res.status(400);
    throw new Error('The closing date for this tender has passed');
  }

  const existing = await Application.findOne({ tenderId, applicant: req.user._id });
  if (existing) {
    res.status(409);
    throw new Error('You have already applied to this tender');
  }

  const application = await Application.create({
    tenderId,
    applicant: req.user._id,
    contactName,
    contactEmail,
    contactPhone,
    proposalSummary,
    quotedAmount: quotedAmount ?? null,
    attachments: Array.isArray(attachments) ? attachments.slice(0, 10) : [],
    history: [{ from: null, to: 'submitted', by: req.user._id }]
  });

  res.status(201).json({ success: true, data: application });
});

// @desc  Move an application through its lifecycle
// @route PATCH /api/applications/:id/status
const updateStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  const application = await Application.findById(req.params.id);
  if (!application) {
    res.status(404);
    throw new Error('Application not found');
  }

  const owns = application.applicant.equals(req.user._id);
  if (!isStaff(req.user) && !owns) {
    res.status(404);
    throw new Error('Application not found');
  }

  // Applicants may only withdraw. Everything else is a staff decision.
  if (!isStaff(req.user) && status !== 'withdrawn') {
    res.status(403);
    throw new Error('You may only withdraw your own application');
  }

  if (!Application.canTransition(application.status, status)) {
    res.status(400);
    throw new Error(`Cannot move an application from ${application.status} to ${status}`);
  }

  application.history.push({
    from: application.status,
    to: status,
    by: req.user._id,
    note: note || undefined
  });
  application.status = status;

  if (isStaff(req.user)) {
    application.reviewedBy = req.user._id;
    if (note) application.reviewerNotes = note;
  }
  if (['accepted', 'rejected'].includes(status)) {
    application.decidedAt = new Date();
  }

  await application.save();
  res.json({ success: true, data: application });
});

// @desc  Counts per status for the applicant's dashboard
// @route GET /api/applications/stats
const getApplicationStats = asyncHandler(async (req, res) => {
  const match = isStaff(req.user) ? {} : { applicant: req.user._id };

  const rows = await Application.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  const byStatus = Application.STATUSES.reduce((acc, s) => ({ ...acc, [s]: 0 }), {});
  rows.forEach((r) => { byStatus[r._id] = r.count; });

  res.json({
    success: true,
    data: { byStatus, total: Object.values(byStatus).reduce((a, b) => a + b, 0) }
  });
});

// @desc  Create or update the caller's bid on a tender, without submitting it
// @route PUT /api/applications/tender/:tenderId/draft
/**
 * Refuses a bidder whose registration has not been approved.
 *
 * The whole point of reviewing a registration is that an unchecked party does
 * not take part in a procurement. Checking it at sign-in would be the wrong
 * place — an applicant must be able to sign in to see where their application
 * stands, and to fix what was rejected. Bidding is the act that has to wait.
 *
 * Staff are exempt: they are not bidding, they are administering.
 */
async function assertMayBid(req, res) {
  if (isStaff(req.user)) return;

  const company = await Company.findOne({ owner: req.user._id }).select('registrationStatus');
  if (!company) {
    res.status(403);
    throw new Error('Register your company before bidding on a tender');
  }
  if (company.registrationStatus !== 'approved') {
    res.status(403);
    throw new Error(
      company.registrationStatus === 'rejected'
        ? 'Your registration was not approved. Correct it and submit it again before bidding.'
        : 'Your registration is still being reviewed. You can bid once it is approved.'
    );
  }
}

const saveDraft = asyncHandler(async (req, res) => {
  await assertMayBid(req, res);

  const tender = await Tender.findById(req.params.tenderId);
  if (!tender) {
    res.status(404);
    throw new Error('Tender not found');
  }
  if (!tenderIsOpen(tender)) {
    res.status(400);
    throw new Error('This tender is no longer accepting bids');
  }

  let bid = await Application.findOne({ tenderId: tender._id, applicant: req.user._id });

  if (bid && bid.status !== 'draft') {
    /*
      A submitted bid is a commitment the buyer may already be evaluating.
      Editing it in place would change what was submitted without any record
      that it changed — so the bidder withdraws and bids again instead.
    */
    res.status(409);
    throw new Error('This bid has already been submitted and can no longer be edited');
  }

  if (!bid) {
    bid = new Application({
      tenderId: tender._id,
      applicant: req.user._id,
      companyId: req.body.companyId || undefined,
      status: 'draft',
      history: [{ from: null, to: 'draft', by: req.user._id }]
    });

    /*
      A new bid starts from the buyer's bill of quantities, at zero rates. The
      bidder fills in prices rather than retyping the scope, which is what makes
      two bids comparable: the same lines in the same order, so a lower total
      means a better price and not a line quietly left out.
    */
    if (req.body.lineItems === undefined && tender.scopeItems?.length) {
      bid.lineItems = tender.scopeItems.map((item) => ({
        description: item.description,
        unit: item.unit || '',
        quantity: item.quantity,
        unitPriceBaisa: 0,
        lineTotalBaisa: 0
      }));
    }
  }

  applyBidFields(bid, req.body);
  await bid.save();

  res.status(200).json({ success: true, data: bid });
});

// @desc  Submit the caller's bid
// @route POST /api/applications/tender/:tenderId/submit
const submitBid = asyncHandler(async (req, res) => {
  await assertMayBid(req, res);

  const tender = await Tender.findById(req.params.tenderId);
  if (!tender) {
    res.status(404);
    throw new Error('Tender not found');
  }
  if (!tenderIsOpen(tender)) {
    res.status(400);
    throw new Error('The closing date for this tender has passed');
  }

  const bid = await Application.findOne({ tenderId: tender._id, applicant: req.user._id });
  if (!bid) {
    res.status(404);
    throw new Error('No bid to submit');
  }
  if (bid.status !== 'draft') {
    res.status(409);
    throw new Error('This bid has already been submitted');
  }

  // Whatever the last screen changed comes with the submit, so the bidder is
  // never told "saved" about one thing and "submitted" about another.
  applyBidFields(bid, req.body);

  /*
    What a draft may lack and a submission may not. Checked here rather than on
    the schema so a half-finished bid can still be saved.
  */
  const missing = [];
  if (!String(bid.contactName || '').trim()) missing.push('contactName');
  if (!String(bid.contactEmail || '').trim()) missing.push('contactEmail');
  if (!String(bid.proposalSummary || '').trim()) missing.push('proposalSummary');
  if (!bid.lineItems.length) missing.push('lineItems');
  if (!bid.documents.some((d) => d.slot === 'technical')) missing.push('technicalDocument');
  if (bid.hasExceptions && !String(bid.exceptionsNote || '').trim()) missing.push('exceptionsNote');

  if (missing.length) {
    res.status(400);
    throw new Error(`This bid is not ready to submit: ${missing.join(', ')}`);
  }

  bid.status = 'submitted';
  bid.submittedAt = new Date();
  bid.history.push({ from: 'draft', to: 'submitted', by: req.user._id });
  await bid.save();

  res.json({ success: true, data: bid });
});

/**
 * Loads the caller's own editable bid, or fails the request explaining why.
 *
 * Both document routes need the same three answers — does the bid exist, is it
 * the caller's, and is it still a draft — and getting any of them wrong on one
 * route and not the other is exactly how a submitted bid ends up quietly
 * changing. So they ask once, here.
 */
async function ownEditableBid(req, res) {
  const bid = await Application.findOne({
    tenderId: req.params.tenderId,
    applicant: req.user._id
  });
  if (!bid) {
    res.status(404);
    throw new Error('Save the bid before attaching files to it');
  }
  if (bid.status !== 'draft') {
    res.status(409);
    throw new Error('This bid has already been submitted and can no longer be edited');
  }
  return bid;
}

// @desc  Attach a file to the caller's draft bid
// @route POST /api/applications/tender/:tenderId/documents/:slot
const uploadBidDocument = asyncHandler(async (req, res) => {
  const { slot } = req.params;
  if (!BID_SLOTS[slot]) {
    res.status(400);
    throw new Error(`Unknown bid document slot '${slot}'`);
  }
  if (!req.file) {
    res.status(400);
    throw new Error('No file received');
  }

  const bid = await ownEditableBid(req, res);
  const meta = await persistDocument(req.file, slot, 'bids');
  meta.uploadedBy = req.user._id;

  /*
    One file per slot: re-uploading replaces. A tender asks for *the* technical
    proposal, and leaving two in place would leave the buyer to guess which the
    bidder meant.
  */
  const previous = bid.documents.find((d) => d.slot === slot && slot !== 'other');
  if (previous) bid.documents.pull(previous._id);
  bid.documents.push(meta);
  await bid.save();

  // The old file goes only once the record that pointed at it is saved, so a
  // failed save never leaves the bid referencing a file that is gone.
  if (previous) await removeStoredFile(previous.storedName, 'bids');

  res.status(201).json({ success: true, data: bid });
});

// @desc  Download a file attached to a bid
// @route GET /api/applications/tender/:tenderId/documents/:docId
const downloadBidDocument = asyncHandler(async (req, res) => {
  const bid = await Application.findOne({ tenderId: req.params.tenderId }).select('+documents');
  const doc = bid?.documents.id(req.params.docId);
  if (!bid || !doc) {
    res.status(404);
    throw new Error('Document not found');
  }

  /*
    A bid's files are commercially sensitive: they are the supplier's prices and
    method. Only the bidder who uploaded them and programme staff may read them,
    never another bidder on the same tender.
  */
  const owns = String(bid.applicant) === String(req.user._id);
  if (!owns && !isStaff(req.user)) {
    res.status(403);
    throw new Error('Not authorised to read this document');
  }

  /*
    The record can outlive the file. Uploads sit on the host's own disk, and on
    a platform that gives a free service an ephemeral one, a redeploy wipes it
    while the bid still lists the attachment. Saying so with a 404 is honest;
    letting `res.download` throw ENOENT would report a server fault for a file
    the server knows perfectly well is gone.
  */
  const fullPath = resolveStoredPath(doc.storedName, 'bids');
  if (!fs.existsSync(fullPath)) {
    res.status(404);
    throw new Error('This document is no longer in storage');
  }

  res.download(fullPath, doc.originalName);
});

// @desc  Remove a file from the caller's draft bid
// @route DELETE /api/applications/tender/:tenderId/documents/:docId
const deleteBidDocument = asyncHandler(async (req, res) => {
  const bid = await ownEditableBid(req, res);
  const doc = bid.documents.id(req.params.docId);
  if (!doc) {
    res.status(404);
    throw new Error('Document not found');
  }

  const { storedName } = doc;
  bid.documents.pull(doc._id);
  await bid.save();
  await removeStoredFile(storedName, 'bids');

  res.json({ success: true, data: bid });
});

// @desc  The caller's own bid on a tender, draft included
// @route GET /api/applications/tender/:tenderId/mine
const getMyBid = asyncHandler(async (req, res) => {
  const bid = await Application.findOne({
    tenderId: req.params.tenderId,
    applicant: req.user._id
  });
  res.json({ success: true, data: bid || null });
});

// @desc  Award a tender to one bid
// @route POST /api/applications/tender/:tenderId/award/:bidId
const awardTender = asyncHandler(async (req, res) => {
  const tender = await Tender.findById(req.params.tenderId);
  if (!tender) {
    res.status(404);
    throw new Error('Tender not found');
  }
  if (tender.awardedBid) {
    res.status(409);
    throw new Error('This tender has already been awarded');
  }

  const winner = await Application.findOne({
    _id: req.params.bidId,
    tenderId: tender._id
  });
  if (!winner) {
    res.status(404);
    throw new Error('That bid is not on this tender');
  }

  /*
    A draft was never submitted — the buyer is not supposed to have seen it,
    and awarding one would be awarding a price its author never stood behind.
  */
  if (winner.status === 'draft') {
    res.status(409);
    throw new Error('That bid was never submitted');
  }
  if (winner.status === 'withdrawn') {
    res.status(409);
    throw new Error('That bid was withdrawn');
  }

  /*
    Awarding is one decision with two halves: this bid wins, and every other
    bid loses. Leaving the others `submitted` would tell each of those
    suppliers that they are still in a competition that is over — so they are
    closed here, in the same operation, rather than waiting for someone to
    remember.
  */
  const others = await Application.find({
    tenderId: tender._id,
    _id: { $ne: winner._id },
    status: { $nin: ['draft', 'withdrawn', 'rejected'] }
  });

  // The previous state is read before it is overwritten, or the audit trail
  // records every award as having come from 'accepted'.
  const cameFrom = winner.status;
  const allowed = Application.TRANSITIONS[cameFrom] || [];
  if (!allowed.includes('accepted')) {
    /*
      A bid is reviewed before it is awarded. The lifecycle refuses the jump
      from 'submitted' straight to 'accepted' on purpose: it is what makes "we
      evaluated the bids" a fact in the record rather than a claim. Awarding
      does not get to step around that — it asks the buyer to move the bid into
      review first, which is the act it is pretending happened.
    */
    res.status(409);
    throw new Error(
      cameFrom === 'submitted'
        ? 'Move this bid into review before awarding it'
        : `A bid that is ${cameFrom} cannot be accepted`
    );
  }

  winner.status = 'accepted';
  winner.history.push({ from: cameFrom, to: 'accepted', by: req.user._id });
  await winner.save();

  for (const bid of others) {
    bid.history.push({ from: bid.status, to: 'rejected', by: req.user._id });
    bid.status = 'rejected';
    await bid.save();
  }

  tender.awardedBid = winner._id;
  tender.awardedAt = new Date();
  tender.status = 'awarded';
  await tender.save();

  res.json({
    success: true,
    data: { tender, awarded: winner, closed: others.length }
  });
});

module.exports = {
  awardTender,
  saveDraft,
  submitBid,
  getMyBid,
  uploadBidDocument,
  downloadBidDocument,
  deleteBidDocument,
  listApplications,
  getApplication,
  createApplication,
  updateStatus,
  getApplicationStats
};
