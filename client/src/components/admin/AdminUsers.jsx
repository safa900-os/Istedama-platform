import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShieldCheck, ShieldOff, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { EASE } from '../../motion/presets';

const ROLES = ['sme_owner', 'merchant', 'auditor', 'admin'];

/**
 * User administration: search, filter, change role, suspend and delete.
 *
 * The signed-in administrator's own row is locked in the UI, matching the
 * server rule that forbids self-modification. The server remains the
 * authority — this only stops the user reaching for a control that would be
 * rejected anyway.
 */
export default function AdminUsers() {
  const { t } = useLanguage();
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/users', {
        params: { search: search || undefined, role: role !== 'all' ? role : undefined, limit: 50 }
      });
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [search, role]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(load, 300);
    return () => clearTimeout(id);
  }, [load]);

  const act = async (id, fn) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  const changeRole = (u, next) =>
    act(u._id, () => api.patch(`/admin/users/${u._id}/role`, { role: next }));

  const toggleStatus = (u) =>
    act(u._id, () => api.patch(`/admin/users/${u._id}/status`, { active: !u.active }));

  const remove = (u) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    act(u._id, () => api.delete(`/admin/users/${u._id}`));
  };

  return (
    <div className="card-pad">
      <h2 className="font-display text-xl font-black text-navy-900">{t('admin.users')}</h2>

      <div className="mt-5 flex flex-wrap gap-3">
        <div className="flex flex-1 min-w-[220px] items-center gap-2 rounded-xl border border-rule bg-mist px-3.5 py-2.5">
          <Search size={15} className="shrink-0 text-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('admin.searchUsers')}
            aria-label={t('admin.searchUsers')}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label={t('admin.role')}
          className="rounded-xl border border-rule bg-surface px-3.5 py-2.5 text-sm"
        >
          <option value="all">{t('admin.allRoles')}</option>
          {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
        </select>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="mt-6 text-sm text-ink-soft">{t('admin.loading')}</p>
      ) : users.length === 0 ? (
        <p className="mt-6 text-sm text-ink-soft">{t('admin.noUsers')}</p>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="border-b border-rule text-xs font-bold uppercase tracking-wide text-ink-soft">
                <th className="p-3 text-start">{t('admin.name')}</th>
                <th className="p-3 text-start">{t('admin.role')}</th>
                <th className="p-3 text-start">{t('admin.status')}</th>
                <th className="p-3 text-end">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => {
                const isSelf = u._id === me?._id;
                const busy = busyId === u._id;
                return (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: busy ? 0.5 : 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.2), duration: 0.25, ease: EASE }}
                    className="border-b border-rule last:border-0"
                  >
                    <td className="p-3">
                      <p className="font-bold text-ink">
                        {u.name}
                        {isSelf && <span className="ms-2 pill-info">{t('admin.you')}</span>}
                      </p>
                      <p className="font-mono text-xs text-ink-soft" dir="ltr">{u.email}</p>
                    </td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        disabled={isSelf || busy}
                        title={isSelf ? t('admin.selfLocked') : undefined}
                        onChange={(e) => changeRole(u, e.target.value)}
                        aria-label={`${t('admin.role')} — ${u.name}`}
                        className="rounded-lg border border-rule bg-surface px-2.5 py-1.5 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
                      </select>
                    </td>
                    <td className="p-3">
                      <span className={u.active ? 'pill-ok' : 'pill-muted'}>
                        {u.active ? t('admin.active') : t('admin.suspended')}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          disabled={isSelf || busy}
                          onClick={() => toggleStatus(u)}
                          title={isSelf ? t('admin.selfLocked') : undefined}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rule px-2.5 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-mist disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {u.active ? <ShieldOff size={13} /> : <ShieldCheck size={13} />}
                          {u.active ? t('admin.suspend') : t('admin.activate')}
                        </button>
                        <button
                          type="button"
                          disabled={isSelf || busy}
                          onClick={() => remove(u)}
                          title={isSelf ? t('admin.selfLocked') : undefined}
                          aria-label={`${t('admin.delete')} — ${u.name}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
