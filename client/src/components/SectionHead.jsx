import { motion } from 'framer-motion';
import { fadeUp, inView } from '../motion/presets';

/**
 * Section header in the reference's register: small orange-dotted eyebrow,
 * then a large bold title. Centred variant is used for full-width bands.
 */
export default function SectionHead({ eyebrow, title, lead, center = false, className = '' }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      className={`${center ? 'text-center' : ''} ${className}`}
    >
      {eyebrow && <p className={`eyebrow ${center ? 'justify-center' : ''}`}>{eyebrow}</p>}
      <h2 className="mt-3 font-display text-[1.9rem] font-black leading-tight tracking-tight text-navy-900 sm:text-[2.4rem]">
        {title}
      </h2>
      {lead && (
        <p className={`mt-4 leading-relaxed text-ink-muted ${center ? 'mx-auto max-w-2xl' : 'max-w-2xl'}`}>
          {lead}
        </p>
      )}
    </motion.div>
  );
}
