import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/logo.png';

export default function Footer() {
  const { t } = useLanguage();

  const explore = [
    { to: '/tenders', key: 'nav.tenders' },
    { to: '/facilities', key: 'nav.facilities' },
    { to: '/discounts', key: 'nav.discounts' },
    { to: '/companies', key: 'nav.directory' }
  ];
  const programme = [
    { to: '/about', key: 'nav.about' },
    { to: '/register', key: 'dir.register' },
    { to: '/advertise', key: 'nav.advertise' },
    { to: '/partners', key: 'nav.partners' },
    { to: '/contact', key: 'nav.contact' }
  ];

  return (
    <footer className="mt-auto border-t-4 border-gold-500 bg-navy-900 text-navy-100">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-1">
            {/* The mark is navy-on-transparent, so it needs a light plate here */}
            <span className="inline-flex rounded-md bg-white px-3 py-2">
              <img src={logo} alt="Istedama" className="h-8 w-auto" />
            </span>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-200">{t('footer.tagline')}</p>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{t('footer.explore')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {explore.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-navy-200 transition-colors hover:text-gold-300">{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{t('footer.programme')}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {programme.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-navy-200 transition-colors hover:text-gold-300">{t(l.key)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.12em] text-white">{t('footer.getInTouch')}</h3>
            <ul className="mt-4 space-y-3 text-sm text-navy-200">
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-gold-300" />
                <span dir="ltr">info@istidamah.om</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0 text-gold-300" />
                <span dir="ltr">+968 2200 0000</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-gold-300" />
                <span>{t('contact.addressValue')}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-navy-300 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {t('footer.rights')}</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span>{t('footer.privacy')}</span>
            <span>{t('footer.terms')}</span>
            <span>{t('footer.accessibility')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
