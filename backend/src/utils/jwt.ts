import jwt, { Secret, SignOptions } from 'jsonwebtoken';

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

export const generateAccessToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
};

export const getTokenExpirationTime = (expiresIn: string): number => {
  const unit = expiresIn.slice(-1);
  const value = parseInt(expiresIn.slice(0, -1));
  
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  
  return value * (multipliers[unit] || 1000);
};
