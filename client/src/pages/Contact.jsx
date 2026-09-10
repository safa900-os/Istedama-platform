import { useState } from 'react';
import { Mail, Phone, Clock, MapPin, CheckCircle2, Send } from 'lucide-react';
import SectionHead from '../components/SectionHead';
import { useLanguage } from '../context/LanguageContext';

const INITIAL = { name: '', email: '', phone: '', subject: 'registration', message: '' };

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState(INITIAL);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setSending(true);
    // No mail transport is wired up yet; this simulates dispatch so the
    // success state is reachable without pretending a message was delivered.
    setTimeout(() => {
      setSending(false);
      setSent(true);
    }, 600);
  };

  const channels = [
    { icon: Mail, label: t('contact.emailLabel'), value: 'info@istidamah.om', ltr: true },
    { icon: Phone, label: t('contact.phoneLabel'), value: '+968 2200 0000', ltr: true },
    { icon: Clock, label: t('contact.hoursLabel'), value: t('contact.hoursValue') },
    { icon: MapPin, label: t('contact.addressLabel'), value: t('contact.addressValue') }
  ];

  const subjects = [
    ['registration', t('contact.subjectRegistration')],
    ['assessment', t('contact.subjectAssessment')],
    ['certificate', t('contact.subjectCertificate')],
    ['partners', t('contact.subjectPartners')],
    ['other', t('contact.subjectOther')]
  ];

  return (
    <div>
      <section className="border-b border-rule bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-14">
          <p className="eyebrow">{t('top.contact')}</p>
          <h1 className="mt-3 font-display text-[2.25rem] font-black tracking-tight text-navy-900 sm:text-[2.75rem]">
            {t('contact.title')}
          </h1>
          <div className="mt-4 h-[3px] w-14 rounded bg-gold-500" />
          <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-ink-muted">{t('contact.lead')}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr,1.4fr]">
          {/* Direct channels */}
          <div>
            <SectionHead eyebrow={t('footer.getInTouch')} title={t('contact.channelsTitle')} />
            <ul className="mt-8 space-y-3">
              {channels.map((c) => (
                <li key={c.label} className="card flex items-start gap-4 p-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-navy-50 text-navy-700">
                    <c.icon size={18} strokeWidth={2} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-ink-soft">{c.label}</p>
                    <p className="mt-1 break-words text-sm font-medium text-ink" dir={c.ltr ? 'ltr' : undefined}>
                      {c.value}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Enquiry form */}
          <div className="card-pad">
            {sent ? (
              <div className="py-10 text-center">
                <CheckCircle2 size={44} className="mx-auto text-teal-600" strokeWidth={1.8} />
                <h2 className="mt-4 font-display text-xl font-bold text-navy-900">{t('contact.successTitle')}</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{t('contact.successBody')}</p>
                <button
                  type="button"
                  onClick={() => { setForm(INITIAL); setSent(false); }}
                  className="btn-quiet mt-6"
                >
                  {t('contact.another')}
                </button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-xl font-bold text-navy-900">{t('contact.formTitle')}</h2>
                <div className="mt-3 h-[3px] w-10 rounded bg-navy-700" />

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="c-name" className="label">{t('contact.name')}</label>
                      <input id="c-name" required value={form.name} onChange={update('name')} className="field" />
                    </div>
                    <div>
                      <label htmlFor="c-email" className="label">{t('contact.email')}</label>
                      <input id="c-email" type="email" required dir="ltr" value={form.email} onChange={update('email')} className="field" />
                    </div>
                    <div>
                      <label htmlFor="c-phone" className="label">{t('contact.phone')}</label>
                      <input id="c-phone" type="tel" dir="ltr" value={form.phone} onChange={update('phone')} className="field" />
                    </div>
                    <div>
                      <label htmlFor="c-subject" className="label">{t('contact.subject')}</label>
                      <select id="c-subject" value={form.subject} onChange={update('subject')} className="field">
                        {subjects.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="c-message" className="label">{t('contact.message')}</label>
                    <textarea
                      id="c-message"
                      required
                      rows={5}
                      value={form.message}
                      onChange={update('message')}
                      className="field resize-y"
                    />
                    <p className="mt-1.5 text-xs text-ink-soft">{t('contact.messageHint')}</p>
                  </div>

                  <button type="submit" disabled={sending} className="btn-primary w-full py-3">
                    <Send size={15} strokeWidth={2} /> {sending ? t('contact.sending') : t('contact.send')}
                  </button>

                  <p className="border-t border-rule pt-4 text-xs leading-relaxed text-ink-soft">
                    {t('contact.demoNote')}
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
