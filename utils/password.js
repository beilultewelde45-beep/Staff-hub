import bcrypt from 'bcrypt';
import { env } from '../config/env.js';

export const MIN_PASSWORD_LENGTH = 8;

export function hashPassword(plain, rounds = env.bcryptRounds) {
  if (typeof plain !== 'string' || plain.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  return bcrypt.hash(plain, rounds);
}

export function verifyPassword(plain, hash) {
  if (typeof plain !== 'string' || typeof hash !== 'string') return Promise.resolve(false);
  return bcrypt.compare(plain, hash);
}

// Compared against when the email is unknown, so "no such user" and
// "wrong password" take the same time and can't be told apart.
let dummyHash;
export async function burnPasswordCheck(plain) {
  dummyHash ??= bcrypt.hash('staffhub-timing-dummy', env.bcryptRounds);
  await verifyPassword(String(plain ?? ''), await dummyHash);
  return false;
}
