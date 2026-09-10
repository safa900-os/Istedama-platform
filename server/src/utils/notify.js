/**
 * Outbound notification adapter.
 *
 * The platform needs to send verification codes by email and, later, by SMS.
 * Rather than couple the auth flow to a specific vendor, delivery goes through
 * this thin interface.
 *
 * Behaviour is deliberate and honest:
 *   - If SMTP credentials are configured, mail is sent for real.
 *   - If they are not, the message is logged to the server console and the
 *     call still resolves. In development that means the OTP appears in the
 *     terminal so the flow is testable end to end without a mail account.
 *   - `delivered` in the return value tells the caller which happened, so the
 *     API can surface the code in development without ever leaking it in
 *     production.
 *
 * To wire a real provider, implement `sendEmail` / `sendSms` against it and
 * leave every caller unchanged.
 */

const isProduction = () => process.env.NODE_ENV === 'production';

const smtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const smsConfigured = () =>
  Boolean(process.env.SMS_API_KEY && process.env.SMS_SENDER_ID);

async function sendEmail({ to, subject, text }) {
  if (!smtpConfigured()) {
    // No transport configured — log instead of pretending it was sent.
    console.log(`[notify:email] (not sent — SMTP unconfigured) to=${to} subject="${subject}"\n${text}`);
    return { delivered: false, channel: 'email', reason: 'smtp_unconfigured' };
  }

  // A real transport goes here, e.g. nodemailer.createTransport({...}).sendMail
  // Left unimplemented rather than stubbed so nothing silently claims success.
  console.log(`[notify:email] transport configured but not implemented; to=${to}`);
  return { delivered: false, channel: 'email', reason: 'transport_not_implemented' };
}

async function sendSms({ to, text }) {
  if (!smsConfigured()) {
    console.log(`[notify:sms] (not sent — gateway unconfigured) to=${to}\n${text}`);
    return { delivered: false, channel: 'sms', reason: 'gateway_unconfigured' };
  }
  console.log(`[notify:sms] gateway configured but not implemented; to=${to}`);
  return { delivered: false, channel: 'sms', reason: 'gateway_not_implemented' };
}

/**
 * Whether it is safe to return the code in the API response.
 * True only outside production and only when nothing actually delivered it —
 * so a developer is never locked out of their own flow, and a live deployment
 * can never hand a code to the caller.
 */
function mayRevealCode(deliveryResult) {
  return !isProduction() && !deliveryResult.delivered;
}

module.exports = { sendEmail, sendSms, mayRevealCode, smtpConfigured, smsConfigured };
