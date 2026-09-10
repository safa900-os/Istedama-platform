import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Phone, MessageSquare } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/presets';

/**
 * Bottom-corner quick actions, as on the reference screens: account, phone and
 * enquiries. Sits opposite the assistant tab so the two never collide, and
 * shifts above the accessibility button on narrow screens.
 */
const ITEMS = [
  { to: '/login', icon: User, key: 'fab.account' },
  { to: '/contact', icon: Phone, key: 'fab.call' },
  { to: '/contact', icon: MessageSquare, key: 'fab.message' }
];

export default function FloatingActions() {
  const { t, isRTL } = useLanguage();

  return (
    <div className={`fixed bottom-24 z-40 flex flex-col gap-2.5 sm:bottom-5 sm:flex-row ${isRTL ? 'end-5' : 'start-5'}`}>
      {ITEMS.map((item, i) => (
        <motion.div
          key={item.key}
          initial={{ opacity: 0, scale: 0.7, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.08, duration: 0.4, ease: EASE }}
        >
          <Link
            to={item.to}
            aria-label={t(item.key)}
            title={t(item.key)}
            className="group flex h-11 w-11 items-center justify-center rounded-full border border-rule bg-surface text-navy-700 shadow-card transition-all duration-300 hover:-translate-y-1 hover:bg-navy-700 hover:text-white hover:shadow-lift"
          >
            <item.icon size={17} strokeWidth={2} />
          </Link>
        </motion.div>
      ))}
    </div>
  );
}
