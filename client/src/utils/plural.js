/**
 * Counting things in Arabic.
 *
 * Arabic does not have English's two-way singular/plural split. It has five
 * categories, and four of them turn up in a list of eight partner groups:
 *
 *   1        شريك واحد        (one)
 *   2        شريكان           (dual — a form English has no equivalent for)
 *   3–10     ٣ شركاء          (few — the "plural of paucity")
 *   11+      ١٢ شريكاً        (many — noun goes back to the singular, accusative)
 *
 * Rendering every count through one `'{count} شركاء'` string produced «١ شركاء»
 * and «٢ شركاء» on four of the eight categories — the kind of mistake a reader
 * notices immediately and a developer working in English never sees.
 *
 * `Intl.PluralRules` knows these categories, so the selection is not hand-rolled
 * from number ranges; only the four wordings are ours.
 */

const RULES = {
  ar: new Intl.PluralRules('ar-OM'),
  en: new Intl.PluralRules('en-GB')
};

/**
 * Pick the right wording for `count`.
 *
 * @param {number} count   how many
 * @param {string} lang    'ar' | 'en'
 * @param {function} t     the translation lookup
 * @param {function} fmt   the number formatter (for Arabic-Indic digits)
 * @param {string} base    key prefix, e.g. 'directory.count'
 */
export function pluralise(count, lang, t, fmt, base) {
  const rule = RULES[lang] || RULES.en;
  const category = rule.select(count);
  const key = `${base}.${category}`;
  const label = t(key, { count: fmt(count) });
  // Fall back to the generic wording if a category has no string of its own.
  return label === key ? t(`${base}.other`, { count: fmt(count) }) : label;
}
