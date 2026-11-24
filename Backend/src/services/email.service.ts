import dns from 'dns';

// Force Node.js DNS to prefer IPv4 and disable IPv6 AAAA queries.
// Render cloud containers do not support outbound IPv6 routing, which causes ENETUNREACH errors.
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
const origResolve6 = dns.resolve6;
if (origResolve6) {
  (dns as any).resolve6 = function (hostname: string, ...args: any[]) {
    const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : null;
    if (cb) {
      const err: any = new Error(`queryAaaa ENODATA ${hostname}`);
      err.code = 'ENODATA';
      return cb(err, []);
    }
    return origResolve6.apply(dns, [hostname, ...args]);
  };
}
if (dns.promises && (dns.promises as any).resolve6) {
  (dns.promises as any).resolve6 = async () => [];
}

import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import config from '../config/env.js';

const { sendgridApiKey, gmailUser, gmailAppPassword, fromEmail, smtpHost, smtpPort, smtpSecure } = config.email;
const PORTAL_URL = config.FRONTEND_URL;

if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
}

// Clean app password (stripping any spaces if user pasted 'abcd efgh ijkl mnop')
const cleanedAppPassword = gmailAppPassword ? String(gmailAppPassword).replace(/\s+/g, '') : '';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function getEmailCredentials() {
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || config.email.gmailUser || '').trim().replace(/["']/g, '');
  const pass = (process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || config.email.gmailAppPassword || '').trim().replace(/\s+/g, '').replace(/["']/g, '');
  const from = (process.env.FROM_EMAIL || config.email.fromEmail || user || 'noreply@redhillinfra.com').trim().replace(/["']/g, '');
  const senderAddress = from.includes('@') ? from : (user || 'noreply@redhillinfra.com');
  const senderDisplayName = !from.includes('@') ? from.replace(/_/g, ' ') : 'Redhill Infra';

  return { user, pass, senderAddress, senderDisplayName };
}

export const sendEmailDetailed = async (options: EmailOptions): Promise<SendEmailResult> => {
  const recipients = Array.isArray(options.to) ? options.to : [options.to];
  const realRecipients = recipients.filter(r => !r.endsWith('@example.com') && !r.endsWith('@test.com'));
  if (realRecipients.length === 0) {
    return { success: true, messageId: 'mock-recipients-only' };
  }

  const webhookUrl = (process.env.EMAIL_WEBHOOK_URL || config.email.webhookUrl || '').trim();
  const webhookSecret = (process.env.EMAIL_WEBHOOK_SECRET || config.email.webhookSecret || '').trim();
  const brevoApiKey = (process.env.BREVO_API_KEY || config.email.brevoApiKey || '').trim();
  const resendApiKey = (process.env.RESEND_API_KEY || config.email.resendApiKey || '').trim();
  const sendgridKey = (process.env.SENDGRID_API_KEY || config.email.sendgridApiKey || '').trim();
  const { user, pass, senderAddress, senderDisplayName } = getEmailCredentials();
  const fromFormatted = `"${senderDisplayName}" <${senderAddress}>`;
  const textContent = options.text || options.html.replace(/<[^>]*>?/gm, '');
  const providerErrors: string[] = [];

  // 1. Google Apps Script / HTTPS Email Webhook (Port 443 — Free Gmail delivery, NEVER BLOCKED on Render)
  if (webhookUrl) {
    try {
      console.log(`[EMAIL DISPATCH - WEBHOOK HTTPS]: Sending to ${realRecipients.join(', ')}...`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: realRecipients.join(','),
          subject: options.subject,
          html: options.html,
          text: textContent,
          fromName: senderDisplayName,
          secret: webhookSecret || undefined,
        }),
        redirect: 'follow',
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const rawBody = await response.text();
      let parsed: any = null;
      try {
        parsed = JSON.parse(rawBody);
      } catch {
        // Non-JSON response is acceptable when HTTP status is OK and not an HTML error page
      }

      if (!response.ok || parsed?.error || parsed?.success === false) {
        throw new Error(parsed?.error || `HTTP ${response.status}: ${rawBody.slice(0, 150)}`);
      }
      if (!parsed && rawBody.trim().startsWith('<')) {
        throw new Error('Webhook returned HTML instead of JSON. Ensure Apps Script is deployed with access "Anyone".');
      }

      console.log(`[EMAIL DISPATCH - WEBHOOK SUCCESS] Sent to: ${realRecipients.join(', ')}`);
      return { success: true, messageId: parsed?.messageId || `webhook-${Date.now()}` };
    } catch (webhookErr: any) {
      const msg = webhookErr?.message || 'Webhook delivery failed';
      console.warn(`[WEBHOOK FAILED]: ${msg}. Trying next provider...`);
      providerErrors.push(`Email Webhook: ${msg}`);
    }
  }

  // 2. Brevo HTTP REST API (Port 443 — Free 300/day, sends to ANY recipient with verified Gmail)
  if (brevoApiKey) {
    try {
      console.log(`[EMAIL DISPATCH - BREVO HTTP API]: Sending to ${realRecipients.join(', ')}...`);
      const brevoSenderEmail = (senderAddress.includes('redhillinfra.com') && user) ? user : senderAddress;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: senderDisplayName, email: brevoSenderEmail },
          to: realRecipients.map(email => ({ email })),
          subject: options.subject,
          htmlContent: options.html,
          textContent,
        }),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const data: any = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.message || data?.code || `HTTP ${response.status}`);
      }

      console.log(`[EMAIL DISPATCH - BREVO SUCCESS] ID: ${data?.messageId}`);
      return { success: true, messageId: data?.messageId || `brevo-${response.status}` };
    } catch (brevoErr: any) {
      const msg = brevoErr?.message || 'Brevo delivery failed';
      console.warn(`[BREVO FAILED]: ${msg}. Trying next provider...`);
      providerErrors.push(`Brevo API: ${msg}`);
    }
  }

  // 3. Resend HTTP REST API (Port 443 — NEVER BLOCKED by Render Free Tier firewall)
  if (resendApiKey) {
    try {
      console.log(`[EMAIL DISPATCH - RESEND HTTP API]: Sending to ${realRecipients.join(', ')}...`);
      const resend = new Resend(resendApiKey);
      const explicitResendFrom = (process.env.RESEND_FROM_EMAIL || config.email.resendFromEmail || '').trim();
      const hasVerifiedDomain = Boolean(process.env.RESEND_VERIFIED_DOMAIN || explicitResendFrom);
      const resendFrom = explicitResendFrom
        ? (explicitResendFrom.includes('<') ? explicitResendFrom : `"${senderDisplayName}" <${explicitResendFrom}>`)
        : (hasVerifiedDomain ? fromFormatted : `${senderDisplayName} <onboarding@resend.dev>`);

      const data = await resend.emails.send({
        from: resendFrom,
        to: realRecipients,
        subject: options.subject,
        text: textContent,
        html: options.html,
        ...(senderAddress && !senderAddress.includes('redhillinfra.com') ? { replyTo: senderAddress } : {}),
      });

      if (data.error) {
        throw new Error(data.error.message);
      }

      console.log(`[EMAIL DISPATCH - RESEND SUCCESS] ID: ${data.data?.id}`);
      return { success: true, messageId: data.data?.id };
    } catch (resendErr: any) {
      const msg = resendErr?.message || 'Resend delivery failed';
      console.warn(`[RESEND FAILED]: ${msg}. Trying fallback provider...`);
      providerErrors.push(`Resend API: ${msg}`);
    }
  }

  // 4. SendGrid HTTP REST API (Port 443 — NEVER BLOCKED by Render Free Tier firewall)
  if (sendgridKey) {
    try {
      console.log(`[EMAIL DISPATCH - SENDGRID HTTP API]: Sending to ${realRecipients.join(', ')}...`);
      sgMail.setApiKey(sendgridKey);
      const [response] = await sgMail.send({
        to: realRecipients,
        from: senderAddress,
        subject: options.subject,
        text: textContent,
        html: options.html,
      });
      console.log(`[EMAIL DISPATCH - SENDGRID SUCCESS] Status: ${response.statusCode}`);
      return { success: true, messageId: `sg-${response.statusCode}` };
    } catch (sgErr: any) {
      const msg = sgErr?.response?.body?.errors?.[0]?.message || sgErr?.message || 'SendGrid delivery failed';
      console.warn(`[SENDGRID FAILED]: ${msg}. Trying SMTP...`);
      providerErrors.push(`SendGrid API: ${msg}`);
    }
  }

  // 5. Gmail / Custom SMTP (Supported on localhost and Render Paid plans)
  if (!user || !pass) {
    const errorMsg = providerErrors.length > 0
      ? providerErrors.join(' | ')
      : 'No HTTPS email provider configured. On Render Free Tier, set EMAIL_WEBHOOK_URL, BREVO_API_KEY, or RESEND_API_KEY in Render Environment Variables.';
    console.error(`[EMAIL DISPATCH ERROR]: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }

  // Attempt 1: Port 465 (Direct SSL, IPv4 forced)
  try {
    const transporter465 = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      family: 4,
      auth: { user, pass },
      tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' },
      connectionTimeout: 6000,
      greetingTimeout: 6000,
      socketTimeout: 8000,
    } as any);

    const info = await transporter465.sendMail({
      from: fromFormatted,
      to: realRecipients,
      subject: options.subject,
      text: textContent,
      html: options.html,
    });

    console.log(`[EMAIL DISPATCH - GMAIL SMTP PORT 465 SUCCESS] ID: ${info?.messageId} Sent to: ${realRecipients.join(', ')}`);
    return { success: true, messageId: info?.messageId };
  } catch (err465: any) {
    console.warn(`[GMAIL SMTP PORT 465 FAILED]: ${err465?.message}. Trying fallback Port 587 STARTTLS...`);

    // Attempt 2: Port 587 (STARTTLS, IPv4 forced)
    try {
      const transporter587 = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        family: 4,
        auth: { user, pass },
        tls: { rejectUnauthorized: false, servername: 'smtp.gmail.com' },
        connectionTimeout: 6000,
        greetingTimeout: 6000,
        socketTimeout: 8000,
      } as any);

      const info = await transporter587.sendMail({
        from: fromFormatted,
        to: realRecipients,
        subject: options.subject,
        text: textContent,
        html: options.html,
      });

      console.log(`[EMAIL DISPATCH - GMAIL SMTP PORT 587 SUCCESS] ID: ${info?.messageId} Sent to: ${realRecipients.join(', ')}`);
      return { success: true, messageId: info?.messageId };
    } catch (err587: any) {
      const err465Msg = String(err465?.message || '');
      const err587Msg = String(err587?.message || '');
      const isSmtpBlocked = err465Msg.includes('timeout') || err587Msg.includes('timeout') || err465Msg.includes('ENETUNREACH') || err587Msg.includes('ENETUNREACH');
      const smtpError = `SMTP Port 465: (${err465Msg}) | Port 587: (${err587Msg})`;
      const finalError = providerErrors.length > 0
        ? `${providerErrors.join(' | ')} | ${smtpError}`
        : `${smtpError}${isSmtpBlocked ? ' — Render Free Tier blocks outbound SMTP ports 465/587. Add EMAIL_WEBHOOK_URL (Gmail Apps Script), BREVO_API_KEY, or RESEND_API_KEY in Render Environment Variables.' : ''}`;
      console.error(`[EMAIL DISPATCH - ALL ATTEMPTS FAILED]: ${finalError}`);
      return { success: false, error: finalError };
    }
  }
};

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  const result = await sendEmailDetailed(options);
  return result.success;
};

export interface MilestoneEmailParams {
  investorName: string;
  projectName: string;
  projectLocation: string;
  projectImageUrl?: string;
  projectId: number;
  milestoneName: string;
  milestoneCategory: string;
  completionDate?: string;
  dayNumber?: number;
  targetDays?: number;
  notes?: string;
}

export const generateMilestoneCompletedHtml = (params: MilestoneEmailParams): string => {
  const {
    investorName,
    projectName,
    projectLocation,
    projectImageUrl,
    projectId,
    milestoneName,
    milestoneCategory,
    completionDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    dayNumber,
    targetDays,
    notes,
  } = params;

  const categoryFormatted = milestoneCategory.charAt(0).toUpperCase() + milestoneCategory.slice(1);
  const portalLink = `${PORTAL_URL}/project/${projectId}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Milestone Completed - ${milestoneName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0f12; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0f12; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #171a21; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 36px; background: linear-gradient(135deg, #1e222b 0%, #12141a 100%); border-bottom: 2px solid #D32F2F;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      REDHILL <span style="color: #D32F2F;">INFRA</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;">
                      Investor Portal Notification
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 14px; background-color: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 20px; font-size: 12px; font-weight: 700; color: #4ade80;">
                      ✓ Milestone Completed
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${projectImageUrl ? `
          <!-- Project Banner Image -->
          <tr>
            <td style="padding: 0; max-height: 180px; overflow: hidden;">
              <img src="${projectImageUrl}" alt="${projectName}" width="600" style="width: 100%; height: 180px; object-fit: cover; display: block;" />
            </td>
          </tr>
          ` : ''}

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 24px 36px;">
              <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 700; color: #ffffff; font-family: Georgia, serif;">
                Milestone Completed: ${milestoneName}
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #94a3b8;">
                Great news regarding your investment in <strong style="color: #f1f5f9;">${projectName}</strong> (${projectLocation}).
              </p>

              <div style="background-color: #1e232d; border-radius: 12px; padding: 20px 24px; border: 1px solid rgba(255, 255, 255, 0.05); margin-bottom: 24px;">
                <p style="margin: 0 0 16px 0; font-size: 15px; color: #e2e8f0;">
                  Dear <strong>${investorName}</strong>,
                </p>
                <p style="margin: 0 0 16px 0; font-size: 14px; color: #cbd5e1; line-height: 1.7;">
                  We are pleased to inform you that our project engineering and site development team has officially completed the <strong>${milestoneName}</strong> phase.
                </p>

                <!-- Milestone Highlights Card -->
                <table width="100%" border="0" cellspacing="0" cellpadding="8" style="background-color: #12141a; border-radius: 8px; margin-top: 12px; border: 1px solid rgba(255, 255, 255, 0.06);">
                  <tr>
                    <td width="35%" style="font-size: 13px; color: #94a3b8; font-weight: 600;">Project</td>
                    <td style="font-size: 14px; color: #ffffff; font-weight: 700;">${projectName}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Milestone</td>
                    <td style="font-size: 14px; color: #f87171; font-weight: 700;">${milestoneName}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Category</td>
                    <td style="font-size: 13px; color: #e2e8f0;">${categoryFormatted}</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Progress Status</td>
                    <td style="font-size: 13px; color: #4ade80; font-weight: 700;">100% Completed</td>
                  </tr>
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Completion Date</td>
                    <td style="font-size: 13px; color: #e2e8f0;">${completionDate}</td>
                  </tr>
                  ${dayNumber ? `
                  <tr>
                    <td style="font-size: 13px; color: #94a3b8; font-weight: 600;">Construction Cycle</td>
                    <td style="font-size: 13px; color: #e2e8f0;">Day ${dayNumber}${targetDays ? ` of ${targetDays} days` : ''}</td>
                  </tr>
                  ` : ''}
                </table>

                ${notes ? `
                <div style="margin-top: 16px; padding: 14px; background-color: rgba(211, 47, 47, 0.08); border-left: 3px solid #D32F2F; border-radius: 4px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; color: #f87171; letter-spacing: 1px; margin-bottom: 4px;">Site Manager Work Log:</div>
                  <div style="font-size: 13px; color: #e2e8f0; font-style: italic;">"${notes}"</div>
                </div>
                ` : ''}
              </div>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0 12px 0;">
                <tr>
                  <td align="center">
                    <a href="${portalLink}" target="_blank" style="display: inline-block; padding: 14px 36px; background-color: #D32F2F; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 10px; box-shadow: 0 4px 15px rgba(211, 47, 47, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                      View Live Project Progress →
                    </a>
                  </td>
                </tr>
              </table>
              <p style="text-align: center; font-size: 12px; color: #64748b; margin-top: 8px;">
                You can view live site photos, CCTV stream, and updated timelines on your portal.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #101217; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">
                You received this automated notification because you are a registered investor in <strong>${projectName}</strong>.
              </p>
              <p style="margin: 0; font-size: 11px; color: #475569;">
                © ${new Date().getFullYear()} Redhill Infrastructure. All rights reserved. • Confidential Investor Communication
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

export interface PasswordResetEmailParams {
  userName: string;
  otp: string;
  expiryMinutes?: number;
}

export const generatePasswordResetOtpHtml = (params: PasswordResetEmailParams): string => {
  const { userName, otp, expiryMinutes = 10 } = params;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset OTP - Redhill Infra</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0d0f12; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; line-height: 1.6;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0d0f12; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table width="560" border="0" cellspacing="0" cellpadding="0" style="background-color: #171a21; border-radius: 16px; overflow: hidden; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 28px 36px; background: linear-gradient(135deg, #1e222b 0%, #12141a 100%); border-bottom: 2px solid #D32F2F;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff;">
                      REDHILL <span style="color: #D32F2F;">INFRA</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px;">
                      Investor Portal Security
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; padding: 6px 14px; background-color: rgba(211, 47, 47, 0.15); border: 1px solid rgba(211, 47, 47, 0.3); border-radius: 20px; font-size: 12px; font-weight: 700; color: #f87171;">
                      🔒 Password Reset
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                Password Reset Verification Code
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #94a3b8;">
                Hello <strong>${userName}</strong>, we received a request to reset the password for your Redhill Investor Portal account.
              </p>

              <!-- OTP Code Display Card -->
              <div style="background-color: #101217; border-radius: 12px; padding: 24px; border: 1px solid rgba(211, 47, 47, 0.3); text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #94a3b8; letter-spacing: 1.5px; margin-bottom: 10px;">
                  Your One-Time Password (OTP)
                </div>
                <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #ffffff; background: linear-gradient(135deg, #ffffff 0%, #fca5a5 100%); -webkit-background-clip: text; font-family: 'Courier New', Courier, monospace; padding: 8px 0;">
                  ${otp}
                </div>
                <div style="font-size: 12px; color: #f87171; margin-top: 8px; font-weight: 600;">
                  ⏱ Valid for ${expiryMinutes} minutes
                </div>
              </div>

              <div style="background-color: #1e232d; border-radius: 8px; padding: 16px 20px; border-left: 3px solid #eab308; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 13px; color: #cbd5e1; line-height: 1.5;">
                  <strong>Important:</strong> Never share this verification code with anyone. Redhill Infrastructure support staff will never ask for your password or OTP.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                If you did not make this request, you can safely ignore this email. Your current password will remain active and unchanged.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 36px; background-color: #101217; border-top: 1px solid rgba(255, 255, 255, 0.05); text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">
                © ${new Date().getFullYear()} Redhill Infrastructure. All rights reserved. • Automated Security Alert
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
};

