const asyncHandler = require('express-async-handler');
const { Tender, Facility, Booking, Advertisement, Discount, NewsPost } = require('../models/Content');
const Company = require('../models/Company');
const Evaluation = require('../models/Evaluation');

/* ------------------------------------------------------------------ Tenders */

/**
 * The tenders this caller is entitled to see.
 *
 * Anonymous visitors and suppliers who were not invited see the public ones.
 * An invited supplier also sees the tenders naming their company; staff see
 * everything, because they administer it.
 *
 * Returned as a query fragment rather than applied by filtering results,
 * so an invited tender is never fetched and then discarded — the database
 * never hands the process a record the caller may not read.
 */
async function visibilityFilter(user) {
  if (user && ['admin', 'auditor'].includes(user.role)) return {};

  const base = { visibility: 'public' };
  if (!user) return base;

  const company = await Company.findOne({ owner: user._id }).select('_id');
  if (!company) return base;

  return { $or: [base, { visibility: 'invited', invitedCompanies: company._id }] };
}

const getTenders = asyncHandler(async (req, res) => {
  const { category, status, limit, invited } = req.query;

  const query = { ...(await visibilityFilter(req.user)) };
  if (category && category !== 'all') query.category = category;
  if (status) query.status = status;

  /*
    `?invited=true` narrows to the closed competitions this caller was named
    in — the supplier's "my invitations" view. It cannot widen anything: the
    visibility filter above has already decided what is readable.
  */
  if (invited === 'true') {
    const company = req.user ? await Company.findOne({ owner: req.user._id }).select('_id') : null;
    query.visibility = 'invited';
    query.invitedCompanies = company ? company._id : null;
    delete query.$or;
  }

  const tenders = await Tender.find(query)
    .sort({ closingDate: 1 })
    .limit(Number(limit) || 50);
  res.json({ success: true, count: tenders.length, data: tenders });
});

const getTenderById = asyncHandler(async (req, res) => {
  // The same rule as the listing, applied to the direct fetch. Guessing an id
  // must not be a way around an invitation.
  const tender = await Tender.findOne({
    _id: req.params.id,
    ...(await visibilityFilter(req.user))
  });
  if (!tender) {
    res.status(404);
    throw new Error('Tender not found');
  }
  res.json({ success: true, data: tender });
});

/* --------------------------------------------------------------- Facilities */

const getFacilities = asyncHandler(async (req, res) => {
  const { type, search } = req.query;
  const query = {};
  if (type && type !== 'all') query.type = type;
  if (search) query.name = { $regex: search, $options: 'i' };

  const facilities = await Facility.find(query).sort({ pricePerHour: 1 });
  res.json({ success: true, count: facilities.length, data: facilities });
});

/**
 * Duration in hours between two "HH:MM" strings. Returns 0 when the range is
 * invalid or inverted, so pricing can never come out negative.
 */
function hoursBetween(start, end) {
  const [sh, sm] = String(start).split(':').map(Number);
  const [eh, em] = String(end).split(':').map(Number);
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? mins / 60 : 0;
}

// @desc  Create a booking request. The cost is computed here from the
//        facility's own rate — never accepted from the client.
// @route POST /api/content/bookings
const createBooking = asyncHandler(async (req, res) => {
  const { facilityId, startTime, endTime, attendees } = req.body;

  const facility = await Facility.findById(facilityId);
  if (!facility) {
    res.status(404);
    throw new Error('Facility not found');
  }
  if (!facility.available) {
    res.status(409);
    throw new Error('This facility is not currently available for booking');
  }

  const hours = hoursBetween(startTime, endTime);
  if (hours <= 0) {
    res.status(400);
    throw new Error('End time must be later than start time');
  }
  if (Number(attendees) > facility.capacity) {
    res.status(400);
    throw new Error(`This facility seats a maximum of ${facility.capacity}`);
  }

  const booking = await Booking.create({
    ...req.body,
    estimatedCost: Math.round(hours * facility.pricePerHour * 100) / 100,
    status: 'pending'
  });

  res.status(201).json({ success: true, data: booking });
});

const getBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .populate('facilityId', 'name nameAr pricePerHour')
    .sort({ createdAt: -1 });
  res.json({ success: true, count: bookings.length, data: bookings });
});

/* ---------------------------------------------------------- Advertisements */

// Base rate per placement, in OMR per 7-day week.
// Published rate card, weekly prices in OMR. Exposed as an array so the
// client can render it in order without reshaping; pricing is always applied
// server-side from this table, never from anything the applicant sends.
/*
 * The published rate card, transcribed from the programme's advertising page:
 * three placements at 15, 25 and 40 rials a week. The table here previously
 * listed four at 15/25/30/45, so an advertiser reading that page was quoted
 * one price and charged another.
 *
 * Each row carries its own label in both languages: the client was rendering
 * `r.label` from this response, and nothing here supplied one, so the
 * placement menu showed a bare price with no name beside it.
 */
const AD_RATES = Object.freeze([
  {
    id: 'services_card',
    weeklyPrice: 15,
    label: 'Card above the services',
    labelAr: 'بطاقة قبل الخدمات'
  },
  {
    id: 'homepage_banner',
    weeklyPrice: 25,
    label: 'Main banner',
    labelAr: 'بانر رئيسي'
  },
  {
    id: 'featured',
    weeklyPrice: 40,
    label: 'Featured advert in the page',
    labelAr: 'إعلان مميز في الصفحة'
  }
]);

const rateFor = (placement) =>
  (AD_RATES.find((r) => r.id === placement) || AD_RATES[0]).weeklyPrice;

// @desc  Submit an advertising request. Price is quoted server-side from the
//        published rate card so a client cannot set its own price.
// @route POST /api/content/advertisements
const createAdvertisement = asyncHandler(async (req, res) => {
  const { placement = 'services_card', durationDays = 7 } = req.body;

  const weeklyRate = rateFor(placement);
  const quotedPrice = Math.round((weeklyRate * (Number(durationDays) / 7)) * 100) / 100;

  const ad = await Advertisement.create({
    ...req.body,
    quotedPrice,
    status: 'submitted'
  });

  res.status(201).json({ success: true, data: ad });
});

const getAdvertisements = asyncHandler(async (req, res) => {
  const ads = await Advertisement.find().sort({ createdAt: -1 });
  res.json({ success: true, count: ads.length, data: ads });
});

const getAdRates = asyncHandler(async (req, res) => {
  res.json({ success: true, data: AD_RATES });
});

/* ----------------------------------------------------------- Discounts */

const getDiscounts = asyncHandler(async (req, res) => {
  const { category } = req.query;
  const query = { active: true };
  if (category && category !== 'all') query.category = category;

  const discounts = await Discount.find(query).sort({ percentage: -1 });
  res.json({ success: true, count: discounts.length, data: discounts });
});

/* ---------------------------------------------------------------- News */

const getNews = asyncHandler(async (req, res) => {
  const news = await NewsPost.find()
    .sort({ publishedAt: -1 })
    .limit(Number(req.query.limit) || 12);
  res.json({ success: true, count: news.length, data: news });
});

/* -------------------------------------------------------- Impact metrics */

// @desc  Aggregated programme-wide figures for the impact dashboard.
// @route GET /api/content/impact
const getImpact = asyncHandler(async (req, res) => {
  const [totalCompanies, activeTenders, facilities, discounts, evaluations] = await Promise.all([
    Company.countDocuments(),
    Tender.countDocuments({ status: 'open' }),
    Facility.countDocuments(),
    Discount.countDocuments({ active: true }),
    Evaluation.find().select('calculatedScore certificateIssued icvPercentage')
  ]);

  const certified = evaluations.filter((e) => e.certificateIssued).length;
  const avgScore = evaluations.length
    ? Math.round((evaluations.reduce((s, e) => s + e.calculatedScore, 0) / evaluations.length) * 10) / 10
    : 0;
  const avgIcv = evaluations.length
    ? Math.round((evaluations.reduce((s, e) => s + e.icvPercentage, 0) / evaluations.length) * 10) / 10
    : 0;

  res.json({
    success: true,
    data: {
      totalCompanies,
      activeTenders,
      facilities,
      discounts,
      certified,
      avgScore,
      avgIcv,
      evaluationsCompleted: evaluations.length
    }
  });
});

module.exports = {
  getTenders,
  getTenderById,
  getFacilities,
  createBooking,
  getBookings,
  createAdvertisement,
  getAdvertisements,
  getAdRates,
  getDiscounts,
  getNews,
  getImpact,
  AD_RATES,
  hoursBetween
};
