import 'dotenv/config';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberFromEnv(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65_535) {
    throw new Error(`${name} must be a valid port number.`);
  }

  return parsed;
}

function optionalUrl(name: string, fallback?: string): string | undefined {
  const value = process.env[name]?.trim() || fallback;
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    throw new Error(`${name} must be an absolute URL.`);
  }
}

function localWebhookUrl(): string | undefined {
  if (process.env.SEND_META_WEBHOOKS_TO_LOCAL !== 'true') return undefined;

  const value = process.env.LOCAL_URL?.trim();
  if (!value) throw new Error('LOCAL_URL is required when SEND_META_WEBHOOKS_TO_LOCAL=true.');

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('LOCAL_URL must be a valid HTTPS URL.');
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('LOCAL_URL must be an HTTPS URL without credentials.');
  }

  const productionOrigin = process.env.PUBLIC_BASE_URL?.trim();
  if (productionOrigin && url.origin === new URL(productionOrigin).origin) {
    throw new Error('LOCAL_URL must not point to the production API.');
  }

  return `${url.origin}/webhooks/instagram`;
}

export const config = Object.freeze({
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  host: process.env.HOST ?? '0.0.0.0',
  port: numberFromEnv('PORT', 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  logLevel: process.env.LOG_LEVEL ?? 'info',
  clientOrigins: (process.env.CLIENT_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  frontendOrigin: optionalUrl('FRONTEND_ORIGIN', 'http://localhost:8081'),
  publicBaseUrl: optionalUrl('PUBLIC_BASE_URL'),
  instagramAppId: process.env.INSTAGRAM_APP_ID?.trim(),
  instagramAppSecret: process.env.INSTAGRAM_APP_SECRET?.trim(),
  metaAppSecret: process.env.META_APP_SECRET?.trim() || process.env.FACEBOOK_APP_SECRET?.trim(),
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN?.trim(),
  encryptionKey: process.env.ENCRYPTION_KEY?.trim(),
  localWebhookUrl: localWebhookUrl(),
});
