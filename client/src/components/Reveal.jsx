import { motion } from 'framer-motion';
import { fadeUp, inView } from '../motion/presets';

/**
 * Scroll-reveal wrapper. Used instead of repeating the same
 * initial/whileInView/viewport triple on every element.
 */
export default function Reveal({ children, i = 0, variants = fadeUp, className = '', as = 'div' }) {
  const El = motion[as] || motion.div;
  return (
    <El
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={inView}
      custom={i}
      className={className}
    >
      {children}
    </El>
  );
}
