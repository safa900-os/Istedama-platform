const mongoose = require('mongoose');

/**
 * Programme content models.
 *
 * Every user-facing text field is stored in both languages (`x` / `xAr`) so
 * the platform can switch language completely, including database content.
 * The Arabic variants are optional: the client's `pick()` helper falls back
 * to English, so records created before a translation exists still render.
 */

// ---------------------------------------------------------------- Tenders
const tenderSchema = new mongoose.Schema(
  {
    refNo: { type: Number, required: true, unique: true },
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true, default: '' },
    orgName: { type: String, required: true, trim: true },
    orgNameAr: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: ['maintenance', 'supply', 'consulting', 'construction', 'technology'],
      default: 'supply'
    },
    location: { type: String, trim: true, default: '' },
    locationAr: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, maxlength: 2000, default: '' },
    descriptionAr: { type: String, trim: true, maxlength: 2000, default: '' },
    closingDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['open', 'evaluating', 'awarded', 'closed'],
      default: 'open'
    },
    documentsRequired: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// ------------------------------------------------------------- Facilities
const facilitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameAr: { type: String, trim: true, default: '' },
    type: {
      type: String,
      enum: ['meeting', 'delegation', 'training', 'conference', 'business_centre'],
      default: 'meeting'
    },
    description: { type: String, trim: true, default: '' },
    descriptionAr: { type: String, trim: true, default: '' },
    // Path under the client's public folder. Empty when the programme has no
    // photograph for the room; the card falls back rather than showing a
    // broken image.
    image: { type: String, trim: true, default: '' },
    pricePerHour: { type: Number, required: true, min: 0 },
    capacity: { type: Number, required: true, min: 1 },
    features: { type: [String], default: [] },
    featuresAr: { type: [String], default: [] },
    available: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// --------------------------------------------------------------- Bookings
const bookingSchema = new mongoose.Schema(
  {
    facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    orgName: { type: String, trim: true, default: '' },
    bookingDate: { type: Date, required: true },
    attendees: { type: Number, required: true, min: 1 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    purpose: { type: String, trim: true, maxlength: 1000, default: '' },
    extras: { type: String, trim: true, default: 'none' },
    // Computed server-side from facility rate and the booked duration.
    estimatedCost: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'rejected'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// --------------------------------------------------------- Advertisements
const advertisementSchema = new mongoose.Schema(
  {
    orgName: { type: String, required: true, trim: true },
    applicantName: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    placement: {
      type: String,
      // The three placements on the published rate card.
      enum: ['services_card', 'homepage_banner', 'featured'],
      default: 'services_card'
    },
    // 7, 14 or 30 days, as offered on the advertising page. The list here and
    // the one in the form had drifted apart: the form offered 60 days, which
    // this enum then rejected on save.
    durationDays: { type: Number, enum: [7, 14, 30], default: 7 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 250 },
    targetUrl: { type: String, trim: true, default: '' },
    startDate: { type: Date },
    // Priced server-side; the applicant never sets their own cost.
    quotedPrice: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['submitted', 'under_review', 'approved', 'rejected'],
      default: 'submitted'
    }
  },
  { timestamps: true }
);

// -------------------------------------------------------------- Discounts
const discountSchema = new mongoose.Schema(
  {
    partnerName: { type: String, required: true, trim: true },
    partnerNameAr: { type: String, trim: true, default: '' },
    category: {
      type: String,
      enum: ['financial', 'health', 'legal', 'technology', 'insurance'],
      required: true
    },
    percentage: { type: Number, required: true, min: 1, max: 100 },
    description: { type: String, trim: true, default: '' },
    descriptionAr: { type: String, trim: true, default: '' },
    code: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// ------------------------------------------------------------------- News
const newsSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleAr: { type: String, trim: true, default: '' },
    excerpt: { type: String, trim: true, maxlength: 400, default: '' },
    excerptAr: { type: String, trim: true, maxlength: 400, default: '' },
    tag: { type: String, trim: true, default: 'announcement' },
    // Path under the client's public folder; empty for a post with no
    // photograph, which the card then renders without one.
    image: { type: String, trim: true, default: '' },
    publishedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = {
  Tender: mongoose.model('Tender', tenderSchema),
  Facility: mongoose.model('Facility', facilitySchema),
  Booking: mongoose.model('Booking', bookingSchema),
  Advertisement: mongoose.model('Advertisement', advertisementSchema),
  Discount: mongoose.model('Discount', discountSchema),
  NewsPost: mongoose.model('NewsPost', newsSchema)
};
