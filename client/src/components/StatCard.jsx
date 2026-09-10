import { motion } from 'framer-motion';
import { fadeUp, inView, EASE } from '../motion/presets';
import CountUp from './ui/CountUp';

/* Three tones from two hues: the mark's blue light and deep, and its orange. */
const ACCENTS = {
  navy: 'bg-navy-50 text-navy-700',
  teal: 'bg-navy-100 text-navy-800',
  gold: 'bg-gold-50 text-gold-600'
};

export default function StatCard({ icon: Icon, label, value, sublabel, accent = 'navy', numeric, suffix = '', i = 0 }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      custom={i}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="card p-6 transition-shadow hover:shadow-lift"
    >
      <span className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${ACCENTS[accent]}`}>
        {Icon && <Icon size={20} strokeWidth={2} />}
      </span>
      <p className="font-display text-[2.1rem] font-black leading-none tracking-tight text-navy-900">
        {typeof numeric === 'number' ? <CountUp value={numeric} suffix={suffix} /> : value}
      </p>
      <p className="mt-2.5 text-sm font-medium text-ink-muted">{label}</p>
      {sublabel && <p className="mt-3 border-t border-rule pt-3 text-xs text-ink-soft">{sublabel}</p>}
    </motion.div>
  );
}
