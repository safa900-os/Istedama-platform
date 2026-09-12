const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Verifies the Bearer JWT and attaches the authenticated user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;

  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token provided');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized, user no longer exists');
    }
    // A token issued before suspension must stop working immediately.
    if (req.user.active === false) {
      res.status(403);
      throw new Error('This account has been suspended');
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error('Not authorized, token invalid or expired');
  }
});

/** Restricts a route to one or more roles, e.g. authorize('admin','auditor') */
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user?.role}' is not permitted to perform this action`);
  }
  next();
};

/**
 * Reads the caller if there is one, and does not mind if there is not.
 *
 * `protect` answers "you must be signed in". Some reads need the weaker
 * question "who is this, if anyone?" — a tender list is public, but a bidder
 * signed in should also see the tenders they were invited to. Without this,
 * that endpoint would have to be either closed to visitors or blind to
 * invitations.
 *
 * A bad or expired token is treated as no token rather than as an error: this
 * route works for anonymous callers, so a stale one in localStorage should
 * degrade to the public view instead of failing the page.
 */
const identify = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();

  try {
    const { id } = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(id).select('-password');
    if (user && user.active !== false) req.user = user;
  } catch {
    /* not signed in, which is allowed here */
  }
  next();
});

module.exports = { protect, authorize, identify };
