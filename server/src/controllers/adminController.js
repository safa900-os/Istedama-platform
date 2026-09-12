const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Company = require('../models/Company');
const Evaluation = require('../models/Evaluation');
const { Tender, Facility, Booking, Advertisement, Discount, NewsPost } = require('../models/Content');

/**
 * Administrative surface.
 *
 * Every route in this file is mounted behind `protect` + `authorize('admin')`,
 * so authorisation is enforced once at the router rather than re-checked in
 * each handler. Nothing here is reachable by a merchant or SME owner even with
 * a valid token, and no handler trusts a role sent in the request body.
 *
 * Two safety rules are deliberate:
 *   1. An admin cannot change their own role or deactivate themselves, which
 *      would leave the deployment with no way back in.
 *   2. The last remaining active admin cannot be demoted or removed.
 */

const ASSIGNABLE_ROLES = ['sme_owner', 'merchant', 'freelancer', 'auditor', 'admin'];

const publicUser = (u) => ({
  _id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  active: u.active !== false,
  createdAt: u.createdAt
});

async function countActiveAdmins(excludeId) {
  const query = { role: 'admin', active: { $ne: false } };
  if (excludeId) query._id = { $ne: excludeId };
  return User.countDocuments(query);
}

/* ------------------------------------------------------------------ Users */

// @desc  List every user, with search and role filtering
// @route GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query;
  const query = {};

  if (role && role !== 'all') query.role = role;
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [{ name: rx }, { email: rx }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: users.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: users.map(publicUser)
  });
});

// @desc  Change a user's role
// @route PATCH /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  if (!ASSIGNABLE_ROLES.includes(role)) {
    res.status(400);
    throw new Error(`Role must be one of: ${ASSIGNABLE_ROLES.join(', ')}`);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.equals(req.user._id)) {
    res.status(400);
    throw new Error('You cannot change your own role');
  }

  if (user.role === 'admin' && role !== 'admin' && (await countActiveAdmins(user._id)) === 0) {
    res.status(400);
    throw new Error('At least one active administrator must remain');
  }

  user.role = role;
  await user.save();

  res.json({ success: true, data: publicUser(user) });
});

// @desc  Activate or suspend a user
// @route PATCH /api/admin/users/:id/status
const updateUserStatus = asyncHandler(async (req, res) => {
  const active = Boolean(req.body.active);

  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.equals(req.user._id)) {
    res.status(400);
    throw new Error('You cannot suspend your own account');
  }

  if (!active && user.role === 'admin' && (await countActiveAdmins(user._id)) === 0) {
    res.status(400);
    throw new Error('At least one active administrator must remain');
  }

  user.active = active;
  await user.save();

  res.json({ success: true, data: publicUser(user) });
});

// @desc  Delete a user and detach their records
// @route DELETE /api/admin/users/:id
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user._id.equals(req.user._id)) {
    res.status(400);
    throw new Error('You cannot delete your own account');
  }

  if (user.role === 'admin' && (await countActiveAdmins(user._id)) === 0) {
    res.status(400);
    throw new Error('At least one active administrator must remain');
  }

  // Companies outlive their owner: detach rather than cascade-delete, so
  // removing a user never silently destroys programme data.
  await Company.updateMany({ owner: user._id }, { $unset: { owner: '' } });
  await Evaluation.updateMany({ evaluatedBy: user._id }, { $unset: { evaluatedBy: '' } });
  await user.deleteOne();

  res.json({ success: true, data: {} });
});

/* -------------------------------------------------------------- Overview */

// @desc  Everything an administrator needs on one screen
// @route GET /api/admin/overview
const getOverview = asyncHandler(async (req, res) => {
  const [
    usersByRole, totalUsers, suspended,
    totalCompanies, byEntityType,
    evaluations, certified,
    openTenders, pendingAds, pendingBookings,
    recentUsers, recentCompanies
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    User.countDocuments(),
    User.countDocuments({ active: false }),
    Company.countDocuments(),
    Company.aggregate([{ $group: { _id: '$entityType', count: { $sum: 1 } } }]),
    Evaluation.countDocuments(),
    Evaluation.countDocuments({ certificateIssued: true }),
    Tender.countDocuments({ status: 'open' }),
    Advertisement.countDocuments({ status: 'pending' }),
    Booking.countDocuments({ status: 'pending' }),
    User.find().sort({ createdAt: -1 }).limit(5),
    Company.find().sort({ createdAt: -1 }).limit(5).select('companyName companyNameAr governorate entityType createdAt')
  ]);

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        suspended,
        byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {})
      },
      companies: {
        total: totalCompanies,
        byEntityType: byEntityType.reduce((acc, r) => ({ ...acc, [r._id || 'organization']: r.count }), {})
      },
      evaluations: { total: evaluations, certified },
      queues: { openTenders, pendingAds, pendingBookings },
      recentUsers: recentUsers.map(publicUser),
      recentCompanies
    }
  });
});

/* ------------------------------------------------------------ Moderation */

// @desc  Approve or reject a pending advertising request
// @route PATCH /api/admin/advertisements/:id/status
/* ------------------------------------------------- registration review

  A registration is reviewed by a person before the applicant may trade. These
  three endpoints are that review: the queue, the approval, and the rejection.

  They are deliberately not one `PATCH /:id/status` taking any value. Approving
  and rejecting are different acts with different obligations — a rejection owes
  the applicant a reason — and collapsing them into one endpoint that trusts a
  string is how a rejection ends up stored with no explanation.
*/

/** Every registration awaiting a decision, oldest first — a queue, not a list. */
const listRegistrations = asyncHandler(async (req, res) => {
  const { status = 'submitted', entityType } = req.query;

  const filter = {};
  if (status !== 'all') filter.registrationStatus = status;
  if (entityType) filter.entityType = entityType;

  const registrations = await Company.find(filter)
    .select('companyName companyNameAr crNumber entityType governorate registrationStatus submittedAt reviewedAt rejectionReason documents owner')
    .populate('owner', 'name email phone role')
    .sort({ submittedAt: 1 });

  res.json({ success: true, count: registrations.length, data: registrations });
});

/** Moves a registration through its lifecycle, refusing any jump it does not allow. */
async function transition(req, res, to, extra = {}) {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Registration not found');
  }

  const allowed = Company.REGISTRATION_TRANSITIONS[company.registrationStatus] || [];
  if (!allowed.includes(to)) {
    res.status(409);
    throw new Error(
      `A registration that is ${company.registrationStatus} cannot become ${to}`
    );
  }

  company.registrationStatus = to;
  company.reviewedAt = new Date();
  company.reviewedBy = req.user._id;
  Object.assign(company, extra);
  await company.save();

  res.json({ success: true, data: company });
}

const approveRegistration = asyncHandler((req, res) => transition(req, res, 'approved'));

const rejectRegistration = asyncHandler((req, res) =>
  transition(req, res, 'rejected', { rejectionReason: String(req.body.reason || '').trim() })
);

const reviewRegistration = asyncHandler((req, res) => transition(req, res, 'under_review'));

const moderateAdvertisement = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    res.status(400);
    throw new Error('Status must be approved, rejected or pending');
  }

  const ad = await Advertisement.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );
  if (!ad) {
    res.status(404);
    throw new Error('Advertising request not found');
  }

  res.json({ success: true, data: ad });
});

// @desc  Confirm or cancel a facility booking
// @route PATCH /api/admin/bookings/:id/status
const moderateBooking = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!['confirmed', 'cancelled', 'pending'].includes(status)) {
    res.status(400);
    throw new Error('Status must be confirmed, cancelled or pending');
  }

  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('facilityId', 'name nameAr');
  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  res.json({ success: true, data: booking });
});

module.exports = {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  reviewRegistration,
  ASSIGNABLE_ROLES,
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getOverview,
  moderateAdvertisement,
  moderateBooking
};
