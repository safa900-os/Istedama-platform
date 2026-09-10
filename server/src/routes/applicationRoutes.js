const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const Application = require('../models/Application');
const c = require('../controllers/applicationController');

const router = express.Router();

// Applying to a tender is never anonymous, so the whole router requires a
// session. Ownership is then enforced per-record inside the controller.
router.use(protect);

router.get('/stats', c.getApplicationStats);
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
