import { motion } from 'framer-motion';
import { KeyRound, Info, FileSearch, Users, FileCheck2, Award } from 'lucide-react';
import SectionHead from './SectionHead';
import { useLanguage } from '../context/LanguageContext';
import { CERTIFICATE_STEPS } from '../data/programme';
import { fadeUp, stagger, inView } from '../motion/presets';

/**
 * The six steps to the Istedama certificate.
 *
 * Laid out as a single connected track rather than the two stacked rows of the
 * source material. Six circles split across two rows read as two separate
 * sequences — a viewer has to work out that the fourth step follows the third
 * by jumping back across the row. One track that wraps keeps the order
 * unambiguous at every width.
 *
 * The connector is drawn with a pseudo-element on each item except the last,
 * so it follows the reading direction without a separate RTL rule.
 */

const ICONS = { KeyRound, Info, FileSearch, Users, FileCheck2, Award };

export default function CertificateSteps() {
  const { t, lang } = useLanguage();

  return (
    <section className="bg-navy-50/60 py-16">
      <div className="mx-auto max-w-[1400px] px-3 sm:px-5">
        <SectionHead
          eyebrow={t('steps.eyebrow')}
          title={t('steps.title')}
          lead={t('steps.lead')}
          center
        />

        <motion.ol
          variants={stagger(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={inView}
          className="mt-14 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
        >
          {CERTIFICATE_STEPS.map((s, i) => {
            const Icon = ICONS[s.icon] || Info;
            const isLast = i === CERTIFICATE_STEPS.length - 1;
            return (
              <motion.li
                key={s.id}
                variants={fadeUp}
                className="group relative flex flex-col items-center text-center"
              >
                {/*
                  Connector to the next step. Hidden on the last item and at
                  widths where the track wraps, since a line pointing off the
                  end of a row would suggest a step that is not there.

                  Dashed rather than solid: the steps happen over weeks, not in
                  one sitting, and a continuous rule read as a progress bar
                  someone was partway along.
                */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute top-11 hidden h-px w-full border-t-2 border-dashed border-navy-200/70 xl:block ltr:left-1/2 rtl:right-1/2"
                  />
                )}

                {/* No number badge. The order is carried by the list itself —
                    this is an `<ol>`, so assistive technology announces the
                    position anyway — and by the connector running between the
                    circles; the badge repeated that a third time. */}
                <span className="relative flex h-[5.5rem] w-[5.5rem] items-center justify-center rounded-full bg-surface shadow-soft ring-1 ring-rule transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift group-hover:ring-2 group-hover:ring-accent-400">
                  {/* A faint halo that only appears on hover, so the row reads
                      as still until the reader points at one of them. */}
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 scale-90 rounded-full bg-accent-50 opacity-0 transition-all duration-300 group-hover:scale-110 group-hover:opacity-100"
                  />
                  <Icon
                    size={30}
                    strokeWidth={1.6}
                    className="relative text-navy-700 transition-colors duration-300 group-hover:text-accent-600"
                  />
                </span>

                <h3 className="mt-5 max-w-[11rem] text-sm font-bold leading-snug text-ink transition-colors duration-300 group-hover:text-navy-900">
                  {s.label[lang]}
                </h3>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </section>
  );
}
