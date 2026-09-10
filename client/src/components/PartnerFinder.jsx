import { useMemo, useState } from 'react';
import { Landmark, Users, ShieldCheck, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { SERVICE_PARTNERS, SERVICE_TYPE_KEY, SERVICE_TYPES } from '../data/partners';

/**
 * The offers open to certified enterprises.
 *
 * There was a map here. It cost a tile server, a 440px square and half the
 * width of the panel to say five things — and it said them badly: five pins on
 * a view of the whole Gulf, most of them overlapping around Muscat, none of
 * them legible. The one fact it carried, where each partner is, is already in
 * the data as `governorate`, so each offer prints it in a line of text instead.
 * The list gets the whole width back, which is what its cramped four-line
 * headings actually needed.
 *
 * Rows, not a grid: every offer carries a sentence, and a sentence in a 270px
 * column wraps to five lines. Full-width rows let the name sit on one line and
 * the offer on one or two.
 */

const TYPE_ICON = { bank: Landmark, islamicBank: Landmark, consulting: Users };

export default function PartnerFinder() {
  const [filter, setFilter] = useState('All');
  const { t, lang, fmt, tGov } = useLanguage();
  const types = useMemo(() => ['All', ...SERVICE_TYPES], []);
  const visible =
    filter === 'All' ? SERVICE_PARTNERS : SERVICE_PARTNERS.filter((p) => p.type === filter);

  const typeLabel = (type) => (type === 'All' ? t('partners.all') : t(SERVICE_TYPE_KEY[type]));

  return (
    <div>
      {/*
        Toggles rather than links, so `aria-pressed` states which one is on —
        the highlight alone would leave that to colour. 44px tall, because the
        programme's members include merchants in their sixties.
      */}
      <div className="flex flex-wrap gap-2">
        {types.map((type) => {
          const on = filter === type;
          const count =
            type === 'All'
              ? SERVICE_PARTNERS.length
              : SERVICE_PARTNERS.filter((p) => p.type === type).length;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              aria-pressed={on}
              className={`flex min-h-[44px] items-center rounded-full px-4 text-xs font-bold transition-colors ${
                on
                  ? 'bg-navy-700 text-white shadow-pill'
                  : 'border border-rule bg-surface text-ink-muted hover:border-navy-200 hover:bg-navy-50 hover:text-navy-700'
              }`}
            >
              {/*
                The `{' '}` is load-bearing. Label and count as two adjacent
                flex items with no text node between them concatenate in the
                accessible name: a screen reader announced "Bank3", not
                "Bank 3". The visual gap comes from `ms-1.5`, not from the
                space, so nothing moves.
              */}
              {typeLabel(type)}{' '}
              <span className={`ms-1.5 ${on ? 'text-white/70' : 'text-ink-soft'}`}>
                {fmt(count)}
              </span>
            </button>
          );
        })}
      </div>

      <ul className="mt-4 space-y-2.5">
        {visible.map((p) => {
          const Icon = TYPE_ICON[p.type] || Landmark;
          return (
            <li
              key={p.id}
              className="flex items-start gap-3.5 rounded-2xl border border-rule bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-card"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 ring-1 ring-navy-100">
                <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-start gap-1.5 font-display text-sm font-black leading-snug text-navy-900">
                  {p.name[lang]}
                  {/* Green here is a state, not decoration: this partner is
                      verified, and nothing else on the row is claiming that. */}
                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-teal-600"
                    aria-label={t('partners.verified')}
                  />
                </p>

                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-ink-soft">
                  <span className="rounded-full bg-mist px-2 py-0.5 font-bold text-ink-muted">
                    {typeLabel(p.type)}
                  </span>
                  {/* What the map was for, in the words the data already holds. */}
                  {p.governorate && (
                    <span className="flex items-center gap-1">
                      <MapPin size={11} aria-hidden="true" /> {tGov(p.governorate)}
                    </span>
                  )}
                </p>

                <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">{p.offer[lang]}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
