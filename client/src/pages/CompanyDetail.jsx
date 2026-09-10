import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Users, Award, ShieldCheck } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import api from '../api/axios';
import ScoreSeal from '../components/ScoreSeal';
import { useLanguage } from '../context/LanguageContext';

const COLORS = ['#223E98', '#EC9D51', '#8299E4'];

export default function CompanyDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const { t, tGov, fmt, isRTL, pick } = useLanguage();

  useEffect(() => {
    api
      .get(`/companies/${id}`)
      .then((res) => setData(res.data.data))
      .catch(() => setError(t('detail.notFound')));
  }, [id, t]);

  if (error) return <p className="mx-auto max-w-2xl px-6 py-20 text-center text-ink-muted">{error}</p>;
  if (!data) return <p className="mx-auto max-w-2xl px-6 py-20 text-center text-ink-soft">{t('detail.loading')}</p>;

  const { company, latestEvaluation } = data;
  const chartData = latestEvaluation
    ? [
        { name: t('detail.omanization'), value: latestEvaluation.omanizationRateSnapshot },
        { name: t('detail.icv'), value: latestEvaluation.icvPercentage },
        { name: t('detail.financial'), value: latestEvaluation.financialStabilityIndex }
      ]
    : [];

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <Link to="/companies" className="text-sm text-gold-700 hover:underline">
        {isRTL ? '→' : '←'} {t('detail.back')}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {/* The same mark the directory card shows, so arriving here from a
              card does not feel like landing on a different company. */}
          {company.logo && (
            <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white p-0.5 shadow-soft ring-1 ring-rule">
              <img src={company.logo} alt="" className="h-full w-full rounded-xl object-contain" />
            </span>
          )}
          <div>
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{pick(company, 'companyName')}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
            <MapPin size={14} /> {tGov(company.governorate)} · {t('dir.cr')} {company.crNumber}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{pick(company, 'sector')}</p>
          </div>
        </div>
        {latestEvaluation?.certificateIssued && (
          <span className="flex items-center gap-2 rounded-full bg-teal-50 px-4 py-2 text-sm font-semibold text-teal-600">
            <ShieldCheck size={16} /> {t('detail.certified')} · <span dir="ltr">{latestEvaluation.certificateSerial}</span>
          </span>
        )}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ScoreSeal score={latestEvaluation?.calculatedScore ?? 0} label={t('detail.score')} />

        <div className="rounded-xl border border-rule bg-white p-6 shadow-card">
          <h2 className="font-display font-semibold text-ink">{t('detail.breakdown')}</h2>
          {latestEvaluation ? (
            <div className="mt-2 h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={3}>
                    {chartData.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 text-xs">
                {chartData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                    {d.name}: {fmt(d.value)}%
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">{t('detail.noEvaluation')}</p>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-rule bg-white p-5">
          <Users size={16} className="text-navy-700" />
          <p className="mt-2 font-display text-lg font-semibold text-ink">{fmt(company.employeeCount)}</p>
          <p className="text-xs text-ink-soft">
            {t('detail.employees')} ({fmt(company.omaniEmployeeCount)} {t('detail.omaniOf')})
          </p>
        </div>
        <div className="rounded-xl border border-rule bg-white p-5">
          <Award size={16} className="text-gold-700" />
          <p className="mt-2 font-display text-lg font-semibold text-ink">
            {company.hasRiyadaCard ? t('detail.yes') : t('detail.no')}
          </p>
          <p className="text-xs text-ink-soft">{t('detail.riyada')}</p>
        </div>
        <div className="rounded-xl border border-rule bg-white p-5">
          <ShieldCheck size={16} className="text-teal-600" />
          <p className="mt-2 font-display text-lg font-semibold text-ink">
            {latestEvaluation?.certificateIssued ? t('detail.certified') : t('detail.pending')}
          </p>
          <p className="text-xs text-ink-soft">{t('detail.status')}</p>
        </div>
      </div>

      {pick(latestEvaluation, 'auditorNotes') && (
        <div className="mt-6 rounded-xl border border-rule bg-canvas p-6">
          <h3 className="text-sm font-semibold text-ink">{t('detail.notes')}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-muted">{pick(latestEvaluation, 'auditorNotes')}</p>
        </div>
      )}
    </div>
  );
}
