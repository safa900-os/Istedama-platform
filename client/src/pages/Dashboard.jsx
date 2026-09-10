import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Users, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';
import ScoreSeal from '../components/ScoreSeal';
import DashboardSidebar from '../components/DashboardSidebar';
import AdminUsers from '../components/admin/AdminUsers';
import MotionCard from '../components/ui/MotionCard';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { staggerList, riseItem, EASE } from '../motion/variants';

export default function Dashboard() {
  const { user } = useAuth();
  const { t, tGov, fmt } = useLanguage();
  const [stats, setStats] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState('overview');
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/companies/stats/overview'), api.get('/evaluations')])
      .then(([s, e]) => {
        setStats(s.data.data);
        setEvaluations(e.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const avgScore = evaluations.length
    ? Math.round((evaluations.reduce((sum, e) => sum + e.calculatedScore, 0) / evaluations.length) * 10) / 10
    : 0;
  const certifiedCount = evaluations.filter((e) => e.certificateIssued).length;
  const govData = (stats?.byGovernorate || []).map((g) => ({ name: tGov(g._id), count: g.count }));
  const scoreTrend = evaluations
    .slice()
    .sort((a, b) => new Date(a.evaluationDate) - new Date(b.evaluationDate))
    .map((e, i) => ({ name: `#${i + 1}`, score: e.calculatedScore }));

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t('nav.dashboard')}</p>
          <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-[1.9rem]">
            {t('dash.welcome')}{user?.name ? `، ${user.name.split(' ')[0]}` : ''}
          </h1>
          <p className="mt-1.5 text-ink-muted">{t('dash.subtitle')}</p>
        </div>
        <Link to="/register" className="btn-accent">{t('dash.newSme')}</Link>
      </div>

      <div className="mt-8 flex gap-6">
        <DashboardSidebar
          active={section}
          onSelect={setSection}
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
        />

        <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              {section === 'users' ? (
                <AdminUsers />
              ) : section === 'analytics' ? (
                <div className="space-y-5">
                  <MotionCard className="p-5" accent={false}>
                    <h2 className="font-display font-bold text-navy-900">{t('dash.byGovernorate')}</h2>
                    <div className="mt-3 h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={govData} margin={{ top: 10, right: 10, left: -20, bottom: 40 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E7F6" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-32} textAnchor="end" interval={0} />
                          <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                          <Tooltip cursor={{ fill: '#F3F5FC' }} />
                          <Bar dataKey="count" fill="#223E98" radius={[5, 5, 0, 0]} animationDuration={900} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </MotionCard>

                  <MotionCard className="p-5" accent={false}>
                    <h2 className="font-display font-bold text-navy-900">{t('dash.recentScores')}</h2>
                    {scoreTrend.length ? (
                      <div className="mt-3 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={scoreTrend}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E7F6" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#EC9D51" strokeWidth={3} dot={{ r: 4 }} animationDuration={1100} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-ink-muted">{loading ? t('dash.loading') : t('dash.noEvaluations')}</p>
                    )}
                  </MotionCard>
                </div>
              ) : (
                <div className="space-y-6">
                  <motion.div variants={staggerList} initial="hidden" animate="show" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <motion.div variants={riseItem}><StatCard icon={Building2} label={t('home.statCompanies')} value={stats ? fmt(stats.totalCompanies) : '—'} accent="navy" /></motion.div>
                    <motion.div variants={riseItem}><StatCard icon={Users} label={t('home.statOmanization')} value={stats ? `${fmt(stats.avgOmanizationRate)}%` : '—'} accent="teal" /></motion.div>
                    <motion.div variants={riseItem}><StatCard icon={TrendingUp} label={t('dash.avgScore')} value={avgScore ? fmt(avgScore) : '—'} accent="gold" /></motion.div>
                    <motion.div variants={riseItem}><StatCard icon={Award} label={t('dash.certified')} value={fmt(certifiedCount)} sublabel={t('dash.certifiedSub')} accent="teal" /></motion.div>
                  </motion.div>

                  <div className="grid gap-6 lg:grid-cols-[auto,1fr] lg:items-start">
                    <div className="card-pad flex justify-center">
                      <ScoreSeal score={avgScore} label={t('dash.platformAvg')} size="sm" />
                    </div>
                    <MotionCard className="p-5" accent={false}>
                      <h2 className="font-display font-bold text-navy-900">{t('dash.byGovernorate')}</h2>
                      <div className="mt-3 h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={govData} margin={{ top: 10, right: 10, left: -20, bottom: 36 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E7F6" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" interval={0} />
                            <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#F3F5FC' }} />
                            <Bar dataKey="count" fill="#223E98" radius={[5, 5, 0, 0]} animationDuration={900} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </MotionCard>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
