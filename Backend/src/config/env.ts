import dotenv from 'dotenv';
import path from 'path';

// Load .env and .env.local from Backend root or process working directory
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env.local') });

/**
 * Parses comma-separated origin strings into a cleaned array of origins.
 */
function parseAllowedOrigins(corsEnv?: string, frontendUrl?: string): string[] {
  const defaultOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://redhill-investor-portal-1.onrender.com',
  ];

  const customOrigins: string[] = [];

  if (corsEnv) {
    corsEnv.split(',').forEach(origin => {
      const trimmed = origin.trim();
      if (trimmed && !customOrigins.includes(trimmed)) {
        customOrigins.push(trimmed);
      }
    });
  }

  if (frontendUrl) {
    const trimmed = frontendUrl.trim();
    if (trimmed && !customOrigins.includes(trimmed)) {
      customOrigins.push(trimmed);
    }
  }

  // Combine defaults and custom origins, deduplicating
  return Array.from(new Set([...defaultOrigins, ...customOrigins]));
}

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

export const config = {
  // Server Environment
  NODE_ENV: nodeEnv,
  IS_PROD: isProd,
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5001,
  HOST: process.env.HOST || '0.0.0.0',

  // CORS & Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: parseAllowedOrigins(process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS, process.env.FRONTEND_URL),

  // Authentication
  JWT_SECRET: process.env.JWT_SECRET || (isProd ? '' : 'redhill-infra-secret-key-dev-only'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',

  // Database & Storage Paths (Support Neon PostgreSQL & Render Disks)
  DATABASE_URL: process.env.DATABASE_URL || '',
  DATABASE_PATH: process.env.DATABASE_PATH ? path.resolve(process.env.DATABASE_PATH) : path.resolve('database.sqlite'),
  UPLOADS_DIR: process.env.UPLOADS_DIR ? path.resolve(process.env.UPLOADS_DIR) : path.resolve('uploads'),

  // Email Configuration (Gmail / SMTP / SendGrid)
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    gmailUser: process.env.GMAIL_USER || process.env.SMTP_USER,
    gmailAppPassword: process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS,
    fromEmail: process.env.FROM_EMAIL || process.env.GMAIL_USER || 'noreply@redhillinfra.com',
    smtpHost: process.env.SMTP_HOST,
    smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 465,
    smtpSecure: process.env.SMTP_SECURE !== 'false',
  },

  // SMS OTP Configuration (Twilio / Fast2SMS / MSG91)
  sms: {
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioFromNumber: process.env.TWILIO_FROM_NUMBER,
    fast2smsApiKey: process.env.FAST2SMS_API_KEY,
    msg91AuthKey: process.env.MSG91_AUTH_KEY,
    msg91TemplateId: process.env.MSG91_TEMPLATE_ID,
  },
};

// Security check in production
if (isProd && (!config.JWT_SECRET || config.JWT_SECRET === 'redhill-infra-secret-key-dev-only')) {
  console.warn('⚠️ WARNING: Using fallback or empty JWT_SECRET in production! Please set JWT_SECRET in your environment variables.');
}

export default config;
