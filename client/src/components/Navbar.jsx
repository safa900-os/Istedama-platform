import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, ChevronDown, Globe, LogOut, Menu, X } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { EASE } from '../motion/presets';
import SiteSearch from './SiteSearch';
import AccessibilityWidget from './AccessibilityWidget';
import logo from '../assets/logo.png';

const PRIMARY = [
  { to: '/', key: 'nav.home' },
  { to: '/about', key: 'nav.about' },
  // Who backs the programme is part of what it is, not one of the things it
  // sells — so partners sit beside "about" rather than inside the services
  // menu, where they were the one entry that led to no service at all.
  { to: '/partners', key: 'nav.partners' }
];

// Grouped under a dropdown, matching the reference's "الخدمات" menu
const SERVICES = [
  { to: '/services', key: 'nav.servicesPage' },
  { to: '/facilities', key: 'nav.facilities' },
  { to: '/discounts', key: 'nav.discounts' },
  { to: '/companies', key: 'nav.directory' },
  { to: '/advertise', key: 'nav.advertise' }
];

const TRAILING = [
  { to: '/tenders', key: 'nav.tenders' },
  { to: '/news', key: 'nav.news' },
  // Self-employment sits with the other things the programme talks about
  // rather than inside the services menu: it is a route into the platform for
  // a whole class of member, not one more service to buy.
  { to: '/freelance', key: 'nav.freelance' },
  { to: '/contact', key: 'nav.contact' }
];

// The dashboard is a signed-in view whose contents depend on the user's role,
// so it appears once someone is authenticated rather than in the public nav.
const ACCOUNT_LINKS = [{ to: '/dashboard', key: 'nav.dashboard' }];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const [unread, setUnread] = useState(0);

  /*
    Read once when the session changes rather than polled. A badge that is a
    few minutes stale costs nothing; a request every few seconds from every
    open tab costs the free-tier API its whole budget.
  */
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return undefined;
    }
    let live = true;
    api
      .get('/notifications', { params: { unread: 'true', limit: 1 } })
      .then((res) => live && setUnread(res.data.unreadCount || 0))
      .catch(() => live && setUnread(0));
    return () => {
      live = false;
    };
  }, [user]);
  const { t, fmt, lang, toggleLang } = useLanguage();

  const trailing = user ? [...TRAILING, ...ACCOUNT_LINKS] : TRAILING;

  // The bar tightens slightly once the page scrolls, as on the reference.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /*
    `whitespace-nowrap` is the whole fix. The bar was not overflowing — it had
    49px to spare — but each link is a flex item that may shrink below its
    content, and every two-word Arabic label («عن استدامة», «العمل الحر»,
    «تواصل معنا») broke at its space and took a second line. Three items at
    56px tall in a 36px row is what made the bar look ragged.

    Padding comes down from 14px to 10px a side to pay for the width the
    unbroken labels now need. The type stays at 14px: this platform's members
    include merchants in their sixties, and shrinking the navigation is the
    last place to find room.
  */
  const linkCls = ({ isActive }) =>
    `relative whitespace-nowrap rounded-full px-2.5 py-2 text-sm transition-colors ${
      isActive ? 'font-bold text-navy-700' : 'font-medium text-ink-muted hover:text-navy-700'
    }`;

  const ActiveDot = () => (
    <motion.span
      layoutId="nav-active"
      className="absolute inset-x-3 -bottom-0.5 h-[3px] rounded-full bg-gold-500"
      transition={{ duration: 0.3, ease: EASE }}
    />
  );

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-4">
      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: EASE }}
        className={`mx-auto flex max-w-[1400px] items-center gap-3 rounded-full border border-white/80 bg-surface/90 px-3 backdrop-blur-md transition-all duration-300 sm:px-5 ${
          scrolled ? 'h-[62px] shadow-lift' : 'h-[70px] shadow-card'
        }`}
      >
        <Link to="/" className="flex shrink-0 items-center" aria-label={t('nav.homeAria')}>
          <motion.img
            src={logo}
            alt="Istedama"
            className="h-8 w-auto sm:h-9"
            whileHover={{ scale: 1.04 }}
            transition={{ duration: 0.25, ease: EASE }}
          />
        </Link>

        <nav className="hidden items-center gap-0.5 xl:flex" aria-label="Primary">
          {PRIMARY.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkCls}>
              {({ isActive }) => (<>{t(l.key)}{isActive && <ActiveDot />}</>)}
            </NavLink>
          ))}

          {/* Services dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setServicesOpen(true)}
            onMouseLeave={() => setServicesOpen(false)}
          >
            <button
              type="button"
              onClick={() => setServicesOpen((o) => !o)}
              aria-expanded={servicesOpen}
              className="flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-navy-700"
            >
              {t('nav.services')}
              <motion.span animate={{ rotate: servicesOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown size={14} />
              </motion.span>
            </button>

            <AnimatePresence>
              {servicesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="absolute start-0 top-full z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-rule bg-surface p-1.5 shadow-lift"
                >
                  {SERVICES.map((s, i) => (
                    <motion.div
                      key={s.to}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.24 }}
                    >
                      <NavLink
                        to={s.to}
                        onClick={() => setServicesOpen(false)}
                        className={({ isActive }) =>
                          `block whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
                            isActive ? 'bg-navy-50 font-bold text-navy-700' : 'text-ink-muted hover:bg-mist hover:text-navy-700'
                          }`
                        }
                      >
                        {t(s.key)}
                      </NavLink>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {trailing.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkCls}>
              {({ isActive }) => (<>{t(l.key)}{isActive && <ActiveDot />}</>)}
            </NavLink>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1 sm:gap-2">
          {/*
            Search and the accessibility panel sit in the bar rather than
            floating over the bottom of the page. Both are things you reach for
            deliberately, and a corner button is the one place a reader with a
            magnifier running is least likely to find them. They are icon-only
            here, so both carry an aria-label and a title.
          */}
          <SiteSearch />
          <AccessibilityWidget variant="header" />

          <span aria-hidden="true" className="mx-0.5 hidden h-6 w-px bg-rule sm:block" />

          <motion.button
            type="button"
            onClick={toggleLang}
            whileTap={{ scale: 0.94 }}
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-ink-muted transition-colors hover:bg-navy-50 hover:text-navy-700"
            aria-label={t('nav.switchLanguage')}
          >
            <Globe size={15} /> <span className="hidden sm:inline">{lang === 'en' ? 'العربية' : 'EN'}</span>
          </motion.button>

          {/*
            The unread count, beside the account control rather than buried in
            a menu. An approval or a rejection is the thing the applicant came
            back to find out, so it is worth one badge in the bar.
          */}
          {user && (
            <Link
              to="/notifications"
              className="relative flex items-center rounded-full px-2.5 py-2 text-ink-muted transition-colors hover:bg-navy-50 hover:text-navy-700"
              aria-label={
                unread > 0
                  ? `${t('notif.openNotifications')} — ${fmt(unread)} ${t('notif.unread')}`
                  : t('notif.openNotifications')
              }
            >
              <Bell size={16} aria-hidden="true" />
              {unread > 0 && (
                <span className="absolute -top-0.5 end-0.5 min-w-[1.05rem] rounded-full bg-accent-500 px-1 text-center text-[0.65rem] font-black leading-[1.05rem] text-navy-900">
                  {fmt(unread)}
                </span>
              )}
            </Link>
          )}

          {user ? (
            <motion.button
              type="button"
              onClick={logout}
              whileTap={{ scale: 0.97 }}
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-full border border-rule px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-mist sm:flex"
            >
              {/*
                Capped at 88px and truncated. Signed in, the bar carries nine
                nav items and has 36px to spare at its narrowest, and this is
                the one width left that comes from the user rather than from
                us. 88px clears «عبدالرحمن» — about the longest Arabic first
                name — uncut, while capping the growth this button can add at
                25px, inside that 36px.
              */}
              <LogOut size={15} aria-hidden="true" />
              <span className="max-w-[5.5rem] truncate">{user.name.split(' ')[0]}</span>
            </motion.button>
          ) : (
            <>
              <Link to="/login" className="hidden whitespace-nowrap rounded-full bg-navy-700 px-4 py-2.5 text-sm font-bold text-white shadow-pill transition-all hover:bg-navy-800 hover:shadow-lift sm:inline-flex">
                {t('nav.enter')}
              </Link>
              <Link to="/register" className="hidden whitespace-nowrap rounded-full border border-rule px-4 py-2.5 text-sm font-bold text-navy-700 transition-colors hover:bg-navy-50 lg:inline-flex">
                {t('nav.signIn')}
              </Link>
            </>
          )}

          <button
            type="button"
            className="rounded-full p-2 text-ink-muted hover:bg-mist xl:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={t('nav.toggleMenu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="mx-auto mt-2 max-w-[1400px] overflow-hidden rounded-3xl border border-rule bg-surface p-3 shadow-lift xl:hidden"
          >
            <nav className="grid gap-0.5 sm:grid-cols-2" aria-label="Mobile">
              {[...PRIMARY, ...SERVICES, ...trailing].map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.25 }}
                >
                  <NavLink
                    to={l.to}
                    end={l.to === '/'}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      `block rounded-xl px-4 py-3 text-sm transition-colors ${
                        isActive ? 'bg-navy-50 font-bold text-navy-700' : 'font-medium text-ink-muted hover:bg-mist'
                      }`
                    }
                  >
                    {t(l.key)}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
            {!user && (
              <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-primary mt-3 w-full">
                {t('nav.enter')}
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
