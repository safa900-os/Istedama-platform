const asyncHandler = require('express-async-handler');
const Company = require('../models/Company');
const Evaluation = require('../models/Evaluation');

// @desc  List companies (search, filter by governorate, paginate)
// @route GET /api/companies
const getCompanies = asyncHandler(async (req, res) => {
  const { search, governorate, page = 1, limit = 12 } = req.query;
  const query = {};

  if (search) {
    query.$text = { $search: search };
  }
  if (governorate) {
    query.governorate = governorate;
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [companies, total] = await Promise.all([
    Company.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Company.countDocuments(query)
  ]);

  res.json({
    success: true,
    count: companies.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: companies
  });
});

// @desc  Get a single company plus its latest evaluation
// @route GET /api/companies/:id
const getCompanyById = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  const latestEvaluation = await Evaluation.findOne({ companyId: company._id }).sort({
    evaluationDate: -1
  });

  res.json({ success: true, data: { company, latestEvaluation } });
});

// @desc  Register a new SME
// @route POST /api/companies
const createCompany = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user) payload.owner = req.user._id;

  // The registration type follows the account, not the request body. A
  // merchant account always creates a merchant record and an SME owner always
  // creates an organisation, so a crafted payload cannot cross the boundary.
  if (req.user && req.user.role !== 'admin') {
    payload.entityType = req.user.role === 'merchant' ? 'merchant' : 'organization';
  }

  // Banking details only belong on a merchant record.
  if (payload.entityType !== 'merchant') {
    delete payload.bankName;
    delete payload.iban;
    delete payload.accountHolder;
  }

  const company = await Company.create(payload);
  res.status(201).json({ success: true, data: company });
});

// @desc  Update a company profile
// @route PUT /api/companies/:id
const updateCompany = asyncHandler(async (req, res) => {
  const company = await Company.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  res.json({ success: true, data: company });
});

// @desc  Remove a company (and its evaluation history)
// @route DELETE /api/companies/:id
const deleteCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }
  await Evaluation.deleteMany({ companyId: company._id });
  await company.deleteOne();
  res.json({ success: true, data: {} });
});

// @desc  Aggregate stats for the dashboard (governorate spread, avg scores)
// @route GET /api/companies/stats/overview
const getOverviewStats = asyncHandler(async (req, res) => {
  const totalCompanies = await Company.countDocuments();
  const byGovernorate = await Company.aggregate([
    { $group: { _id: '$governorate', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);
  const avgOmanization = await Company.aggregate([
    {
      $project: {
        rate: {
          $cond: [
            { $eq: ['$employeeCount', 0] },
            0,
            { $multiply: [{ $divide: ['$omaniEmployeeCount', '$employeeCount'] }, 100] }
          ]
        }
      }
    },
    { $group: { _id: null, avg: { $avg: '$rate' } } }
  ]);

  res.json({
    success: true,
    data: {
      totalCompanies,
      byGovernorate,
      avgOmanizationRate: avgOmanization[0] ? Math.round(avgOmanization[0].avg * 10) / 10 : 0
    }
  });
});

module.exports = {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  deleteCompany,
  getOverviewStats
};
