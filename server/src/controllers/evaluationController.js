const asyncHandler = require('express-async-handler');
const Evaluation = require('../models/Evaluation');
const Company = require('../models/Company');
const {
  calculateIstedamaScore,
  qualifiesForCertificate,
  generateCertificateSerial
} = require('../utils/calculateScore');

/**
 * Shared "run the business logic" step used by both create and update,
 * so the Score formula is only ever executed in one place.
 */
async function applyScoreLogic(companyId, icvPercentage, financialStabilityIndex) {
  const company = await Company.findById(companyId);
  if (!company) {
    const err = new Error('Referenced company not found');
    err.statusCode = 404;
    throw err;
  }

  const omanizationRateSnapshot = company.omanizationRate;

  const calculatedScore = calculateIstedamaScore({
    omanizationRate: omanizationRateSnapshot,
    financialStabilityIndex,
    icvContribution: icvPercentage
  });

  const certificateIssued = qualifiesForCertificate(calculatedScore);

  return { omanizationRateSnapshot, calculatedScore, certificateIssued };
}

// @desc  List evaluations, optionally filtered by company
// @route GET /api/evaluations
const getEvaluations = asyncHandler(async (req, res) => {
  const { companyId } = req.query;
  const query = companyId ? { companyId } : {};
  const evaluations = await Evaluation.find(query)
    .populate('companyId', 'companyName crNumber governorate')
    .sort({ evaluationDate: -1 });
  res.json({ success: true, count: evaluations.length, data: evaluations });
});

// @desc  Get one evaluation
// @route GET /api/evaluations/:id
const getEvaluationById = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id).populate('companyId');
  if (!evaluation) {
    res.status(404);
    throw new Error('Evaluation not found');
  }
  res.json({ success: true, data: evaluation });
});

// @desc  Create a new evaluation. Runs the Istedama Score business logic
//        server-side before saving, per spec: never trust a client-sent score.
// @route POST /api/evaluations
const createEvaluation = asyncHandler(async (req, res) => {
  const { companyId, auditorNotes, icvPercentage, financialStabilityIndex } = req.body;

  const { omanizationRateSnapshot, calculatedScore, certificateIssued } = await applyScoreLogic(
    companyId,
    icvPercentage,
    financialStabilityIndex
  );

  const evaluation = await Evaluation.create({
    companyId,
    auditorNotes,
    icvPercentage,
    financialStabilityIndex,
    omanizationRateSnapshot,
    calculatedScore,
    certificateIssued,
    certificateSerial: certificateIssued ? generateCertificateSerial(companyId) : null,
    evaluatedBy: req.user?._id
  });

  res.status(201).json({ success: true, data: evaluation });
});

// @desc  Update an evaluation. Re-runs scoring if any scoring input changed.
// @route PUT /api/evaluations/:id
const updateEvaluation = asyncHandler(async (req, res) => {
  const existing = await Evaluation.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Evaluation not found');
  }

  const icvPercentage = req.body.icvPercentage ?? existing.icvPercentage;
  const financialStabilityIndex = req.body.financialStabilityIndex ?? existing.financialStabilityIndex;

  const { omanizationRateSnapshot, calculatedScore, certificateIssued } = await applyScoreLogic(
    existing.companyId,
    icvPercentage,
    financialStabilityIndex
  );

  existing.auditorNotes = req.body.auditorNotes ?? existing.auditorNotes;
  existing.icvPercentage = icvPercentage;
  existing.financialStabilityIndex = financialStabilityIndex;
  existing.omanizationRateSnapshot = omanizationRateSnapshot;
  existing.calculatedScore = calculatedScore;
  existing.certificateIssued = certificateIssued;
  if (certificateIssued && !existing.certificateSerial) {
    existing.certificateSerial = generateCertificateSerial(existing.companyId);
  }

  await existing.save();
  res.json({ success: true, data: existing });
});

// @desc  Delete an evaluation
// @route DELETE /api/evaluations/:id
const deleteEvaluation = asyncHandler(async (req, res) => {
  const evaluation = await Evaluation.findById(req.params.id);
  if (!evaluation) {
    res.status(404);
    throw new Error('Evaluation not found');
  }
  await evaluation.deleteOne();
  res.json({ success: true, data: {} });
});

module.exports = {
  getEvaluations,
  getEvaluationById,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation
};
