const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { receiveDocument } = require('../middleware/upload');
const {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getOverviewStats
} = require('../controllers/companyController');
const {
  getCatalogue,
  listDocuments,
  uploadDocument,
  downloadDocument,
  deleteDocument
} = require('../controllers/documentController');

const router = express.Router();

const companyValidation = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('companyNameAr').optional({ values: 'falsy' }).trim(),
  body('entityType').optional().isIn(['organization', 'merchant']).withMessage('Unknown registration type'),
  body('bankName').optional({ values: 'falsy' }).trim(),
  body('accountHolder').optional({ values: 'falsy' }).trim(),
  body('iban').optional({ values: 'falsy' }).trim()
    .matches(/^OM\d{2}[A-Z0-9]{3,30}$/i).withMessage('IBAN must be a valid Omani IBAN'),
  body('sectorAr').optional({ values: 'falsy' }).trim(),
  body('crNumber').matches(/^[0-9]{4,10}$/).withMessage('CR number must be 4-10 digits'),
  body('governorate').notEmpty().withMessage('Governorate is required'),
  body('employeeCount').isInt({ min: 1 }).withMessage('Employee count must be at least 1'),
  body('omaniEmployeeCount').isInt({ min: 0 }).withMessage('Omani employee count must be 0 or more'),
  body('location.lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('location.lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),

  // Merchant details. All optional at this stage — the assessment chases what
  // is missing rather than blocking registration on it.
  body('contactPhone').optional({ values: 'falsy' }).trim()
    .matches(/^\+?[\d\s-]{8,15}$/).withMessage('Enter a valid phone number'),
  body('legalForm').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('address').optional({ values: 'falsy' }).trim().isLength({ max: 300 }),
  body('website').optional({ values: 'falsy' }).trim()
    .matches(/^https?:\/\/\S+\.\S+/).withMessage('Website must begin with http:// or https://'),
  body('category').optional({ values: 'falsy' })
    .isIn(['contracting', 'it', 'supplies', 'consulting']).withMessage('Unknown category'),
  body('isSme').optional().isBoolean().withMessage('isSme must be true or false'),
  body('accountNumber').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),

  // Organisation details.
  body('description').optional({ values: 'falsy' }).trim().isLength({ max: 2000 }),
  body('organizationType').optional({ values: 'falsy' })
    .isIn(['waqf', 'association', 'civil', 'nonprofit']).withMessage('Unknown organisation type'),
  body('registrationExpiry').optional({ values: 'falsy' }).isISO8601()
    .withMessage('Enter a valid registration expiry date'),
  body('proofExpiry').optional({ values: 'falsy' }).isISO8601()
    .withMessage('Enter a valid proof expiry date'),
  body('representativeName').optional({ values: 'falsy' }).trim().isLength({ max: 150 }),
  body('representativeNationalId').optional({ values: 'falsy' }).trim().isLength({ max: 30 }),
  body('representativePhone').optional({ values: 'falsy' }).trim()
    .matches(/^\+?[\d\s-]{8,15}$/).withMessage('Enter a valid phone number'),

  // The NDA is a claim the client makes, so the server checks it is present
  // and is a real date rather than trusting the interface to have gated it.
  body('ndaSignedAt').optional({ values: 'falsy' }).isISO8601()
    .withMessage('Invalid agreement timestamp')
];

router.get('/stats/overview', getOverviewStats);
// Declared before '/:id' so a literal segment is never read as an id.
router.get('/documents/catalogue', getCatalogue);
router.get('/', getCompanies);
router.get('/:id', getCompanyById);
router.post('/', protect, companyValidation, validate, createCompany);
router.put('/:id', protect, updateCompany);
router.delete('/:id', protect, deleteCompany);

// Attachments. Every one of these is behind `protect`; the controller then
// authorises against the company itself, since ownership — not merely being
// signed in — is what grants access to another business's paperwork.
router.get('/:id/documents', protect, listDocuments);
router.post('/:id/documents/:slot', protect, receiveDocument, uploadDocument);
router.get('/:id/documents/:slot/file', protect, downloadDocument);
router.delete('/:id/documents/:slot', protect, deleteDocument);

module.exports = router;
