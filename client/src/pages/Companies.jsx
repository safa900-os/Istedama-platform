import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import api from '../api/axios';
import CompanyCard from '../components/CompanyCard';
import { useLanguage } from '../context/LanguageContext';
import { GOVERNORATES } from '../i18n/translations';

export default function Companies() {
  const [params, setParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, tGov } = useLanguage();
  const search = params.get('search') || '';
  const governorate = params.get('governorate') || '';

  useEffect(() => {
    setLoading(true);
    api
      .get('/companies', { params: { search: search || undefined, governorate: governorate || undefined } })
      .then((res) => setCompanies(res.data.data))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [search, governorate]);

  const setParam = (key) => (e) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      e.target.value ? n.set(key, e.target.value) : n.delete(key);
      return n;
    });

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{t('dir.title')}</h1>
          <p className="mt-1 text-ink-muted">{t('dir.subtitle')}</p>
        </div>
        <Link to="/register" className="rounded-full bg-navy-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-900">
          {t('dir.register')}
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-full border border-rule bg-white px-4 py-2.5">
          <Search size={16} className="text-ink-soft" />
          <input
            value={search}
            onChange={setParam('search')}
            placeholder={t('dir.searchPlaceholder')}
            aria-label={t('nav.searchLabel')}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={governorate}
          onChange={setParam('governorate')}
          aria-label={t('form.governorate')}
          className="rounded-full border border-rule bg-white px-4 py-2.5 text-sm"
        >
          <option value="">{t('dir.allGovernorates')}</option>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{tGov(g)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-ink-muted">{t('dir.loading')}</p>
      ) : companies.length === 0 ? (
        <p className="mt-10 text-sm text-ink-muted">{t('dir.empty')}</p>
      ) : (
        <div className="mt-6 grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {companies.map((c) => (
            <CompanyCard key={c._id} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
