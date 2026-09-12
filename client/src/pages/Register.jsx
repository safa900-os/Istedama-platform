import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, ArrowLeft, ArrowRight, Eye, EyeOff, Check, X,
  UserRound, Mail, Phone, Lock, Building2, Hash, MapPin, Scale, Tags, Globe,
  Landmark, CreditCard, CalendarDays, IdCard, Users, Briefcase, BadgeCheck
} from 'lucide-react';
import api from '../api/axios';
import RegistrationHeader from '../components/RegistrationHeader';
import StepTrack from '../components/StepTrack';
import NdaAgreement from '../components/NdaAgreement';
import DocumentChecklist from '../components/DocumentChecklist';
import BankAccounts, { emptyAccount } from '../components/BankAccounts';
import CategoryPicker from '../components/CategoryPicker';
import LocationPicker from '../components/LocationPicker';
import Field from '../components/ui/Field';
import AnimatedCheckbox from '../components/ui/AnimatedCheckbox';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { isValidEmail, passwordFailures, PASSWORD_CHECKS } from '../utils/credentials';
import { GOVERNORATES } from '../i18n/translations';
import { EASE } from '../motion/presets';

/**
 * Registration, end to end, on one page.
 *
 * A merchant runs through five stages and an organisation through three, as
 * two separate journeys behind one pair of tabs. The type is genuinely a
 * choice here because no account exists yet; from the moment the account is
 * created it follows the account and the server enforces it.
 *
 * The page creates two things in order: the user account, then the enterprise
 * record owned by it. That order is not cosmetic — a company row references
 * its owner, and the upload routes are addressed by company id, so nothing can
 * be sent until both exist. Everything is therefore held in the browser until
 * the final submit.
 *
 * Three groups of fields are here that the printed form does not have, because
 * the platform cannot function without them:
 *
 *   - a password, since this creates a real account;
 *   - workforce counts and a map location, which the sustainability score is
 *     calculated from and which the API requires.
 *
 * They are grouped and labelled so it is clear they belong to the assessment
 * rather than to the paperwork.
 */

const BANKS = ['بنك مسقط', 'البنك الوطني العماني', 'صحار الدولي', 'بنك ظفار'];
const ORG_TYPES = ['waqf', 'association', 'civil', 'nonprofit'];
const IBAN_RE = /^OM\d{2}[A-Z0-9]{3,30}$/i;
const PHONE_RE = /^\+?[\d\s-]{8,15}$/;

const INITIAL = {
  // Account
  fullName: '', email: '', phone: '', password: '',
  // Enterprise
  companyName: '', companyNameAr: '', crNumber: '', legalForm: '',
  governorate: '', address: '', website: '', category: '', isSme: false,
  sector: '', registrationDate: '',
  employeeCount: '', omaniEmployeeCount: '', location: null,
  // Bank
  // Merchants hold a list; the freelance journey keeps the single-account
  // fields below, because a permit covers one person with one account.
  bankAccounts: [{ ...emptyAccount(), isPrimary: true }],
  serviceCategories: [],
  bankName: '', accountHolder: '', accountNumber: '', confirmAccountNumber: '', iban: '',
  // Organisation
  description: '', organizationType: '', registrationExpiry: '', proofExpiry: '',
  representativeName: '', representativeNationalId: '',
  representativeEmail: '', representativePhone: '',
  // Self-employment
  civilNumber: '', profession: '', specialisation: '',
  freelancePermitNo: '', ecommerceLicenceNo: '',
  storeUrl: '', socialUrl: '', maroofUrl: ''
};

export default function Register() {
  const { t, tGov, fmt, isRTL } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [entityType, setEntityType] = useState('merchant');
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [form, setForm] = useState(INITIAL);
  const [docs, setDocs] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);
  const [ndaSignedAt, setNdaSignedAt] = useState(null);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeLaw, setAgreeLaw] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  const isMerchant = entityType === 'merchant';
  const isFreelance = entityType === 'freelance';
  const isOrganization = entityType === 'organization';
  const Next = isRTL ? ArrowLeft : ArrowRight;
  const Back = isRTL ? ArrowRight : ArrowLeft;
  // Declared after `steps` below; see `isLastStep`.

  /*
    Each type runs its own stages. Self-employment has four, matching the
    permit-holder's journey: who they are and what they do, the permit and any
    e-commerce licence, the bank account and the files, then the review.
  */
  const STAGES = {
    merchant: ['general', 'company', 'bank', 'documents', 'review'],
    organization: ['orgDetails', 'representative', 'documents'],
    freelance: ['freelanceProfile', 'freelanceLicence', 'freelanceVerify', 'review']
  };
  const stageKeys = STAGES[entityType];
  const steps = stageKeys.map((k) => t(`rw.s.${k}`));
  const heading = stageKeys[step];

  const isLastStep = step === steps.length - 1;

  /*
    The account that gets paid. The list always carries exactly one primary —
    the component and the server both hold to that — but the review must render
    even mid-edit, so this falls back rather than reaching into index 0 blindly.
  */
  const primaryAccount =
    form.bankAccounts.find((a) => a.isPrimary) || form.bankAccounts[0] || emptyAccount();

  const pwFailures = useMemo(() => passwordFailures(form.password), [form.password]);

  const update = (k) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    setFieldErrors((prev) => {
      if (!prev[k]) return prev;
      const next = { ...prev };
      delete next[k];
      return next;
    });
  };

  /** Switching type restarts the journey — the two have different stages. */
  const switchType = (id) => {
    setEntityType(id);
    setStep(0);
    setFieldErrors({});
    setError('');
  };

  /* --------------------------------------------------------- validation */

  const validateStep = () => {
    const e = {};

    if (isMerchant && step === 0) {
      if (form.fullName.trim().length < 2) e.fullName = t('form.errRequired');
      if (!isValidEmail(form.email)) e.email = t('auth.errEmail');
      if (!PHONE_RE.test(form.phone)) e.phone = t('form.errPhone');
      if (pwFailures.length) e.password = t('auth.errPasswordWeak');
    }

    if (isMerchant && step === 1) {
      if (!form.companyName.trim()) e.companyName = t('form.errRequired');
      if (!form.companyNameAr.trim()) e.companyNameAr = t('form.errRequired');
      if (!/^[0-9]{4,10}$/.test(form.crNumber)) e.crNumber = t('form.errCrNumber');
      if (!form.governorate) e.governorate = t('form.errSelectGovernorate');
      if (form.website && !/^https?:\/\/\S+\.\S+/.test(form.website)) {
        e.website = t('form.errWebsite');
      }
      Object.assign(e, assessmentErrors());
    }

    if (isMerchant && step === 2) {
      if (!form.bankAccounts.length) e.bankAccounts = t('form.errOneAccount');
      /*
        Every account is checked, not only the primary one. A second account
        left half-filled would be dropped by the server without a word, and the
        merchant would believe they had registered it.
      */
      form.bankAccounts.forEach((a, i) => {
        const at = (k, msg) => {
          e[`bankAccounts.${i}.${k}`] = msg;
        };
        if (!a.bankName) at('bankName', t('form.errSelectBank'));
        if (!a.accountHolder.trim()) at('accountHolder', t('form.errRequired'));
        if (!a.accountNumber.trim()) at('accountNumber', t('form.errRequired'));
        else if (a.accountNumber.trim() !== a.confirmAccountNumber.trim()) {
          at('confirmAccountNumber', t('form.errAccountMismatch'));
        }
        if (!IBAN_RE.test(a.iban.trim())) at('iban', t('form.errorIban'));
      });
    }

    /* --------------------------------------------- self-employment */

    if (isFreelance && step === 0) {
      if (form.fullName.trim().length < 2) e.fullName = t('form.errRequired');
      if (!isValidEmail(form.email)) e.email = t('auth.errEmail');
      if (!PHONE_RE.test(form.phone)) e.phone = t('form.errPhone');
      // Eight digits, as the card is issued. Same rule as the server's.
      if (!/^[0-9]{8}$/.test(form.civilNumber.trim())) {
        e.civilNumber = t('form.errCivilNumber');
      }
      if (!form.profession.trim()) e.profession = t('form.errRequired');
      if (!form.governorate) e.governorate = t('form.errSelectGovernorate');
      if (pwFailures.length) e.password = t('auth.errPasswordWeak');
    }

    if (isFreelance && step === 1) {
      if (!form.freelancePermitNo.trim()) e.freelancePermitNo = t('form.errRequired');
      // The optional links are only checked when something was typed: an empty
      // optional field is not an error, but a malformed one is.
      for (const k of ['storeUrl', 'socialUrl', 'maroofUrl']) {
        if (form[k] && !/^https?:\/\/\S+\.\S+/.test(form[k])) e[k] = t('form.errWebsite');
      }
    }

    if (isFreelance && step === 2) {
      if (!form.bankName) e.bankName = t('form.errSelectBank');
      if (!form.accountHolder.trim()) e.accountHolder = t('form.errRequired');
      if (!IBAN_RE.test(form.iban.trim())) e.iban = t('form.errorIban');
    }

    if (isOrganization && step === 0) {
      if (!form.companyName.trim()) e.companyName = t('form.errRequired');
      if (!form.companyNameAr.trim()) e.companyNameAr = t('form.errRequired');
      if (!form.description.trim()) e.description = t('form.errRequired');
      if (!form.governorate) e.governorate = t('form.errSelectGovernorate');
      if (!form.organizationType) e.organizationType = t('form.errSelectOrgType');
      if (!/^[0-9]{4,10}$/.test(form.crNumber)) e.crNumber = t('form.errCrNumber');
      if (!form.registrationExpiry) e.registrationExpiry = t('form.errRequired');
      Object.assign(e, assessmentErrors());
    }

    if (isOrganization && step === 1) {
      if (form.representativeName.trim().length < 2) e.representativeName = t('form.errRequired');
      if (!form.representativeNationalId.trim()) {
        e.representativeNationalId = t('form.errRequired');
      }
      if (!isValidEmail(form.representativeEmail)) e.representativeEmail = t('auth.errEmail');
      if (!PHONE_RE.test(form.representativePhone)) e.representativePhone = t('form.errPhone');
      if (pwFailures.length) e.password = t('auth.errPasswordWeak');
    }

    return e;
  };

  /** Shared assessment inputs: workforce counts and the map pin. */
  const assessmentErrors = () => {
    const e = {};
    const total = Number(form.employeeCount);
    const omani = Number(form.omaniEmployeeCount);
    if (!total || total < 1) e.employeeCount = t('form.errEmployeeCount');
    if (form.omaniEmployeeCount === '' || Number.isNaN(omani) || omani < 0) {
      e.omaniEmployeeCount = t('form.errOmaniCount');
    } else if (total && omani > total) {
      e.omaniEmployeeCount = t('form.errorOmaniExceeds');
    }
    if (!form.location) e.location = t('form.errorLocation');
    return e;
  };

  const go = (delta) => {
    setError('');
    if (delta > 0) {
      const problems = validateStep();
      if (Object.keys(problems).length) {
        setFieldErrors(problems);
        setError(problems.location || '');
        const first = Object.keys(problems).find((k) => k !== 'location');
        if (first) requestAnimationFrame(() => document.getElementById(first)?.focus());
        return;
      }
      setFieldErrors({});
    }
    setDir(delta);
    setStep((s) => Math.min(Math.max(s + delta, 0), steps.length - 1));
  };

  /* ------------------------------------------------------------- submit */

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!ndaSignedAt) return setError(t('nda.required'));
    if (!agreeTerms || !agreeLaw) return setError(t('form.errorConfirm'));

    setLoading(true);
    try {
      // 1. The account. The company row references its owner, so this has to
      //    exist first — and its token authorises everything after it.
      setNotice(t('rw.creatingAccount'));
      /*
        A merchant and a self-employed practitioner both sign up as themselves;
        an organisation signs up through its representative. The role decides
        the record type on the server, so it is the only thing that has to be
        right here — the payload's own entityType is ignored there.
      */
      const personal = isOrganization
        ? {
            name: form.representativeName,
            email: form.representativeEmail,
            phone: form.representativePhone
          }
        : { name: form.fullName, email: form.email, phone: form.phone };

      await register({
        ...personal,
        password: form.password,
        role: { merchant: 'merchant', freelance: 'freelancer', organization: 'sme_owner' }[
          entityType
        ]
      });

      // 2. The enterprise.
      setNotice(t('rw.creatingCompany'));
      const res = await api.post('/companies', {
        companyName: form.companyName,
        companyNameAr: form.companyNameAr || undefined,
        entityType,
        // A self-employment permit is not a commercial registration; the
        // server rejects the field for this type rather than storing a blank.
        crNumber: isFreelance ? undefined : form.crNumber,
        governorate: form.governorate,
        sector: form.sector || undefined,
        registrationDate: form.registrationDate || undefined,
        // A permit covers one person; the server sets these itself for the type.
        employeeCount: isFreelance ? undefined : Number(form.employeeCount),
        omaniEmployeeCount: isFreelance ? undefined : Number(form.omaniEmployeeCount),
        location: form.location,
        contactEmail: personal.email || undefined,
        contactPhone: personal.phone || undefined,

        legalForm: isMerchant ? form.legalForm || undefined : undefined,
        address: isMerchant ? form.address || undefined : undefined,
        website: isMerchant ? form.website || undefined : undefined,
        serviceCategories: isOrganization ? undefined : form.serviceCategories,
        isSme: isMerchant ? form.isSme : undefined,

        /*
          Whoever gets paid gives an account: a supplier and a practitioner both
          do, the buyer does not. A merchant sends the list; a permit-holder
          sends the single-account shape, which the server folds into a list of
          one. `confirmAccountNumber` never leaves the browser — it exists to
          catch a typo, not to be stored twice.
        */
        bankAccounts: isMerchant
          ? form.bankAccounts.map(({ confirmAccountNumber, ...a }) => ({
              ...a,
              iban: a.iban.trim().toUpperCase()
            }))
          : undefined,
        bankName: isFreelance ? form.bankName : undefined,
        accountHolder: isFreelance ? form.accountHolder : undefined,
        accountNumber: isFreelance ? form.accountNumber || undefined : undefined,
        iban: isFreelance ? form.iban.toUpperCase() : undefined,

        civilNumber: isFreelance ? form.civilNumber : undefined,
        profession: isFreelance ? form.profession : undefined,
        specialisation: isFreelance ? form.specialisation || undefined : undefined,
        freelancePermitNo: isFreelance ? form.freelancePermitNo : undefined,
        ecommerceLicenceNo: isFreelance ? form.ecommerceLicenceNo || undefined : undefined,
        storeUrl: isFreelance ? form.storeUrl || undefined : undefined,
        socialUrl: isFreelance ? form.socialUrl || undefined : undefined,
        maroofUrl: isFreelance ? form.maroofUrl || undefined : undefined,

        description: isOrganization ? form.description : undefined,
        organizationType: isOrganization ? form.organizationType : undefined,
        registrationExpiry: isOrganization ? form.registrationExpiry : undefined,
        proofExpiry: isOrganization ? form.proofExpiry || undefined : undefined,
        representativeName: isOrganization ? form.representativeName : undefined,
        representativeNationalId: isOrganization ? form.representativeNationalId : undefined,
        representativePhone: isOrganization ? form.representativePhone : undefined,

        ndaSignedAt
      });
      const company = res.data.data;

      // 3. Attachments, one request per slot. A failure here does not undo the
      //    registration — the account and company are already saved, so the
      //    user is told what did not arrive rather than losing everything.
      const entries = Object.entries(docs);
      if (entries.length) {
        setNotice(t('docs.uploading'));
        const results = await Promise.allSettled(
          entries.map(([slot, file]) => {
            const body = new FormData();
            body.append('file', file);
            return api.post(`/companies/${company._id}/documents/${slot}`, body);
          })
        );
        setNotice(results.some((r) => r.status === 'rejected') ? t('docs.uploadFailed') : '');
      } else {
        setNotice('');
      }

      setSuccess(company);
    } catch (err) {
      const details = err.response?.data?.details;
      setError(details?.length ? details.join(' · ') : err.response?.data?.message || t('form.errorGeneric'));
      setNotice('');
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------ success */

  if (success) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <CheckCircle2 size={52} className="mx-auto text-teal-600" strokeWidth={1.7} />
        </motion.div>
        <h1 className="mt-5 font-display text-2xl font-black text-navy-900">
          {isMerchant ? t('rw.successMerchant') : t('rw.successOrganization')}
        </h1>
        <p className="mt-3 leading-relaxed text-ink-muted">
          {isMerchant ? t('rw.successMerchantBody') : t('rw.successOrganizationBody')}
        </p>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-8">
          {t('nav.dashboard')}
        </button>
      </div>
    );
  }

  const slide = {
    enter: (d) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d) => ({ opacity: 0, x: d > 0 ? -40 : 40 })
  };

  const card = 'grid gap-4 rounded-3xl border border-rule bg-surface p-5 shadow-soft sm:grid-cols-2 sm:p-6';

  /** Workforce counts and map pin — required by the assessment, not the form. */
  const AssessmentBlock = (
    <div className={card}>
      <p className="label mb-0 sm:col-span-2">{t('rw.assessmentGroup')}</p>
      <Field
        id="employeeCount" type="number" min="1" dir="ltr" icon={Users} required
        label={t('form.totalEmployees')} value={form.employeeCount}
        onChange={update('employeeCount')} error={fieldErrors.employeeCount}
      />
      <Field
        id="omaniEmployeeCount" type="number" min="0" dir="ltr" icon={Users} required
        label={t('form.omaniEmployees')} value={form.omaniEmployeeCount}
        onChange={update('omaniEmployeeCount')} error={fieldErrors.omaniEmployeeCount}
      />
      <div className="sm:col-span-2">
        <p className="label">{t('form.location')} *</p>
        <LocationPicker
          value={form.location}
          onChange={(loc) => setForm((f) => ({ ...f, location: loc }))}
        />
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl px-3 py-10 sm:px-6">
      <RegistrationHeader
        entityType={entityType}
        onSelect={switchType}
        title={t(
          { merchant: 'reg.titleMerchant', organization: 'reg.titleOrganization', freelance: 'reg.titleFreelance' }[
            entityType
          ]
        )}
        subtitle={t(
          {
            merchant: 'reg.subtitleMerchant',
            organization: 'reg.subtitleOrganization',
            freelance: 'reg.subtitleFreelance'
          }[entityType]
        )}
      />

      <div className="rounded-b-4xl border border-rule bg-surface p-6 shadow-card sm:p-9">
        <StepTrack steps={steps} current={step} />

        <div className="mt-9">
          <h2 className="font-display text-[1.4rem] font-black text-navy-900">
            {t(`rw.h.${heading}.title`)}
          </h2>
          <p className="mt-1.5 text-sm text-ink-muted">{t(`rw.h.${heading}.body`)}</p>
        </div>

        <form onSubmit={submit} className="mt-6" noValidate>
          {/*
            Keyed on the registration type, outside AnimatePresence on purpose.

            Folding the type into the animated child's key made switching tabs a
            step transition, and `mode="wait"` then held the outgoing panel until
            its exit finished — which it never did, so the new panel never
            mounted and the form showed the previous type's fields under the new
            heading. Changing the key out here replaces the whole subtree
            instead: switching type is a different form, not a step, and should
            not slide.
          */}
          <div key={entityType}>
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: EASE }}
              className="space-y-4"
            >
              {/* ------------------------------ merchant 1 — general */}
              {isMerchant && step === 0 && (
                <div className={card}>
                  <Field
                    id="fullName" icon={UserRound} required autoComplete="name"
                    label={t('rw.fullName')} value={form.fullName}
                    onChange={update('fullName')} error={fieldErrors.fullName}
                  />
                  <Field
                    id="email" type="email" dir="ltr" icon={Mail} required autoComplete="email"
                    label={t('auth.email')} value={form.email}
                    onChange={update('email')} error={fieldErrors.email}
                  />
                  <Field
                    id="phone" type="tel" dir="ltr" icon={Phone} required inputMode="numeric"
                    placeholder="91234567" label={t('form.contactPhone')} value={form.phone}
                    onChange={update('phone')} error={fieldErrors.phone}
                  />
                  <PasswordField
                    {...{ form, update, showPw, setShowPw, pwFocused, setPwFocused, pwFailures, fieldErrors, t }}
                  />
                </div>
              )}

              {/* ------------------------------ merchant 2 — company */}
              {isMerchant && step === 1 && (
                <>
                  <div className={card}>
                    <Field
                      id="companyName" icon={Building2} required
                      label={t('rw.companyEnglish')} value={form.companyName}
                      onChange={update('companyName')} error={fieldErrors.companyName}
                    />
                    <Field
                      id="companyNameAr" dir="rtl" icon={Building2} required
                      label={t('rw.companyArabic')} value={form.companyNameAr}
                      onChange={update('companyNameAr')} error={fieldErrors.companyNameAr}
                    />
                    <Field
                      id="crNumber" dir="ltr" icon={Hash} required inputMode="numeric"
                      placeholder="1234567" label={t('form.crNumber')} value={form.crNumber}
                      onChange={update('crNumber')} error={fieldErrors.crNumber}
                    />
                    <Field
                      id="legalForm" icon={Scale}
                      label={t('form.legalForm')} value={form.legalForm}
                      onChange={update('legalForm')}
                    />
                    <Field
                      id="governorate" as="select" icon={MapPin} required
                      label={t('form.governorate')} value={form.governorate}
                      onChange={update('governorate')} error={fieldErrors.governorate}
                    >
                      <option value="">{t('form.selectGovernorate')}</option>
                      {GOVERNORATES.map((g) => <option key={g} value={g}>{tGov(g)}</option>)}
                    </Field>
                    <Field
                      id="address" icon={MapPin}
                      label={t('form.address')} value={form.address}
                      onChange={update('address')}
                    />
                    <Field
                      id="website" type="url" dir="ltr" icon={Globe} placeholder="https://example.om"
                      label={t('form.website')} value={form.website}
                      onChange={update('website')} error={fieldErrors.website}
                    />
                    <CategoryPicker
                      value={form.serviceCategories}
                      hint={t('form.categoriesHint')}
                      error={fieldErrors.serviceCategories}
                      onChange={(serviceCategories) =>
                        setForm((f) => ({ ...f, serviceCategories }))
                      }
                    />
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-rule p-4 text-sm text-ink sm:col-span-2">
                      <input
                        type="checkbox" checked={form.isSme} onChange={update('isSme')}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-navy-700"
                      />
                      {t('form.isSme')}
                    </label>
                  </div>
                  {AssessmentBlock}
                </>
              )}

              {/* ------------------------------ merchant 3 — bank */}
              {isMerchant && step === 2 && (
                <>
                  <p className="mb-4 text-sm text-ink-muted">{t('form.primaryHint')}</p>
                  <BankAccounts
                    accounts={form.bankAccounts}
                    onChange={(bankAccounts) => setForm((f) => ({ ...f, bankAccounts }))}
                    errors={fieldErrors}
                  />
                  {fieldErrors.bankAccounts && (
                    <p className="mt-3 text-sm font-medium text-red-600">{fieldErrors.bankAccounts}</p>
                  )}
                </>
              )}

              {/*
                Documents get a step of their own on both journeys, and it comes
                after the details that describe what is being attached. They were
                briefly folded into the organisation's first step, where they
                rendered above its own fields — so the form opened by asking for
                paperwork before saying what it was for.
              */}
              {['documents', 'freelanceVerify'].includes(heading) && (
                <DocumentChecklist entityType={entityType} files={docs} onChange={setDocs} />
              )}

              {/* --------------------- self-employment 1 — who and what */}
              {isFreelance && step === 0 && (
                <>
                  <div className={card}>
                    <Field
                      id="fullName" icon={UserRound} required autoComplete="name"
                      label={t('rw.fullName')} value={form.fullName}
                      onChange={update('fullName')} error={fieldErrors.fullName}
                    />
                    <Field
                      id="civilNumber" icon={IdCard} required dir="ltr" inputMode="numeric"
                      placeholder="12345678"
                      label={t('form.civilNumber')} value={form.civilNumber}
                      onChange={update('civilNumber')} error={fieldErrors.civilNumber}
                    />
                    <Field
                      id="email" type="email" dir="ltr" icon={Mail} required autoComplete="email"
                      label={t('auth.email')} value={form.email}
                      onChange={update('email')} error={fieldErrors.email}
                    />
                    <Field
                      id="phone" type="tel" dir="ltr" icon={Phone} required inputMode="numeric"
                      placeholder="91234567" label={t('form.contactPhone')} value={form.phone}
                      onChange={update('phone')} error={fieldErrors.phone}
                    />
                    <PasswordField
                      {...{ form, update, showPw, setShowPw, pwFocused, setPwFocused, pwFailures, fieldErrors, t }}
                    />
                  </div>

                  <div className={card}>
                    <Field
                      id="profession" icon={Briefcase} required
                      label={t('form.profession')} hint={t('form.professionHint')}
                      value={form.profession}
                      onChange={update('profession')} error={fieldErrors.profession}
                    />
                    <Field
                      id="specialisation" icon={Tags}
                      label={t('form.specialisation')} hint={t('form.specialisationHint')}
                      value={form.specialisation}
                      onChange={update('specialisation')} error={fieldErrors.specialisation}
                    />
                    <Field
                      id="governorate" as="select" icon={MapPin} required
                      label={t('form.governorate')} value={form.governorate}
                      onChange={update('governorate')} error={fieldErrors.governorate}
                    >
                      <option value="">{t('form.selectGovernorate')}</option>
                      {GOVERNORATES.map((g) => (
                        <option key={g} value={g}>{tGov(g)}</option>
                      ))}
                    </Field>
                  </div>
                </>
              )}

              {/* ------------------ self-employment 2 — permit and licence */}
              {isFreelance && step === 1 && (
                <>
                  <div className={card}>
                    <Field
                      id="freelancePermitNo" icon={IdCard} required dir="ltr"
                      label={t('form.freelancePermitNo')} hint={t('form.freelancePermitHint')}
                      value={form.freelancePermitNo}
                      onChange={update('freelancePermitNo')} error={fieldErrors.freelancePermitNo}
                    />
                    <Field
                      id="ecommerceLicenceNo" icon={Hash} dir="ltr"
                      label={t('form.ecommerceLicenceNo')} hint={t('form.ecommerceLicenceHint')}
                      value={form.ecommerceLicenceNo}
                      onChange={update('ecommerceLicenceNo')} error={fieldErrors.ecommerceLicenceNo}
                    />
                  </div>

                  <div className={card}>
                    <Field
                      id="storeUrl" type="url" dir="ltr" icon={Globe}
                      placeholder="https://" label={t('form.storeUrl')}
                      value={form.storeUrl}
                      onChange={update('storeUrl')} error={fieldErrors.storeUrl}
                    />
                    <Field
                      id="socialUrl" type="url" dir="ltr" icon={Globe}
                      placeholder="https://" label={t('form.socialUrl')}
                      value={form.socialUrl}
                      onChange={update('socialUrl')} error={fieldErrors.socialUrl}
                    />
                    <Field
                      id="maroofUrl" type="url" dir="ltr" icon={BadgeCheck}
                      placeholder="https://maroof.om/..." label={t('form.maroofUrl')}
                      hint={t('form.maroofHint')}
                      value={form.maroofUrl}
                      onChange={update('maroofUrl')} error={fieldErrors.maroofUrl}
                    />
                  </div>
                </>
              )}

              {/* --------------- self-employment 3 — where the money goes */}
              {isFreelance && step === 2 && (
                <div className={card}>
                  {/*
                    An IBAN, not a bare account number. Fees for freelance work
                    are paid straight to the practitioner, and an IBAN is the
                    only form that routes without a branch code.
                  */}
                  <Field
                    id="bankName" as="select" icon={Landmark} required
                    label={t('form.bankName')} value={form.bankName}
                    onChange={update('bankName')} error={fieldErrors.bankName}
                  >
                    <option value="">{t('form.selectBank')}</option>
                    {BANKS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </Field>
                  <Field
                    id="accountHolder" icon={UserRound} required
                    label={t('form.accountHolder')} hint={t('form.accountHolderHint')}
                    value={form.accountHolder}
                    onChange={update('accountHolder')} error={fieldErrors.accountHolder}
                  />
                  <Field
                    id="iban" icon={CreditCard} required dir="ltr"
                    placeholder="OM81 0180 0000 0000 0000 000"
                    label={t('form.iban')} value={form.iban}
                    onChange={update('iban')} error={fieldErrors.iban}
                  />
                </div>
              )}

              {/* ------------------------------ organisation 1 — details */}
              {isOrganization && step === 0 && (
                <>
                  <div className={card}>
                    <Field
                      id="companyName" icon={Building2} required
                      label={t('rw.orgEnglish')} value={form.companyName}
                      onChange={update('companyName')} error={fieldErrors.companyName}
                    />
                    <Field
                      id="companyNameAr" dir="rtl" icon={Building2} required
                      label={t('rw.orgArabic')} value={form.companyNameAr}
                      onChange={update('companyNameAr')} error={fieldErrors.companyNameAr}
                    />
                    <Field
                      id="description" as="textarea" rows={4} required className="sm:col-span-2"
                      label={t('form.description')} value={form.description}
                      onChange={update('description')} error={fieldErrors.description}
                    />
                    <Field
                      id="governorate" as="select" icon={MapPin} required
                      label={t('form.governorate')} value={form.governorate}
                      onChange={update('governorate')} error={fieldErrors.governorate}
                    >
                      <option value="">{t('form.selectGovernorate')}</option>
                      {GOVERNORATES.map((g) => <option key={g} value={g}>{tGov(g)}</option>)}
                    </Field>
                    <Field
                      id="organizationType" as="select" icon={Landmark} required
                      label={t('form.organizationType')} value={form.organizationType}
                      onChange={update('organizationType')} error={fieldErrors.organizationType}
                    >
                      <option value="">{t('form.selectOrgType')}</option>
                      {ORG_TYPES.map((o) => <option key={o} value={o}>{t(`orgType.${o}`)}</option>)}
                    </Field>
                    <Field
                      id="crNumber" dir="ltr" icon={Hash} required inputMode="numeric"
                      label={t('rw.registrationNumber')} value={form.crNumber}
                      onChange={update('crNumber')} error={fieldErrors.crNumber}
                    />
                    {/* The three dates share a row of their own, so they line
                        up as a set instead of wrapping one to a stray line. */}
                    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
                      <Field
                        id="registrationDate" type="date" dir="ltr"
                        label={t('rw.establishmentDate')} value={form.registrationDate}
                        onChange={update('registrationDate')}
                      />
                      <Field
                        id="registrationExpiry" type="date" dir="ltr" required
                        label={t('form.registrationExpiry')} value={form.registrationExpiry}
                        onChange={update('registrationExpiry')} error={fieldErrors.registrationExpiry}
                      />
                      <Field
                        id="proofExpiry" type="date" dir="ltr"
                        label={t('form.proofExpiry')} value={form.proofExpiry}
                        onChange={update('proofExpiry')}
                      />
                    </div>
                  </div>
                  {AssessmentBlock}
                </>
              )}

              {/* ------------------------------ organisation 2 — representative */}
              {isOrganization && step === 1 && (
                <div className={card}>
                  <Field
                    id="representativeName" icon={UserRound} required autoComplete="name"
                    label={t('rw.fullName')} value={form.representativeName}
                    onChange={update('representativeName')} error={fieldErrors.representativeName}
                  />
                  <Field
                    id="representativeNationalId" dir="ltr" icon={IdCard} required
                    label={t('form.nationalId')} value={form.representativeNationalId}
                    onChange={update('representativeNationalId')}
                    error={fieldErrors.representativeNationalId}
                  />
                  <Field
                    id="representativeEmail" type="email" dir="ltr" icon={Mail} required autoComplete="email"
                    label={t('auth.email')} value={form.representativeEmail}
                    onChange={update('representativeEmail')} error={fieldErrors.representativeEmail}
                  />
                  <Field
                    id="representativePhone" type="tel" dir="ltr" icon={Phone} required
                    inputMode="numeric" placeholder="91234567"
                    label={t('form.contactPhone')} value={form.representativePhone}
                    onChange={update('representativePhone')} error={fieldErrors.representativePhone}
                  />
                  <PasswordField
                    {...{ form, update, showPw, setShowPw, pwFocused, setPwFocused, pwFailures, fieldErrors, t }}
                  />
                </div>
              )}

              {/*
                Read-back of what is about to be sent. The merchant journey
                keeps its own review stage; the organisation no longer has one,
                so it goes straight from its documents to the declaration below.
              */}
              {heading === 'review' && (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(isFreelance
                      ? [
                          { title: t('rw.h.freelanceProfile.title'), rows: [
                            [t('rw.fullName'), form.fullName],
                            [t('form.civilNumber'), form.civilNumber, 'ltr'],
                            [t('auth.email'), form.email, 'ltr'],
                            [t('form.contactPhone'), form.phone, 'ltr']
                          ] },
                          { title: t('rw.h.freelanceLicence.title'), rows: [
                            [t('form.profession'), form.profession],
                            [t('form.freelancePermitNo'), form.freelancePermitNo, 'ltr'],
                            [t('form.ecommerceLicenceNo'), form.ecommerceLicenceNo, 'ltr'],
                            [t('form.maroofUrl'), form.maroofUrl, 'ltr']
                          ] },
                          { title: t('rw.h.freelanceVerify.title'), rows: [
                            [t('form.bankName'), form.bankName],
                            [t('form.accountHolder'), form.accountHolder],
                            [t('form.iban'), form.iban, 'ltr']
                          ] },
                          { title: t('form.verificationStatus'), rows: [
                            [t('form.emailAndPhone'), t('form.pendingVerification')],
                            [t('form.freelancePermitNo'), t('form.underReview')]
                          ] }
                        ]
                      : isMerchant
                      ? [
                          { title: t('rw.h.general.title'), rows: [
                            [t('rw.fullName'), form.fullName],
                            [t('auth.email'), form.email],
                            [t('form.contactPhone'), form.phone]
                          ] },
                          { title: t('rw.h.company.title'), rows: [
                            [t('rw.companyArabic'), form.companyNameAr],
                            [t('form.crNumber'), form.crNumber],
                            [t('form.governorate'), tGov(form.governorate)]
                          ] },
                          { title: t('rw.h.bank.title'), rows: [
                            // The account that gets paid, plus how many others
                            // are on file — the review is a check, not a dump.
                            [t('form.primaryAccount'), primaryAccount.bankName],
                            [t('form.accountHolder'), primaryAccount.accountHolder],
                            [t('form.accountNumber'), primaryAccount.accountNumber, 'ltr'],
                            ...(form.bankAccounts.length > 1
                              ? [[t('form.addAccount'), fmt(form.bankAccounts.length - 1)]]
                              : [])
                          ] },
                          { title: t('form.verificationStatus'), rows: [
                            [t('form.emailAndPhone'), t('form.pendingVerification')],
                            [t('form.crNumber'), t('form.underReview')]
                          ] }
                        ]
                      : [
                          { title: t('rw.h.orgDetails.title'), rows: [
                            [t('rw.orgArabic'), form.companyNameAr],
                            [t('rw.registrationNumber'), form.crNumber],
                            [t('form.organizationType'), form.organizationType && t(`orgType.${form.organizationType}`)]
                          ] },
                          { title: t('rw.h.representative.title'), rows: [
                            [t('rw.fullName'), form.representativeName],
                            [t('form.contactPhone'), form.representativePhone],
                            [t('auth.email'), form.representativeEmail]
                          ] }
                        ]
                    ).map((c) => (
                      <section key={c.title} className="rounded-2xl border border-rule bg-surface p-5">
                        <h3 className="font-display text-sm font-black text-navy-700">{c.title}</h3>
                        <dl className="mt-3 space-y-2.5">
                          {c.rows.map(([k, v, d]) => (
                            <div key={k} className="flex items-baseline justify-between gap-3 text-xs">
                              <dt className="shrink-0 text-ink-muted">{k}</dt>
                              <dd className="text-end font-bold text-ink" dir={d}>{v || '—'}</dd>
                            </div>
                          ))}
                        </dl>
                      </section>
                    ))}

                    <section className="rounded-2xl border border-rule bg-surface p-5 sm:col-span-2">
                      <h3 className="font-display text-sm font-black text-navy-700">
                        {t('form.attachedDocuments')}
                      </h3>
                      {Object.keys(docs).length === 0 ? (
                        <p className="mt-3 text-xs text-ink-soft">{t('form.noDocuments')}</p>
                      ) : (
                        <dl className="mt-3 space-y-2.5">
                          {Object.entries(docs).map(([slot, file]) => (
                            <div key={slot} className="flex items-baseline justify-between gap-3 text-xs">
                              <dt className="shrink-0 text-ink-muted">{slot}</dt>
                              <dd className="truncate text-end font-bold text-ink">{file.name}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </section>
                  </div>
                </>
              )}

              {/*
                The agreement and the declarations sit on whichever stage is
                last, because that is the stage carrying the submit button —
                consent has to be given on the screen that acts on it, not one
                the applicant may never return to.
              */}
              {isLastStep && (
                <>
                  <NdaAgreement signedAt={ndaSignedAt} onSign={setNdaSignedAt} />

                  <div className="mt-5 space-y-3">
                    <AnimatedCheckbox
                      id="agree-terms" checked={agreeTerms} onChange={setAgreeTerms}
                      label={t('form.confirmTerms')} className="rounded-lg border border-rule p-4"
                    />
                    <AnimatedCheckbox
                      id="agree-law" checked={agreeLaw} onChange={setAgreeLaw}
                      label={t('form.confirmLaw')} className="rounded-lg border border-rule p-4"
                    />
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          </div>

          <AnimatePresence>
            {error && (
              <motion.p
                role="alert"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-700"
              >
                {error}
              </motion.p>
            )}
            {notice && (
              <motion.p
                key="notice" role="status"
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mt-4 rounded-lg bg-navy-50 px-4 py-2.5 text-sm text-navy-700"
              >
                {notice}
              </motion.p>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-rule pt-6">
            {step > 0 && (
              <button type="button" onClick={() => go(-1)} className="btn-quiet">
                <Back size={15} /> {t('wiz.back')}
              </button>
            )}
            {step < steps.length - 1 ? (
              <button type="button" onClick={() => go(1)} className="btn-primary ms-auto">
                {t('wiz.next')} <Next size={15} />
              </button>
            ) : (
              <button type="submit" disabled={loading} className="btn-accent ms-auto disabled:opacity-60">
                {loading ? t('form.submitting') : t('rw.submit')}
              </button>
            )}
          </div>
        </form>

        <p className="mt-6 border-t border-rule pt-5 text-center text-sm text-ink-muted">
          {t('auth.alreadyRegistered')}{' '}
          <Link to="/login" className="font-black text-navy-700 hover:underline">
            {t('auth.signIn')}
          </Link>
        </p>
      </div>
    </div>
  );
}

/**
 * The password field and its live rule checklist.
 *
 * Extracted because both journeys collect a password, on different steps —
 * duplicating the checklist markup would mean two places to keep in step with
 * the policy.
 */
function PasswordField({
  form, update, showPw, setShowPw, pwFocused, setPwFocused, pwFailures, fieldErrors, t
}) {
  return (
    <div className="sm:col-span-2">
      <label htmlFor="password" className="label">
        {t('auth.password')}<span className="ms-1 text-accent-600">*</span>
      </label>
      <div className="field-shell">
        <Lock size={17} className="field-glyph" />
        <input
          id="password"
          type={showPw ? 'text' : 'password'}
          dir="ltr"
          autoComplete="new-password"
          value={form.password}
          onChange={update('password')}
          onFocus={() => setPwFocused(true)}
          onBlur={() => setPwFocused(false)}
          aria-invalid={Boolean(fieldErrors.password)}
          aria-describedby="pw-rules"
          className={`field field-icon pr-11 ${fieldErrors.password ? 'border-red-400' : ''}`}
        />
        <button
          type="button"
          onClick={() => setShowPw((v) => !v)}
          aria-label={showPw ? t('auth.hidePassword') : t('auth.showPassword')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-ink-soft transition-colors hover:text-navy-700"
        >
          {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {/* Rules appear while the field is in use and go once satisfied, so the
          form is not permanently cluttered by instructions already met. */}
      <AnimatePresence>
        {(pwFocused || (form.password.length > 0 && pwFailures.length > 0)) && (
          <motion.div
            id="pw-rules"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-2xl border border-rule bg-mist/70 p-3">
              <p className="mb-2 text-[11px] font-bold text-ink-soft">{t('auth.pwRules')}</p>
              <ul className="grid gap-1.5 sm:grid-cols-2">
                {PASSWORD_CHECKS.map((check) => {
                  const met = !pwFailures.includes(check.id);
                  return (
                    <li key={check.id} className="flex items-center gap-2 text-xs">
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                          met ? 'bg-teal-500 text-white' : 'bg-rule text-ink-soft'
                        }`}
                      >
                        {met ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
                      </span>
                      <span className={met ? 'text-teal-700' : 'text-ink-muted'}>
                        {t(`auth.pw.${check.id}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {fieldErrors.password && (
        <p role="alert" className="mt-1.5 text-xs text-red-600">{fieldErrors.password}</p>
      )}
    </div>
  );
}
