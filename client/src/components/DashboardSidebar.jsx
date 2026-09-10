import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, BarChart3, Building2, ClipboardList, CalendarCheck, Megaphone,
  Users, FileText, Award, Gauge, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EASE } from '../motion/variants';

/**
 * Navigation per role. An administrator oversees the whole programme, an
 * auditor works a queue of evaluations, and an SME owner or merchant only ever
 * sees their own enterprise — so they get genuinely different menus rather
 * than one list with items greyed out.
 */
const MENUS = {
  admin: [
    { id: 'overview', icon: LayoutDashboard, key: 'side.overview' },
    { id: 'analytics', icon: BarChart3, key: 'side.analytics' },
    { id: 'enterprises', icon: Building2, key: 'side.enterprises' },
    { id: 'evaluations', icon: ClipboardList, key: 'side.evaluations' },
    { id: 'tenders', icon: FileText, key: 'side.tenders' },
    { id: 'content', icon: Megaphone, key: 'side.content' },
    { id: 'users', icon: Users, key: 'side.users' }
  ],
  auditor: [
    { id: 'overview', icon: LayoutDashboard, key: 'side.overview' },
    { id: 'queue', icon: ClipboardList, key: 'side.queue' },
    { id: 'enterprises', icon: Building2, key: 'side.enterprises' },
    { id: 'analytics', icon: BarChart3, key: 'side.analytics' }
  ],
  sme_owner: [
    { id: 'overview', icon: LayoutDashboard, key: 'side.overview' },
    { id: 'myScore', icon: Gauge, key: 'side.myScore' },
    { id: 'company', icon: Building2, key: 'side.myCompany' },
    { id: 'certificates', icon: Award, key: 'side.certificates' },
    { id: 'bookings', icon: CalendarCheck, key: 'side.bookings' }
  ],
  merchant: [
    { id: 'overview', icon: LayoutDashboard, key: 'side.overview' },
    { id: 'myScore', icon: Gauge, key: 'side.myScore' },
    { id: 'company', icon: Building2, key: 'side.myCompany' },
    { id: 'myTenders', icon: FileText, key: 'side.myTenders' },
    { id: 'bookings', icon: CalendarCheck, key: 'side.bookings' },
    { id: 'adverts', icon: Megaphone, key: 'side.adverts' }
  ]
};

/** Menu for a role, falling back to the most limited view for unknown roles. */
export function menuForRole(role) {
  return MENUS[role] || MENUS.sme_owner;
}

/**
 * Collapsible dashboard sidebar. Collapsed it keeps only icons (with the label
 * exposed via title/aria-label so it stays usable and screen-reader friendly);
 * expanded it animates the labels in. The active item is marked with a sliding
 * indicator shared across items via layoutId, so the marker travels rather
 * than cutting between positions.
 */
export default function DashboardSidebar({ active, onSelect, collapsed, onToggle }) {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;

  const items = menuForRole(user?.role);

  // If the selected section isn't in this role's menu, fall back to the first
  // item so the panel never renders with nothing highlighted.
  const activeId = items.some((i) => i.id === active) ? active : items[0].id;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 232 }}
      transition={{ duration: 0.3, ease: EASE }}
      className="sticky top-[108px] hidden shrink-0 self-start overflow-hidden rounded-xl border border-rule bg-surface lg:block"
      aria-label={t('side.menu')}
    >
      <nav className="p-2.5">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSelect(item.id)}
                  title={collapsed ? t(item.key) : undefined}
                  aria-label={t(item.key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive ? 'font-bold text-navy-700' : 'font-medium text-ink-muted hover:bg-canvas hover:text-ink'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="side-active"
                      className="absolute inset-0 rounded-lg bg-navy-50"
                      transition={{ type: 'spring', stiffness: 400, damping: 34 }}
                    />
                  )}
                  <item.icon size={18} strokeWidth={2} className="relative shrink-0" />
                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="relative overflow-hidden whitespace-nowrap"
                      >
                        {t(item.key)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Whose view this is — makes the role-specific menu self-explanatory */}
        <AnimatePresence initial={false}>
          {!collapsed && user && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-3 rounded-lg border border-rule bg-mist/60 px-3 py-2.5"
            >
              <p className="text-[10px] font-bold uppercase tracking-wide text-ink-soft">
                {t('side.roleLabel')}
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-navy-700">
                {t(`role.${user.role}`)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-2 border-t border-rule pt-2">
          <button
            onClick={onToggle}
            aria-label={collapsed ? t('side.expand') : t('side.collapse')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft hover:bg-canvas hover:text-ink"
          >
            <Toggle size={18} strokeWidth={2} className={`shrink-0 ${isRTL ? 'rotate-180' : ''}`} />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  {t('side.collapse')}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </nav>
    </motion.aside>
  );
}
