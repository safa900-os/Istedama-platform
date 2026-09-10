import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function NotFound() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-sm text-ink-muted">404</p>
      <h1 className="mt-2 font-display text-2xl font-semibold text-ink">{t('notfound.title')}</h1>
      <p className="mt-2 text-ink-muted">{t('notfound.body')}</p>
      <Link to="/" className="mt-6 rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-navy-900">
        {t('notfound.back')}
      </Link>
    </div>
  );
}
