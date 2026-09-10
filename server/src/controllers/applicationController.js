const asyncHandler = require('express-async-handler');
const Application = require('../models/Application');
const { Tender } = require('../models/Content');

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

module.exports = {
  listApplications,
  getApplication,
  createApplication,
  updateStatus,
  getApplicationStats
};
