import config from '../config/env.js';

/**
 * Normalizes a phone number string to E.164 (defaulting 10-digit Indian numbers to +91).
 */
function normalizeE164(phone: string): string {
  const trimmed = phone.trim();
  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/\D/g, '')}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return `+${digits}`;
}

export function isSmsConfigured(): boolean {
  const { twilioAccountSid, twilioAuthToken, twilioFromNumber, fast2smsApiKey, msg91AuthKey, msg91TemplateId } = config.sms;
  return Boolean(
    (twilioAccountSid && twilioAuthToken && twilioFromNumber) ||
    fast2smsApiKey ||
    (msg91AuthKey && msg91TemplateId)
  );
}

/**
 * Sends a 6-digit verification OTP to a mobile number via whichever SMS provider
 * is configured in environment variables (Twilio, Fast2SMS, or MSG91).
 */
export async function sendSmsOtp(phone: string, otp: string): Promise<boolean> {
  const { twilioAccountSid, twilioAuthToken, twilioFromNumber, fast2smsApiKey, msg91AuthKey, msg91TemplateId } = config.sms;
  const e164 = normalizeE164(phone);
  const digits10 = e164.replace(/\D/g, '').slice(-10);

  // 1. Twilio Programmable SMS
  if (twilioAccountSid && twilioAuthToken && twilioFromNumber) {
    try {
      const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
      const body = new URLSearchParams({
        To: e164,
        From: twilioFromNumber,
        Body: `Redhill Infra: Your password reset verification code is ${otp}. Valid for 10 minutes.`,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });
      if (res.ok) return true;
      console.error('[SMS - Twilio] Failed:', res.status, await res.text());
    } catch (err) {
      console.error('[SMS - Twilio] Error:', err);
    }
  }

  // 2. Fast2SMS (India OTP route)
  if (fast2smsApiKey && digits10.length === 10) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otp,
          numbers: digits10,
        }),
      });
      if (res.ok) return true;
      console.error('[SMS - Fast2SMS] Failed:', res.status, await res.text());
    } catch (err) {
      console.error('[SMS - Fast2SMS] Error:', err);
    }
  }

  // 3. MSG91 OTP API (India)
  if (msg91AuthKey && msg91TemplateId) {
    try {
      const mobile = e164.replace(/^\+/, '');
      const res = await fetch(
        `https://control.msg91.com/api/v5/otp?template_id=${encodeURIComponent(msg91TemplateId)}&mobile=${encodeURIComponent(mobile)}&otp=${encodeURIComponent(otp)}`,
        {
          method: 'POST',
          headers: { authkey: msg91AuthKey },
        }
      );
      if (res.ok) return true;
      console.error('[SMS - MSG91] Failed:', res.status, await res.text());
    } catch (err) {
      console.error('[SMS - MSG91] Error:', err);
    }
  }

  return false;
}
