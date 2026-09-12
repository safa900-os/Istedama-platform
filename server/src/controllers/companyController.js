const asyncHandler = require('express-async-handler');
const Company = require('../models/Company');
const { normaliseCategories } = require('../config/categories');
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
/**
 * Accepts either shape of banking details and stores the list.
 *
 * A caller may send `bankAccounts`, or the four flat fields the form used
 * before accounts became a list. The flat fields are folded into a single
 * primary account so an older client keeps working unchanged, and they are
 * always dropped afterwards — they are virtuals on the model now, and assigning
 * to a virtual with no setter fails silently, which is exactly the kind of
 * quiet data loss banking details must not have.
 */
function normaliseBanking(payload) {
  const flat = ['bankName', 'iban', 'accountHolder', 'accountNumber'];

  if (Array.isArray(payload.bankAccounts)) {
    payload.bankAccounts = payload.bankAccounts
      .filter((a) => a && (a.iban || a.bankName))
      .slice(0, 5)
      .map((a) => ({
        bankName: String(a.bankName || '').trim(),
        accountHolder: String(a.accountHolder || '').trim(),
        accountNumber: String(a.accountNumber || '').trim(),
        iban: String(a.iban || '').trim().toUpperCase(),
        label: String(a.label || '').trim(),
        isPrimary: Boolean(a.isPrimary)
      }));
  } else if (payload.iban || payload.bankName) {
    payload.bankAccounts = [
      {
        bankName: String(payload.bankName || '').trim(),
        accountHolder: String(payload.accountHolder || '').trim(),
        accountNumber: String(payload.accountNumber || '').trim(),
        iban: String(payload.iban || '').trim().toUpperCase(),
        isPrimary: true
      }
    ];
  }

  for (const key of flat) delete payload[key];
}

const createCompany = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user) payload.owner = req.user._id;

  /*
    The registration type follows the account, not the request body, so a
    crafted payload cannot cross the boundary between types.
  */
  const TYPE_FOR_ROLE = {
    merchant: 'merchant',
    freelancer: 'freelance',
    sme_owner: 'organization'
  };
  if (req.user && req.user.role !== 'admin') {
    payload.entityType = TYPE_FOR_ROLE[req.user.role] || 'organization';
  }

  /*
    Banking details belong to whoever gets paid: a merchant supplying goods and
    a self-employed practitioner invoicing for work both do. An organisation is
    the buyer here, so it has no account on its record.
  */
  if (payload.entityType === 'organization') {
    delete payload.bankAccounts;
  }
  normaliseBanking(payload);

  if (payload.serviceCategories !== undefined) {
    payload.serviceCategories = normaliseCategories(payload.serviceCategories);
  }

  /*
    Fields that only mean something for one type are dropped from the others,
    so a merchant record cannot quietly carry a freelance permit number.
  */
  const FREELANCE_ONLY = [
    'civilNumber', 'profession', 'professionAr', 'specialisation',
    'specialisationAr', 'freelancePermitNo', 'ecommerceLicenceNo',
    'storeUrl', 'socialUrl', 'maroofUrl'
  ];
  if (payload.entityType !== 'freelance') {
    for (const key of FREELANCE_ONLY) delete payload[key];
  } else {
    // A permit covers one person working alone.
    payload.employeeCount = 1;
    payload.omaniEmployeeCount = 1;
    delete payload.crNumber;
    delete payload.legalForm;
  }

  const company = await Company.create(payload);
  res.status(201).json({ success: true, data: company });
});

// @desc  Update a company profile
// @route PUT /api/companies/:id
const updateCompany = asyncHandler(async (req, res) => {
  /*
    Loaded, assigned and saved rather than updated in place. `findByIdAndUpdate`
    does not run document middleware, and the rule that exactly one bank account
    is primary lives in a pre-validate hook — an update that bypassed it could
    leave a record with two primaries, or none, and no answer to which account
    gets paid.
  */
  const company = await Company.findById(req.params.id);
  if (!company) {
    res.status(404);
    throw new Error('Company not found');
  }

  const payload = { ...req.body };
  normaliseBanking(payload);
  if (payload.serviceCategories !== undefined) {
    payload.serviceCategories = normaliseCategories(payload.serviceCategories);
  }

  company.set(payload);
  await company.save();

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
