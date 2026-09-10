import { Link } from 'react-router-dom';
import { MapPin, Building2, BadgeCheck } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

/**
 * One company in the directory.
 *
 * The card this replaces was a white rectangle with four lines of grey text on
 * it, and its `hover:shadow-card` was the same shadow it already had at rest —
 * so pointing at it did nothing at all. Nine of them in a grid were impossible
 * to tell apart at a glance.
 *
 * Three things fix that, and none of them invents information:
 *
 *   - A mark. The ten companies on the register now carry one, in
 *     `public/companies/`. A company without one is not given a fake: the card
 *     draws a monogram from the firm's own name instead, which is honest about
 *     there being no logo rather than rendering a broken image.
 *
 *   - Colour that means something. The tone is derived from the sector, so two
 *     firms in the same sector carry the same colour and the grid becomes
 *     scannable by industry. It is not decoration keyed to nothing.
 *
 *   - The Omanization rate as a meter as well as a number. It is the figure the
 *     whole programme turns on, and it was the smallest text on the card.
 *
 * The colour never carries meaning on its own: the sector is named on the card
 * in words, and the meter is labelled with its own percentage.
 */

/*
 * Five tones drawn from the two brand hues. Each pairs a fill with a glyph
 * colour that clears 4.5:1 against the LIGHT end of its own gradient — the
 * orange tones take navy glyphs, because white on the mark's orange is 2.2:1.
 */
const TONES = [
  { tile: 'from-navy-700 to-navy-900', glyph: 'text-white', rule: 'bg-navy-700', meter: 'bg-navy-700' },
  { tile: 'from-accent-200 to-accent-400', glyph: 'text-navy-900', rule: 'bg-accent-500', meter: 'bg-accent-600' },
  { tile: 'from-navy-400 to-navy-600', glyph: 'text-white', rule: 'bg-navy-500', meter: 'bg-navy-500' },
  { tile: 'from-accent-300 to-accent-500', glyph: 'text-navy-900', rule: 'bg-accent-600', meter: 'bg-accent-700' },
  { tile: 'from-navy-500 to-navy-700', glyph: 'text-white', rule: 'bg-navy-600', meter: 'bg-navy-600' }
];

/** Stable across renders and across reloads: the same sector always tones the same. */
const toneFor = (key = '') => {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return TONES[h % TONES.length];
};

/*
 * Nearly every Arabic name on the register opens with «شركة» or «مؤسسة», and
 * most of what follows opens with «ال» — so the naive first letter would make
 * the whole directory a wall of ش and ا. Both are dropped before the letter is
 * taken, which is what makes the marks tell each other apart.
 */
const PREFIXES = ['شركة', 'مؤسسة', 'مجموعة', 'مكتب', 'مصنع', 'مركز', 'دار', 'the', 'al'];

export const monogram = (name = '') => {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  let head = words.find((w) => !PREFIXES.includes(w.toLowerCase())) || words[0] || '';
  if (head.length > 2 && head.startsWith('ال')) head = head.slice(2);
  return Array.from(head)[0] || '•';
};

export default function CompanyCard({ company }) {
  const { t, tGov, fmt, pick } = useLanguage();

  const name = pick(company, 'companyName');
  const sector = pick(company, 'sector');
  const tone = toneFor(company.sector || sector);
  const rate = Number(company.omanizationRate) || 0;

  return (
    <Link
      to={`/companies/${company._id}`}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-rule bg-surface shadow-soft transition-all duration-300 hover:-translate-y-1.5 hover:border-navy-200 hover:shadow-lift"
    >
      {/* The sector's colour, as a rule that runs the width of the card on hover. */}
      <span
        aria-hidden="true"
        className={`h-1 w-14 transition-all duration-500 group-hover:w-full ${tone.rule}`}
      />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3.5">
          {company.logo ? (
            /*
              56px, and barely any padding. At 48px with p-1.5 these marks had
              about 36px of drawable area, and every one of them is a detailed
              circular emblem — they read as coloured smudges. The sector's
              colour still lands on the card through the rule above.
            */
            <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-soft ring-1 ring-rule transition-transform duration-300 group-hover:scale-105">
              <img
                src={company.logo}
                alt=""
                loading="lazy"
                className="h-full w-full rounded-xl object-contain"
              />
            </span>
          ) : (
            <span
              aria-hidden="true"
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-display text-2xl font-black shadow-soft transition-transform duration-300 group-hover:scale-105 ${tone.tile} ${tone.glyph}`}
            >
              {monogram(name)}
            </span>
          )}

          <span className="ms-auto inline-flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 text-[11px] font-bold text-ink-muted">
            <Building2 size={11} aria-hidden="true" /> {sector}
          </span>
        </div>

        <h3 className="mt-4 font-display text-[15px] font-black leading-snug text-navy-900">
          {name}
        </h3>

        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
          <span className="flex items-center gap-1">
            <MapPin size={12} aria-hidden="true" /> {tGov(company.governorate)}
          </span>
          {company.hasRiyadaCard && (
            <span className="flex items-center gap-1 font-bold text-navy-700">
              <BadgeCheck size={12} aria-hidden="true" /> {t('detail.riyada')}
            </span>
          )}
        </p>

        {/*
          The Omanization rate, as a meter and as a number. It was the smallest
          thing on the card before, in the lightest colour on it — and it is the
          measure the whole programme is built around.
        */}
        <div className="mt-auto pt-5">
          <div className="flex items-baseline justify-between text-xs">
            <span className="text-ink-muted">{t('dir.omanization')}</span>
            <span className="font-display text-sm font-black text-navy-900">
              {fmt(rate)}%
            </span>
          </div>
          <div
            role="img"
            aria-label={`${t('dir.omanization')} ${fmt(rate)}%`}
            className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-mist"
          >
            <span
              className={`block h-full rounded-full transition-[width] duration-500 ${tone.meter}`}
              style={{ width: `${Math.min(100, Math.max(0, rate))}%` }}
            />
          </div>

          <p className="mt-3 border-t border-rule pt-3 text-[11px] text-ink-soft">
            {t('dir.cr')} <span dir="ltr">{company.crNumber}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
