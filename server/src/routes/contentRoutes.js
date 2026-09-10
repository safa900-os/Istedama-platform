const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/contentController');

const router = express.Router();

/* Public reads */
router.get('/tenders', c.getTenders);
router.get('/tenders/:id', c.getTenderById);
router.get('/facilities', c.getFacilities);
router.get('/discounts', c.getDiscounts);
router.get('/news', c.getNews);
router.get('/impact', c.getImpact);
router.get('/ad-rates', c.getAdRates);

/* Public submissions — validated, priced server-side */
router.post(
  '/bookings',
  [
    body('facilityId').isMongoId().withMessage('A valid facility must be selected'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('bookingDate').isISO8601().withMessage('A valid booking date is required'),
    body('attendees').isInt({ min: 1 }).withMessage('Attendees must be at least 1'),
    body('startTime').matches(/^\d{2}:\d{2}$/).withMessage('Start time must be HH:MM'),
    body('endTime').matches(/^\d{2}:\d{2}$/).withMessage('End time must be HH:MM')
  ],
  validate,
  c.createBooking
);

router.post(
  '/advertisements',
  [
    body('orgName').trim().notEmpty().withMessage('Organisation name is required'),
    body('applicantName').trim().notEmpty().withMessage('Applicant name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone number is required'),
    body('title').trim().isLength({ min: 3, max: 120 }).withMessage('Title must be 3-120 characters'),
    body('description').trim().isLength({ min: 10, max: 250 }).withMessage('Description must be 10-250 characters'),
    body('durationDays').optional().isIn([7, 14, 30, 90]).withMessage('Unsupported duration')
  ],
  validate,
  c.createAdvertisement
);

/* Administrative reads */
router.get('/bookings', protect, c.getBookings);
router.get('/advertisements', protect, c.getAdvertisements);

module.exports = router;
