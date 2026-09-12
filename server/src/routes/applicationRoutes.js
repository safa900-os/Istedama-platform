const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const Application = require('../models/Application');
const c = require('../controllers/applicationController');

const { receiveBidDocument } = require('../middleware/upload');
const router = express.Router();

// Applying to a tender is never anonymous, so the whole router requires a
// session. Ownership is then enforced per-record inside the controller.
router.use(protect);

router.get('/stats', c.getApplicationStats);

/*
  The bid routes are addressed by tender, not by bid id: a bidder has at most
  one bid per tender and does not know its id before the first save. They are
  declared before '/:id' so 'tender' is never read as an application id.
*/
router.get('/tender/:tenderId/mine', c.getMyBid);

router.put(
  '/tender/:tenderId/draft',
  [
    body('validityDays').optional().isInt({ min: 1, max: 365 })
      .withMessage('Bid validity is between 1 and 365 days'),
    body('vatRate').optional().isFloat({ min: 0, max: 100 }).withMessage('Unknown VAT rate'),
    body('lineItems').optional().isArray({ max: 200 })
      .withMessage('A bill of quantities may hold at most 200 lines'),
    body('lineItems.*.quantity').optional().isFloat({ min: 0 })
      .withMessage('A quantity cannot be negative'),
    body('lineItems.*.unitPrice').optional().isFloat({ min: 0 })
      .withMessage('A unit price cannot be negative')
  ],
  validate,
  c.saveDraft
);

router.post('/tender/:tenderId/submit', c.submitBid);

router.post(
  '/tender/:tenderId/documents/:slot',
  receiveBidDocument,
  c.uploadBidDocument
);
router.get('/tender/:tenderId/documents/:docId', c.downloadBidDocument);

/* Awarding closes a competition, so it is staff-only. */
router.post(
  '/tender/:tenderId/award/:bidId',
  authorize('admin', 'auditor'),
  c.awardTender
);
router.delete('/tender/:tenderId/documents/:docId', c.deleteBidDocument);

router.get('/', c.listApplications);
router.get('/:id', c.getApplication);

router.post(
  '/',
  [
    body('tenderId').isMongoId().withMessage('A valid tender is required'),
    body('contactName').trim().isLength({ min: 2, max: 120 }).withMessage('Enter a contact name'),
    body('contactEmail').trim().isEmail().withMessage('Enter a valid contact email'),
    body('proposalSummary').trim().isLength({ min: 20, max: 2000 })
      .withMessage('Describe your proposal in at least 20 characters'),
    body('quotedAmount').optional({ values: 'null' }).isFloat({ min: 0 })
      .withMessage('Quoted amount cannot be negative')
  ],
  validate,
  c.createApplication
);

router.patch(
  '/:id/status',
  [body('status').isIn(Application.STATUSES).withMessage('Unknown application status')],
  validate,
  c.updateStatus
);

module.exports = router;
