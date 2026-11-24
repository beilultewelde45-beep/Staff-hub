import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const isProd = process.env.NODE_ENV === 'production';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd,
  isTest: process.env.NODE_ENV === 'test',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGODB_URI || '',
  sessionSecret: process.env.SESSION_SECRET || '',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
};

/** Fail fast with a readable message instead of a cryptic driver error. */
export function assertRuntimeEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push('MONGODB_URI');
  if (!env.sessionSecret) missing.push('SESSION_SECRET');
  if (missing.length) {
    throw new Error(`Missing environment variable(s): ${missing.join(', ')}. Copy .env.example to .env and fill them in.`);
  }
  if (isProd && env.sessionSecret === 'change-me') {
    throw new Error('SESSION_SECRET must be changed in production.');
  }
}
