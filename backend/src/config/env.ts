import dotenv from 'dotenv';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] || fallback;
  if (!value) {
    if (isProduction) {
      throw new Error(`FATAL: Variável de ambiente ${key} é obrigatória em produção.`);
    }
    console.warn(`WARNING: ${key} não definida. Usando valor padrão de desenvolvimento.`);
    return '';
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  IS_PRODUCTION: isProduction,

  MONGODB_URI: requireEnv('MONGODB_URI'),

  JWT_SECRET: requireEnv('JWT_SECRET', isProduction ? undefined : 'dev-only-insecure-secret-key-change-me'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET', isProduction ? undefined : 'dev-only-insecure-refresh-key-change-me'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  CORS_ORIGINS: process.env.CORS_ORIGINS?.split(',').map(s => s.trim()) || [],

  NETLIFY_BLOBS_SITE_ID: process.env.NETLIFY_BLOBS_SITE_ID || process.env.NETLIFY_SITE_ID || '',
  NETLIFY_BLOBS_TOKEN: process.env.NETLIFY_BLOBS_TOKEN || process.env.NETLIFY_API_TOKEN || '',
} as const;
