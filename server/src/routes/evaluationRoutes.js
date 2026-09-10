const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
} = require('../controllers/evaluationController');

const router = express.Router();

const evaluationValidation = [
  body('companyId').isMongoId().withMessage('A valid companyId is required'),
  body('icvPercentage').isFloat({ min: 0, max: 100 }).withMessage('ICV percentage must be 0-100'),
  body('financialStabilityIndex')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Financial Stability Index must be 0-100')
];

router.get('/', getEvaluations);
router.get('/:id', getEvaluationById);
router.post('/', protect, evaluationValidation, validate, createEvaluation);
router.put('/:id', protect, updateEvaluation);
router.delete('/:id', protect, deleteEvaluation);

module.exports = router;
