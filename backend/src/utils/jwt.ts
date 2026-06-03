import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const isProduction = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  if (isProduction) {
    throw new Error('FATAL: JWT_SECRET e JWT_REFRESH_SECRET devem estar definidos em produção.');
  }
  console.warn('WARNING: JWT_SECRET ou JWT_REFRESH_SECRET não definidos. Usando valores inseguros apenas para desenvolvimento.');
}

const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-only-insecure-secret-key-change-me';
const JWT_REFRESH_SECRET: Secret = process.env.JWT_REFRESH_SECRET || 'dev-only-insecure-refresh-key-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload extends TokenPayload {
  // Identificador único do token, usado para revogação/rotação.
  jti: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload, jti: string): string => {
  const options: SignOptions = {
    expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    jwtid: jti,
  };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const generateTokenId = (): string => crypto.randomUUID();

const DURATION_MULTIPLIERS_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};

/**
 * Converte uma duração no formato aceito pelo jsonwebtoken (ex.: "1h", "7d", "900",
 * "30 days") em milissegundos. Suporta unidades de múltiplas letras e número puro
 * (interpretado como segundos, igual ao comportamento padrão do jsonwebtoken).
 * Retorna null quando não consegue interpretar o valor.
 */
export const parseDurationToMs = (expiresIn: string | number): number | null => {
  if (typeof expiresIn === 'number') {
    return Number.isFinite(expiresIn) ? expiresIn * 1000 : null;
  }

  const trimmed = expiresIn.trim();

  // Número puro => segundos.
  if (/^\d+(\.\d+)?$/.test(trimmed)) {
    return parseFloat(trimmed) * 1000;
  }

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/i);
  if (!match) {
    return null;
  }

  const value = parseFloat(match[1]);
  const rawUnit = match[2].toLowerCase();

  const unitAliases: Record<string, string> = {
    ms: 'ms',
    msec: 'ms',
    msecs: 'ms',
    millisecond: 'ms',
    milliseconds: 'ms',
    s: 's',
    sec: 's',
    secs: 's',
    second: 's',
    seconds: 's',
    m: 'm',
    min: 'm',
    mins: 'm',
    minute: 'm',
    minutes: 'm',
    h: 'h',
    hr: 'h',
    hrs: 'h',
    hour: 'h',
    hours: 'h',
    d: 'd',
    day: 'd',
    days: 'd',
    w: 'w',
    week: 'w',
    weeks: 'w',
    y: 'y',
    yr: 'y',
    yrs: 'y',
    year: 'y',
    years: 'y',
  };

  const unit = unitAliases[rawUnit];
  if (!unit) {
    return null;
  }

  return value * DURATION_MULTIPLIERS_MS[unit];
};

/** Duração do access token em segundos, derivada de JWT_EXPIRES_IN. */
export const getAccessTokenExpiresInSeconds = (): number => {
  const ms = parseDurationToMs(JWT_EXPIRES_IN);
  // Fallback de 1h caso a env esteja num formato inesperado.
  return Math.floor((ms ?? 60 * 60 * 1000) / 1000);
};

/** Data de expiração absoluta do refresh token, derivada de JWT_REFRESH_EXPIRES_IN. */
export const getRefreshTokenExpiresAt = (): Date => {
  const ms = parseDurationToMs(JWT_REFRESH_EXPIRES_IN) ?? 7 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms);
};
