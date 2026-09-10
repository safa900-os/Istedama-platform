const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: true
    },
    auditorNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    auditorNotesAr: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: ''
    },
    icvPercentage: {
      type: Number,
      required: [true, 'ICV contribution percentage is required'],
      min: 0,
      max: 100
    },
    financialStabilityIndex: {
      type: Number,
      required: [true, 'Financial Stability Index (0-100) is required'],
      min: 0,
      max: 100
    },
    // Snapshot of the Omanization rate used at evaluation time, so historical
    // scores stay correct even if the company's staffing later changes.
    omanizationRateSnapshot: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    calculatedScore: {
      type: Number,
      min: 0,
      max: 100
    },
    certificateIssued: {
      type: Boolean,
      default: false
    },
    certificateSerial: {
      type: String,
      default: null
    },
    evaluationDate: {
      type: Date,
      default: Date.now
    },
    evaluatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

evaluationSchema.index({ companyId: 1, evaluationDate: -1 });

module.exports = mongoose.model('Evaluation', evaluationSchema);
