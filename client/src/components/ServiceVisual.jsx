import {
  BadgeCheck, FileCheck2, CalendarCheck, Briefcase, GraduationCap,
  Wallet, Scale, Cpu, Users
} from 'lucide-react';

const ICONS = { BadgeCheck, FileCheck2, CalendarCheck, Briefcase, GraduationCap, Wallet, Scale, Cpu, Users };

/**
 * The banner image for a service category.
 *
 * Drawn rather than photographed, deliberately. The programme has no
 * photography for these nine categories, and generic stock imagery of people
 * at laptops would say nothing true about "chamber attestation" or "in-country
 * value" — it would be decoration pretending to be information. This builds a
 * recognisable graphic per category instead: the category's own icon at
 * display size over a tinted field, with a light guilloche pattern behind it.
 *
 * If real photography is supplied later, this component is the single place to
 * swap — every category header renders through it.
 */

/*
 * Softened from three fully saturated fields. Nine of these stacked in a grid
 * turned the catalogue into a colour chart, and the cards below them — which
 * carry the actual services — lost against their own headers. Each band is now
 * a tint of its accent rather than the accent at full strength.
 */
const TINTS = {
  navy: {
    field: 'from-navy-200 to-navy-300',
    glyph: 'text-navy-800',
    wash: 'rgba(34,62,152,0.12)'
  },
  sky: {
    field: 'from-navy-50 to-navy-100',
    glyph: 'text-navy-600',
    wash: 'rgba(34,62,152,0.08)'
  },
  gold: {
    field: 'from-accent-50 to-accent-100',
    glyph: 'text-accent-600',
    wash: 'rgba(194,65,12,0.10)'
  }
};

export default function ServiceVisual({ icon, accent = 'navy', className = '' }) {
  const Icon = ICONS[icon] || Briefcase;
  const tint = TINTS[accent] || TINTS.navy;
  // Stable per-category id so two visuals on one page cannot share a pattern.
  const patternId = `svc-grid-${icon}-${accent}`;

  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-gradient-to-br ${tint.field} ${className}`}
    >
      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
        <defs>
          <pattern id={patternId} width="26" height="26" patternUnits="userSpaceOnUse">
            <path d="M26 0H0V26" fill="none" stroke={tint.wash} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>

      {/* An oversized, partly cropped glyph reads as artwork rather than as a
          second, larger copy of the icon in the heading beside it. */}
      <Icon
        size={128}
        strokeWidth={1.1}
        className={`absolute -bottom-6 ${tint.glyph} opacity-40 ltr:-right-5 rtl:-left-5`}
      />

    </div>
  );
}
