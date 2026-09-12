/**
 * Seeds the database with 5 realistic Omani SME companies and one
 * evaluation each, running every evaluation through the real scoring
 * logic so seeded data is always internally consistent.
 *
 * Usage:
 *   node src/seed.js            -> import
 *   node src/seed.js --destroy  -> wipe collections
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Company = require('./models/Company');
const Evaluation = require('./models/Evaluation');
const User = require('./models/User');
const { seedContent } = require('./seedContent');
const {
  calculateIstedamaScore,
  qualifiesForCertificate,
  generateCertificateSerial
} = require('./utils/calculateScore');

const companies = [
  {
    companyName: 'Nabta Green Agritech LLC',
    companyNameAr: 'شركة نبتة الخضراء للتقنيات الزراعية ش.م.م',
    crNumber: '1102345',
    logo: '/companies/nabta-agritech.png',
    governorate: 'Ad Dakhiliyah',
    sector: 'Agriculture Technology',
    sectorAr: 'التقنيات الزراعية',
    employeeCount: 42,
    omaniEmployeeCount: 33,
    hasRiyadaCard: true,
    contactEmail: 'info@nabtagreen.om',
    registrationDate: new Date('2019-03-11'),
    location: { lat: 22.9333, lng: 57.5333, address: 'Nizwa, Ad Dakhiliyah' },
    evaluation: {
      icvPercentage: 68,
      financialStabilityIndex: 74,
      notes: 'Strong local sourcing of irrigation equipment; recommend expanding solar-pump ICV base.',
      notesAr: 'توريد محلي قوي لمعدات الري؛ يوصى بتوسيع قاعدة القيمة المحلية لمضخات الطاقة الشمسية.'
    }
  },
  {
    companyName: 'Al Bahja Marine Services SAOC',
    companyNameAr: 'شركة البهجة للخدمات البحرية ش.م.ع.م',
    crNumber: '1567890',
    logo: '/companies/bahja-marine.png',
    governorate: 'Muscat',
    sector: 'Maritime & Logistics',
    sectorAr: 'الخدمات البحرية واللوجستية',
    employeeCount: 118,
    omaniEmployeeCount: 79,
    hasRiyadaCard: false,
    contactEmail: 'contact@albahjamarine.om',
    registrationDate: new Date('2015-07-22'),
    location: { lat: 23.588, lng: 58.3829, address: 'Port Sultan Qaboos, Muscat' },
    evaluation: {
      icvPercentage: 55,
      financialStabilityIndex: 81,
      notes: 'Solid financials; Omanization trending up year-on-year after new training program.',
      notesAr: 'وضع مالي متين؛ نسبة التعمين في ارتفاع سنوي بعد إطلاق برنامج التدريب الجديد.'
    }
  },
  {
    companyName: 'Dhofar Frankincense Cooperative',
    companyNameAr: 'تعاونية ظفار للبخور واللبان',
    crNumber: '1023456',
    logo: '/companies/dhofar-frankincense.png',
    governorate: 'Dhofar',
    sector: 'Manufacturing & Heritage Crafts',
    sectorAr: 'الصناعات والحرف التراثية',
    employeeCount: 27,
    omaniEmployeeCount: 25,
    hasRiyadaCard: true,
    contactEmail: 'hello@dhofarfrank.om',
    registrationDate: new Date('2020-11-02'),
    location: { lat: 17.0151, lng: 54.0924, address: 'Salalah, Dhofar' },
    evaluation: {
      icvPercentage: 72,
      financialStabilityIndex: 63,
      notes: 'Excellent Omanization and heritage sourcing; working capital cycle needs tightening.',
      notesAr: 'تعمين ممتاز وتوريد تراثي متميز؛ تحتاج دورة رأس المال العامل إلى إحكام.'
    }
  },
  {
    companyName: 'Batinah Solar Solutions LLC',
    companyNameAr: 'شركة الباطنة لحلول الطاقة الشمسية ش.م.م',
    crNumber: '1345678',
    logo: '/companies/batinah-solar.png',
    governorate: 'Al Batinah North',
    sector: 'Renewable Energy',
    sectorAr: 'الطاقة المتجددة',
    employeeCount: 61,
    omaniEmployeeCount: 40,
    hasRiyadaCard: false,
    contactEmail: 'ops@batinahsolar.om',
    registrationDate: new Date('2018-01-15'),
    location: { lat: 24.3489, lng: 56.7469, address: 'Sohar, Al Batinah North' },
    evaluation: {
      icvPercentage: 61,
      financialStabilityIndex: 69,
      notes: 'Growing panel-assembly ICV; needs updated financial statements for full certification.',
      notesAr: 'نمو في القيمة المحلية لتجميع الألواح؛ تلزم قوائم مالية محدّثة لاستكمال الاعتماد.'
    }
  },
  {
    companyName: 'Musandam Adventure Tourism Est.',
    companyNameAr: 'مؤسسة مسندم لسياحة المغامرات',
    crNumber: '1789012',
    logo: '/companies/musandam-tourism.png',
    governorate: 'Musandam',
    sector: 'Tourism & Hospitality',
    sectorAr: 'السياحة والضيافة',
    employeeCount: 19,
    omaniEmployeeCount: 14,
    hasRiyadaCard: true,
    contactEmail: 'info@musandamadventure.om',
    registrationDate: new Date('2021-05-30'),
    location: { lat: 26.1927, lng: 56.2487, address: 'Khasab, Musandam' },
    evaluation: {
      icvPercentage: 48,
      financialStabilityIndex: 58,
      notes: 'Seasonal cash flow risk; sustainability practices (dhow fleet, waste mgmt) are strong.',
      notesAr: 'مخاطر موسمية في التدفق النقدي؛ ممارسات الاستدامة (أسطول السفن وإدارة النفايات) قوية.'
    }
  },
  {
    companyName: 'Sur Maritime Crafts LLC',
    companyNameAr: 'شركة صور للصناعات البحرية ش.م.م',
    crNumber: '1456701',
    logo: '/companies/sur-maritime.png',
    governorate: 'Ash Sharqiyah South',
    sector: 'Boatbuilding & Marine Crafts',
    sectorAr: 'بناء السفن والحرف البحرية',
    employeeCount: 34,
    omaniEmployeeCount: 29,
    hasRiyadaCard: true,
    contactEmail: 'info@surmaritime.om',
    registrationDate: new Date('2017-09-04'),
    location: { lat: 22.5667, lng: 59.5289, address: 'Sur, Ash Sharqiyah South' },
    evaluation: {
      icvPercentage: 74, financialStabilityIndex: 66,
      notes: 'Exceptional heritage boatbuilding skills retained in-house; export documentation needs strengthening.',
      notesAr: 'مهارات بناء السفن التراثية محفوظة داخلياً بامتياز؛ تحتاج مستندات التصدير إلى تعزيز.'
    }
  },
  {
    companyName: 'Buraimi Logistics Hub SPC',
    companyNameAr: 'شركة مركز البريمي اللوجستي ش.ش.و',
    crNumber: '1298345',
    logo: '/companies/buraimi-logistics.png',
    governorate: 'Al Buraimi',
    sector: 'Warehousing & Distribution',
    sectorAr: 'التخزين والتوزيع',
    employeeCount: 87,
    omaniEmployeeCount: 44,
    hasRiyadaCard: false,
    contactEmail: 'ops@buraimilogistics.om',
    registrationDate: new Date('2016-02-18'),
    location: { lat: 24.2500, lng: 55.7931, address: 'Al Buraimi' },
    evaluation: {
      icvPercentage: 52, financialStabilityIndex: 78,
      notes: 'Strong balance sheet and cross-border volumes; Omanization below sector benchmark.',
      notesAr: 'ميزانية قوية وأحجام عبور حدودي جيدة؛ نسبة التعمين دون معيار القطاع.'
    }
  },
  {
    companyName: 'Wusta Desert Wellness Est.',
    companyNameAr: 'مؤسسة الوسطى للعافية الصحراوية',
    crNumber: '1867234',
    logo: '/companies/wusta-wellness.png',
    governorate: 'Al Wusta',
    sector: 'Eco Tourism & Wellness',
    sectorAr: 'السياحة البيئية والعافية',
    employeeCount: 16,
    omaniEmployeeCount: 15,
    hasRiyadaCard: true,
    contactEmail: 'hello@wustawellness.om',
    registrationDate: new Date('2022-01-12'),
    location: { lat: 20.4667, lng: 56.5000, address: 'Haima, Al Wusta' },
    evaluation: {
      icvPercentage: 66, financialStabilityIndex: 54,
      notes: 'Near-total Omanization and low-impact operations; seasonal revenue concentration is the main risk.',
      notesAr: 'تعمين شبه كامل وعمليات منخفضة الأثر؛ تركّز الإيرادات موسمياً هو الخطر الأبرز.'
    }
  },
  {
    companyName: 'Ibri Mineral Processing LLC',
    companyNameAr: 'شركة عبري لمعالجة المعادن ش.م.م',
    crNumber: '1512890',
    logo: '/companies/ibri-minerals.png',
    governorate: 'Ad Dhahirah',
    sector: 'Mining & Materials',
    sectorAr: 'التعدين والمواد',
    employeeCount: 143,
    omaniEmployeeCount: 91,
    hasRiyadaCard: false,
    contactEmail: 'contact@ibriminerals.om',
    registrationDate: new Date('2014-06-30'),
    location: { lat: 23.2257, lng: 56.5158, address: 'Ibri, Ad Dhahirah' },
    evaluation: {
      icvPercentage: 79, financialStabilityIndex: 71,
      notes: 'Highest in-country value in the cohort through local sourcing; safety reporting is exemplary.',
      notesAr: 'أعلى قيمة محلية مضافة في الدفعة بفضل التوريد المحلي؛ تقارير السلامة نموذجية.'
    }
  },
  {
    companyName: 'Rustaq Date Products Co.',
    companyNameAr: 'شركة الرستاق لمنتجات التمور',
    crNumber: '1334567',
    logo: '/companies/rustaq-dates.png',
    governorate: 'Al Batinah South',
    sector: 'Food Processing',
    sectorAr: 'تصنيع الأغذية',
    employeeCount: 52,
    omaniEmployeeCount: 38,
    hasRiyadaCard: true,
    contactEmail: 'sales@rustaqdates.om',
    registrationDate: new Date('2019-11-25'),
    location: { lat: 23.3908, lng: 57.4245, address: 'Rustaq, Al Batinah South' },
    evaluation: {
      icvPercentage: 71, financialStabilityIndex: 64,
      notes: 'Entirely local raw material supply chain; packaging is still imported and drags the ICV figure.',
      notesAr: 'سلسلة توريد المواد الخام محلية بالكامل؛ التعبئة ما زالت مستوردة وتخفض القيمة المحلية.'
    }
  },
];

async function destroyData() {
  await connectDB();
  await Promise.all([Company.deleteMany(), Evaluation.deleteMany(), User.deleteMany()]);
  const { Tender, Facility, Booking, Advertisement, Discount, NewsPost } = require('./models/Content');
  await Promise.all([Tender.deleteMany(), Facility.deleteMany(), Booking.deleteMany(), Advertisement.deleteMany(), Discount.deleteMany(), NewsPost.deleteMany()]);
  console.log('[seed] All collections cleared.');
  await mongoose.connection.close();
  process.exit(0);
}

/**
 * Whether this run may create the demo accounts.
 *
 * Keyed on the database being written to, not on NODE_ENV.
 *
 * The earlier rule asked whether *this process* was production. It was not —
 * a laptop never is — so seeding a live Atlas cluster from a developer machine
 * sailed straight past the check and published an admin login whose password is
 * in this file. The environment of the machine running the seed says nothing
 * about whose data is at the other end of the connection.
 *
 * So: a local database may have demo accounts, anything else may not unless
 * somebody says so out loud with ALLOW_DEMO_ACCOUNTS=true.
 */
function targetsLocalDatabase() {
  const uri = process.env.MONGO_URI || '';
  // No URI at all means the default, which is local.
  if (!uri) return true;
  try {
    // mongodb+srv://... always resolves to a hosted cluster.
    const host = new URL(uri.replace(/^mongodb(\+srv)?:/, 'http:')).hostname;
    return ['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(host);
  } catch {
    // An unparseable URI is not something to assume is local.
    return false;
  }
}

function demoAccountsAllowed() {
  if (process.env.ALLOW_DEMO_ACCOUNTS === 'true') return true;
  if (process.env.ALLOW_DEMO_ACCOUNTS === 'false') return false;
  return targetsLocalDatabase();
}

async function importData() {
  await connectDB();
  await Promise.all([Company.deleteMany(), Evaluation.deleteMany()]);

  /*
    Demo accounts, one per role, created idempotently so re-running the seed
    never duplicates them and never silently resets a password you changed.

    Their passwords are written in this file, which is in the repository. On a
    public deployment that makes `admin@istidamah.om` an open door for anyone
    who has read the source. So in production the seed refuses to create them
    unless ALLOW_DEMO_ACCOUNTS is explicitly set to "true" — a deliberate act,
    not a default.

    Everything else the seed writes — companies, evaluations, facilities, news
    — is ordinary demo content and still loads.
  */
  const demoAllowed = demoAccountsAllowed();

  const DEMO_USERS = [
    { name: 'Istidamah Platform Admin', email: 'admin@istidamah.om', password: 'ChangeMe123!', role: 'admin' },
    { name: 'Salim Al Harthy', email: 'owner@istidamah.om', password: 'Owner123!', role: 'sme_owner' },
    { name: 'Khalid Al Amri', email: 'merchant@istidamah.om', password: 'Merchant123!', role: 'merchant' },
    // Auditors are provisioned internally — the role is not offered at sign-up.
    { name: 'Maryam Al Balushi', email: 'auditor@istidamah.om', password: 'Auditor123!', role: 'auditor' }
  ];

  const users = {};
  if (!demoAllowed) {
    console.log('[seed] Remote database: skipping the demo accounts.');
    console.log('[seed] Their passwords are in this file, which is in the');
    console.log('[seed] repository — seeding them here would publish an admin');
    console.log('[seed] login. Register through the site and run');
    console.log('[seed] `npm run make-admin -- you@example.com` instead, or set');
    console.log('[seed] ALLOW_DEMO_ACCOUNTS=true if this really is a throwaway.');
  }

  for (const spec of demoAllowed ? DEMO_USERS : []) {
    let user = await User.findOne({ email: spec.email });
    if (!user) {
      user = await User.create(spec);
      console.log(`[seed] created ${spec.role.padEnd(10)} ${spec.email}`);
    } else {
      console.log(`[seed] kept    ${spec.role.padEnd(10)} ${spec.email} (already exists)`);
    }
    users[spec.role] = user;
  }

  const adminUser = users.admin;
  const auditorUser = users.auditor;
  const ownerUser = users.sme_owner;

  /*
    The companies below are owned by a user and their evaluations are signed by
    an auditor, so without those accounts there is nothing to attach them to.
    Stop here rather than writing records that point at nothing.
  */
  if (!ownerUser || !auditorUser) {
    console.log('[seed] no owner/auditor account, so no companies were seeded.');
    console.log('[seed] Register an account through the platform, then re-run with');
    console.log('[seed] ALLOW_DEMO_ACCOUNTS=true if you want the sample companies.');
    await mongoose.connection.close();
    process.exit(0);
  }

  for (const item of companies) {
    const { evaluation, ...companyData } = item;
    const company = await Company.create({ ...companyData, owner: ownerUser._id });

    const omanizationRateSnapshot = company.omanizationRate;
    const calculatedScore = calculateIstedamaScore({
      omanizationRate: omanizationRateSnapshot,
      financialStabilityIndex: evaluation.financialStabilityIndex,
      icvContribution: evaluation.icvPercentage
    });
    const certificateIssued = qualifiesForCertificate(calculatedScore);

    await Evaluation.create({
      companyId: company._id,
      auditorNotes: evaluation.notes,
      auditorNotesAr: evaluation.notesAr,
      icvPercentage: evaluation.icvPercentage,
      financialStabilityIndex: evaluation.financialStabilityIndex,
      omanizationRateSnapshot,
      calculatedScore,
      certificateIssued,
      certificateSerial: certificateIssued ? generateCertificateSerial(company._id) : null,
      evaluatedBy: auditorUser._id
    });

    console.log(`[seed] ${company.companyName} -> score ${calculatedScore} (${certificateIssued ? 'CERTIFIED' : 'not yet certified'})`);
  }

  await seedContent();

  if (demoAllowed) {
    console.log('\n[seed] Done. Demo logins:');
    for (const u of DEMO_USERS) {
      console.log(`         ${u.role.padEnd(10)} ${u.email.padEnd(24)} ${u.password}`);
    }
    console.log('         Change these before deploying anywhere public.\n');
  } else {
    console.log('\n[seed] Done. No demo accounts were created.\n');
  }
  await mongoose.connection.close();
  process.exit(0);
}

/*
  Only when run as a script.

  Requiring this file must never write to a database. It used to seed on
  import, which meant `require('./seed')` — from a test, or from a tool wanting
  nothing but the guard below — silently deleted and rewrote every company,
  evaluation, tender, facility, discount and news post in whatever MONGO_URI
  happened to point at.
*/
if (require.main === module) {
  if (process.argv.includes('--destroy')) {
    destroyData();
  } else {
    importData();
  }
}

module.exports = { demoAccountsAllowed, targetsLocalDatabase };
