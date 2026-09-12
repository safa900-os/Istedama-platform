const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');

/**
 * A user's own notices.
 *
 * Scoped to the caller at the query, never filtered after the fact: a
 * notification carries a rejection reason and a document's expiry, which is
 * nobody else's business.
 */

// @desc  The caller's notifications, newest first
// @route GET /api/notifications
const listMine = asyncHandler(async (req, res) => {
  const { unread, limit } = req.query;

  const filter = { user: req.user._id };
  if (unread === 'true') filter.readAt = null;

  const notifications = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100));

  const unreadCount = await Notification.countDocuments({ user: req.user._id, readAt: null });

  res.json({
    success: true,
    count: notifications.length,
    unreadCount,
    data: notifications
  });
});

// @desc  Mark one notification read
// @route PATCH /api/notifications/:id/read
const markRead = asyncHandler(async (req, res) => {
  /*
    Matched on id *and* user in one query. Fetching by id and then checking the
    owner would leak existence — a wrong id and someone else's id would give
    different answers.
  */
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id, readAt: null },
    { readAt: new Date() },
    { new: true }
  );

  if (!notification) {
    // Already read, or not theirs. Either way there is nothing to report.
    res.status(404);
    throw new Error('Notification not found');
  }

  res.json({ success: true, data: notification });
});

// @desc  Mark every unread notification read
// @route PATCH /api/notifications/read-all
const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { user: req.user._id, readAt: null },
    { readAt: new Date() }
  );

  res.json({ success: true, data: { marked: result.modifiedCount } });
});

module.exports = { listMine, markRead, markAllRead };
