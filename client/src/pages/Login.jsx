import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isValidEmail } from '../utils/credentials';
import { EASE } from '../motion/presets';

/**
 * Split-screen sign-in: the form on one side, a photographic brand panel on
 * the other.
 *
 * One field takes an email address or a phone number. Splitting them into two
 * inputs, or making the user pick a type first, adds a decision before the
 * account holder has done anything — and they already know which one they use.
 * The server resolves whichever was given.
 *
 * Validation here checks shape and presence only, never password strength.
 * Re-testing strength at sign-in would lock out accounts created under an
 * earlier policy and would advertise the rules to anyone probing the endpoint.
 */

/** Accepts an address, or something with enough digits to be a phone number. */
const isValidIdentifier = (value) => {
  const v = String(value).trim();
  if (!v) return false;
  return isValidEmail(v) || v.replace(/\D/g, '').length >= 8;
};

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [showPw, setShowPw] = useState(false);
  const [touched, setTouched] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const idError = touched.identifier && !isValidIdentifier(identifier) ? t('auth.errIdentifier') : '';
  const pwError = touched.password && !password ? t('auth.errPasswordEmpty') : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setTouched({ identifier: true, password: true });

    // Field-level problems already show under each input; don't repeat them.
    if (!isValidIdentifier(identifier) || !password) return;

    setLoading(true);
    try {
      await login(identifier.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1500px] px-3 py-6 sm:px-5">
      {/*
        The photograph leads on small screens (`order-first`) and moves beside
        the form from `lg` up, matching how the printed layout reads.
      */}
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {/* --------------------------------------------------------- form */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="relative flex items-center justify-center overflow-hidden rounded-4xl border border-rule bg-surface px-6 py-12 shadow-card sm:px-12 lg:py-16"
        >
          {/* Concentric rings, echoing the registration header. Decorative and
              pointer-transparent so they never intercept a click. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-40 h-[340px] w-[340px] rounded-full border border-navy-100 ltr:-left-32 rtl:-right-32"
            style={{ boxShadow: '0 0 0 34px rgba(216,227,242,.35), 0 0 0 68px rgba(216,227,242,.18)' }}
          />

          <div className="relative z-10 w-full max-w-[520px]">
            <p className="eyebrow">{t('auth.brandEyebrow')}</p>

            <h1 className="mt-4 font-display text-[2.1rem] font-black leading-tight tracking-tight text-navy-900 sm:text-[2.6rem]">
              {t('auth.welcomeBack')}
            </h1>
            <p className="mt-4 leading-loose text-ink-muted">{t('auth.signInSubtitle')}</p>

            <form noValidate onSubmit={handleSubmit} className="mt-9 space-y-5">
              <div>
                <label htmlFor="identifier" className="label">{t('auth.identifier')}</label>
                <div className="field-shell">
                  <Mail size={18} className="field-glyph" />
                  <input
                    id="identifier"
                    type="text"
                    dir="ltr"
                    autoComplete="username"
                    placeholder={t('auth.identifierPlaceholder')}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, identifier: true }))}
                    aria-invalid={Boolean(idError)}
                    aria-describedby={idError ? 'identifier-error' : undefined}
                    className={`field field-icon h-[54px] ${idError ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                </div>
                {idError && (
                  <p id="identifier-error" role="alert" className="mt-1.5 text-xs text-red-600">
                    {idError}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="label">{t('auth.password')}</label>
                <div className="field-shell">
                  <Lock size={18} className="field-glyph" />
                  <input
                    id="password"
                    type={showPw ? 'text' : 'password'}
                    dir="ltr"
                    autoComplete="current-password"
                    placeholder={t('auth.passwordPlaceholder')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((s) => ({ ...s, password: true }))}
                    aria-invalid={Boolean(pwError)}
                    aria-describedby={pwError ? 'password-error' : undefined}
                    className={`field field-icon h-[54px] pr-12 ${pwError ? 'border-red-400 focus:border-red-500' : ''}`}
                  />
                  {/* Anchored to the physical right: the input is dir="ltr", so
                      a logical utility would flip onto the text. */}
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-soft transition-colors hover:text-navy-700"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {pwError && (
                  <p id="password-error" role="alert" className="mt-1.5 text-xs text-red-600">
                    {pwError}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-muted">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-[17px] w-[17px] accent-navy-700"
                  />
                  {t('auth.rememberMe')}
                </label>
                <Link to="/contact" className="text-sm font-bold text-navy-700 hover:underline">
                  {t('auth.forgot')}
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary h-[54px] w-full justify-center text-base disabled:opacity-70"
              >
                {loading ? t('auth.signingIn') : t('auth.signIn')}
              </button>
            </form>

            <AnimatePresence>
              {error && (
                <motion.p
                  role="alert"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  <AlertCircle size={15} className="shrink-0" /> {error}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="my-7 flex items-center gap-3.5 text-xs text-ink-soft">
              <span className="h-px flex-1 bg-rule" />
              {t('auth.or')}
              <span className="h-px flex-1 bg-rule" />
            </div>

            <p className="text-center text-sm text-ink-muted">
              {t('auth.noAccount')}{' '}
              <Link to="/register" className="font-black text-navy-700 hover:underline">
                {t('auth.createAccount')}
              </Link>
            </p>
          </div>
        </motion.div>

        {/* ------------------------------------------------------- visual */}
        <motion.aside
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="relative order-first min-h-[380px] overflow-hidden rounded-4xl bg-navy-800 lg:order-none lg:min-h-[620px]"
        >
          <img
            src="/login-visual.png"
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* Two stacked scrims: a flat one to hold the brand tint, and a
              vertical one so the text at the foot keeps its contrast whatever
              the photograph does behind it. */}
          <span aria-hidden="true" className="absolute inset-0 bg-navy-900/35" />
          <span
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-navy-900/85 via-navy-900/25 to-navy-900/10"
          />

          <div className="relative flex h-full flex-col justify-between p-8 text-white sm:p-11">
            <span className="inline-flex w-fit items-center gap-2.5 rounded-full border border-white/25 bg-white/15 px-4 py-2.5 text-xs font-bold backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-accent-500" />
              {t('auth.visualBadge')}
            </span>

            <div className="max-w-[620px]">
              <h2 className="font-display text-[clamp(1.9rem,4vw,3.4rem)] font-black leading-tight">
                {t('auth.visualTitle')}
              </h2>
              <p className="mt-4 max-w-[560px] leading-loose text-white/85">
                {t('auth.visualBody')}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  ['100+', t('auth.stat1')],
                  ['24/7', t('auth.stat2')]
                ].map(([value, label]) => (
                  <div
                    key={label}
                    className="min-w-[145px] rounded-2xl border border-white/20 bg-white/12 px-4 py-3.5 backdrop-blur"
                  >
                    <strong className="block font-display text-xl font-black">{value}</strong>
                    <span className="mt-0.5 block text-[11px] text-white/80">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </div>
  );
}
