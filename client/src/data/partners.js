/**
 * The partner registry.
 *
 * Two distinct groups live here, and they are not interchangeable:
 *
 *   - `STRATEGIC_PARTNERS` are the institutions behind the programme — the
 *     ministries, authorities and the lead banking partner. They are shown as
 *     a credential: a visitor reads them to decide whether the platform is
 *     official. They carry a logo and a headquarters coordinate.
 *
 *   - `SERVICE_PARTNERS` are commercial branches offering something concrete
 *     to a registered SME — a financing rate, an audit-prep session. A visitor
 *     reads them to find an offer near them, so they carry a type and an offer
 *     line and are filtered by both.
 *
 * Both were previously declared inside the components that rendered them, which
 * meant the map and the partners page could disagree about who a partner was.
 * Anything rendering a partner now reads from here.
 */

/** Institutions behind the programme. Coordinates are real headquarters. */
export const STRATEGIC_PARTNERS = [
  {
    id: 'estidamah',
    logo: '/partners/superpartner1.jpg',
    lat: 23.588,
    lng: 58.383,
    name: { en: 'Istedama', ar: 'استدامة' },
    kind: { en: 'Lead partner', ar: 'الشريك الرئيسي' },
    city: { en: 'Muscat', ar: 'مسقط' },
    primary: true
  },
  {
    id: 'sme-authority',
    logo: '/partners/sme-development-authority.png',
    lat: 23.61,
    lng: 58.54,
    name: {
      en: 'SME Development Authority',
      ar: 'هيئة تنمية المؤسسات الصغيرة والمتوسطة'
    },
    kind: { en: 'Strategic partner', ar: 'شريك استراتيجي' },
    city: { en: 'Muscat', ar: 'مسقط' }
  },
  {
    id: 'mociip',
    logo: '/partners/mociip.png',
    lat: 23.6,
    lng: 58.24,
    name: {
      en: 'Ministry of Commerce, Industry & Investment Promotion',
      ar: 'وزارة التجارة والصناعة وترويج الاستثمار'
    },
    kind: { en: 'Strategic partner', ar: 'شريك استراتيجي' },
    city: { en: 'Muscat', ar: 'مسقط' }
  },
  {
    id: 'labour',
    logo: '/partners/ministry-of-labour.png',
    lat: 23.55,
    lng: 58.46,
    name: { en: 'Ministry of Labour', ar: 'وزارة العمل' },
    kind: { en: 'Strategic partner', ar: 'شريك استراتيجي' },
    city: { en: 'Muscat', ar: 'مسقط' }
  },
  {
    id: 'spf',
    logo: '/partners/social-protection-fund.png',
    lat: 23.64,
    lng: 58.19,
    name: { en: 'Social Protection Fund', ar: 'صندوق الحماية الاجتماعية' },
    kind: { en: 'Strategic partner', ar: 'شريك استراتيجي' },
    city: { en: 'Muscat', ar: 'مسقط' }
  },
  {
    id: 'sohar',
    logo: '/partners/sohar-international.jpg',
    lat: 24.349,
    lng: 56.747,
    name: { en: 'Sohar International', ar: 'صحار الدولي' },
    kind: { en: 'Banking & finance partner', ar: 'الشريك البنكي والتمويلي' },
    city: { en: 'Sohar', ar: 'صحار' }
  }
];

/**
 * Commercial partners with an offer attached.
 *
 * `type` is a stable key, never a display string — the label is looked up
 * through `SERVICE_TYPE_KEY` so the filter chips translate without the filter
 * value itself changing with the language.
 */
export const SERVICE_PARTNERS = [
  {
    id: 'bank-muscat',
    type: 'bank',
    lat: 23.588,
    lng: 58.3829,
    governorate: 'Muscat',
    name: { en: 'Bank Muscat — SME Desk', ar: 'بنك مسقط — مكتب المؤسسات الصغيرة' },
    offer: {
      en: 'Preferential rate financing for certified SMEs',
      ar: 'تمويل بأسعار تفضيلية للمؤسسات الحاصلة على الشهادة'
    }
  },
  {
    id: 'nbo-sohar',
    type: 'bank',
    lat: 24.3489,
    lng: 56.7469,
    governorate: 'Al Batinah North',
    name: {
      en: 'National Bank of Oman — Sohar Branch',
      ar: 'البنك الوطني العُماني — فرع صحار'
    },
    offer: {
      en: 'Working capital line up to OMR 150,000',
      ar: 'تسهيلات رأس مال عامل حتى ١٥٠٬٠٠٠ ريال عُماني'
    }
  },
  {
    id: 'bank-nizwa',
    type: 'islamicBank',
    lat: 22.9333,
    lng: 57.5333,
    governorate: 'Ad Dakhiliyah',
    name: { en: 'Bank Nizwa — Nizwa Branch', ar: 'بنك نزوى — فرع نزوى' },
    offer: {
      en: 'Sharia-compliant SME growth financing',
      ar: 'تمويل نمو متوافق مع الشريعة الإسلامية'
    }
  },
  {
    id: 'riyada-salalah',
    type: 'consulting',
    lat: 17.0151,
    lng: 54.0924,
    governorate: 'Dhofar',
    name: { en: 'Riyada Consulting Salalah', ar: 'ريادة للاستشارات — صلالة' },
    offer: {
      en: 'Free ICV & Omanization audit prep',
      ar: 'تحضير مجاني لتدقيق القيمة المحلية والتعمين'
    }
  },
  {
    id: 'ahli-khasab',
    type: 'bank',
    lat: 26.1927,
    lng: 56.2487,
    governorate: 'Musandam',
    name: { en: 'Ahli Bank — Khasab', ar: 'البنك الأهلي — خصب' },
    offer: {
      en: 'Tourism-sector SME equipment leasing',
      ar: 'تأجير معدات لمؤسسات قطاع السياحة'
    }
  }
];

/** Translation key for each service-partner type. */
export const SERVICE_TYPE_KEY = {
  bank: 'partners.bank',
  islamicBank: 'partners.islamicBank',
  consulting: 'partners.consulting'
};

/** The types actually present, in first-appearance order. */
export const SERVICE_TYPES = SERVICE_PARTNERS.reduce(
  (acc, p) => (acc.includes(p.type) ? acc : [...acc, p.type]),
  []
);
