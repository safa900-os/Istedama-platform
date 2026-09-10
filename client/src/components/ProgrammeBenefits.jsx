import { motion } from 'framer-motion';
import { HandCoins, Split, Handshake, Network } from 'lucide-react';
import SectionHead from './SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { PROGRAMME_BENEFITS } from '../data/programme';
import { fadeUp, stagger, inView } from '../motion/presets';

/**
 * The four benefits of the "استدامة مؤسستي" programme.
 *
 * The source material renders these as four numbered circles in a row. That
 * layout puts an ordinal above the icon and the body text below, which on a
 * phone collapses into a very tall column of centred text. These are cards
 * instead, and they carry no ordinal: the four are things a member gains, not
 * stages to pass through, so numbering them implied an order that is not
 * there.
 */

const ICONS = { HandCoins, Split, Handshake, Network };

export default function ProgrammeBenefits() {
  const { t, lang } = useLanguage();

  return (
    <section className="mx-auto max-w-[1400px] px-3 py-16 sm:px-5">
      <SectionHead
        eyebrow={t('benefits.eyebrow')}
        title={t('benefits.title')}
        lead={t('benefits.lead')}
        center
      />

      <motion.ul
        variants={stagger(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={inView}
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
      >
        {PROGRAMME_BENEFITS.map((b) => {
          const Icon = ICONS[b.icon] || HandCoins;
          return (
            <motion.li
              key={b.id}
              variants={fadeUp}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-rule bg-surface p-7 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-accent-300 hover:shadow-lift"
            >
              {/* The accent bar grows on hover — a single transform, so it
                  animates on the compositor rather than triggering layout. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-accent-500 to-navy-700 transition-transform duration-300 group-hover:scale-x-100"
              />

              {/* No ordinal on the card. These four are benefits a member
                  gets, not a sequence to work through — a number implied an
                  order that does not exist, and read as a step count. */}
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent-500 text-navy-900 shadow-soft transition-transform duration-300 group-hover:scale-105">
                <Icon size={24} strokeWidth={1.9} />
              </span>

              <h3 className="mt-6 font-display text-base font-black leading-snug text-navy-700">
                {b.title[lang]}
              </h3>
              <p className="mt-3 text-sm leading-loose text-ink-muted">{b.body[lang]}</p>
            </motion.li>
          );
        })}
      </motion.ul>
    </section>
  );
}
