import { motion } from 'framer-motion';
import { EASE, riseItem } from '../../motion/variants';

/**
 * Standard card: rises into view once, lifts on hover, and reveals a gold
 * rule along its top edge. The rule is the same device used under the active
 * navigation item, so "this is the thing you're on" is one consistent signal.
 */
export default function MotionCard({ children, className = '', as = 'div', accent = true, ...rest }) {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      variants={riseItem}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -4, transition: { duration: 0.2, ease: EASE } }}
      className={`group relative overflow-hidden rounded-3xl border border-rule bg-surface transition-shadow duration-200 hover:shadow-lift ${className}`}
      {...rest}
    >
      {accent && (
        <span className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 bg-gold-500 transition-transform duration-300 ease-out group-hover:scale-x-100" />
      )}
      {children}
    </Comp>
  );
}
