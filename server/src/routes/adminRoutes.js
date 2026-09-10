const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const c = require('../controllers/adminController');

const router = express.Router();

/**
 * Every administrative route sits behind this pair, applied once at the top of
 * the router. Authorisation is therefore structural rather than something each
 * handler has to remember to re-check.
 */
router.use(protect, authorize('admin'));

router.get('/overview', c.getOverview);

router.get('/users', c.listUsers);

router.patch(
  '/users/:id/role',
  [body('role').isIn(c.ASSIGNABLE_ROLES).withMessage('Unknown role')],
  validate,
  c.updateUserRole
);

router.patch(
  '/users/:id/status',
  [body('active').isBoolean().withMessage('active must be true or false')],
  validate,
  c.updateUserStatus
);

router.delete('/users/:id', c.deleteUser);

router.patch(
  '/advertisements/:id/status',
  [body('status').isIn(['approved', 'rejected', 'pending'])],
  validate,
  c.moderateAdvertisement
);

router.patch(
  '/bookings/:id/status',
  [body('status').isIn(['confirmed', 'cancelled', 'pending'])],
  validate,
  c.moderateBooking
);

module.exports = router;
