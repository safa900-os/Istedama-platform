/**
 * What a merchant or a self-employed practitioner sells.
 *
 * A controlled list rather than free text, for one reason: these categories are
 * what a buyer filters the directory by. Free text gives you "IT", "I.T.",
 * "تقنية المعلومات" and "Information Technology" as four separate answers to the
 * same question, and a filter that finds none of them.
 *
 * Both languages live here, on the server, so the list is the same for the
 * registration form, the directory filter and anything that reports on it. A
 * category is stored by its key; the labels are for display only and can be
 * reworded without touching a single stored record.
 *
 * Adding to this list is safe. Removing a key is not — records already carry it,
 * so retire a category by dropping it from the form rather than from here.
 */

const CATEGORIES = Object.freeze([
  { key: 'contracting', en: 'Contracting and construction', ar: 'المقاولات والإنشاءات' },
  { key: 'maintenance', en: 'Maintenance and facilities', ar: 'الصيانة وإدارة المرافق' },
  { key: 'it', en: 'Information technology', ar: 'تقنية المعلومات' },
  { key: 'telecom', en: 'Telecommunications', ar: 'الاتصالات' },
  { key: 'supplies', en: 'General supplies', ar: 'التوريدات العامة' },
  { key: 'foodstuff', en: 'Foodstuff and catering', ar: 'المواد الغذائية والتموين' },
  { key: 'agriculture', en: 'Agriculture and fisheries', ar: 'الزراعة والثروة السمكية' },
  { key: 'manufacturing', en: 'Manufacturing', ar: 'الصناعات التحويلية' },
  { key: 'logistics', en: 'Transport and logistics', ar: 'النقل والخدمات اللوجستية' },
  { key: 'consulting', en: 'Consulting and advisory', ar: 'الاستشارات' },
  { key: 'training', en: 'Training and education', ar: 'التدريب والتعليم' },
  { key: 'marketing', en: 'Marketing and media', ar: 'التسويق والإعلام' },
  { key: 'design', en: 'Design and creative services', ar: 'التصميم والخدمات الإبداعية' },
  { key: 'health', en: 'Health and wellbeing', ar: 'الصحة والعافية' },
  { key: 'tourism', en: 'Tourism and hospitality', ar: 'السياحة والضيافة' },
  { key: 'energy', en: 'Energy and renewables', ar: 'الطاقة والطاقة المتجددة' },
  { key: 'environment', en: 'Environment and recycling', ar: 'البيئة وإعادة التدوير' },
  { key: 'finance', en: 'Financial and accounting services', ar: 'الخدمات المالية والمحاسبية' },
  { key: 'legal', en: 'Legal services', ar: 'الخدمات القانونية' },
  { key: 'retail', en: 'Retail and e-commerce', ar: 'التجزئة والتجارة الإلكترونية' },
  { key: 'crafts', en: 'Handicrafts and heritage products', ar: 'الحرف اليدوية والمنتجات التراثية' },
  { key: 'other', en: 'Other', ar: 'أخرى' }
]);

const CATEGORY_KEYS = Object.freeze(CATEGORIES.map((c) => c.key));

/**
 * How many a single record may claim.
 *
 * A cap exists so the list stays a description of what a business actually
 * does. A supplier who ticks every box is not findable by category — they are
 * noise in every search at once.
 */
const MAX_CATEGORIES = 6;

/** Keeps only known keys, de-duplicated, capped. Order is the caller's. */
const normaliseCategories = (raw) => {
  const seen = new Set();
  return (Array.isArray(raw) ? raw : [])
    .map((c) => String(c || '').trim())
    .filter((c) => CATEGORY_KEYS.includes(c) && !seen.has(c) && seen.add(c))
    .slice(0, MAX_CATEGORIES);
};

module.exports = { CATEGORIES, CATEGORY_KEYS, MAX_CATEGORIES, normaliseCategories };
