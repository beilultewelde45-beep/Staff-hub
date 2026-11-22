// Demo accounts, one per role (docs/08-testing-and-demo.md §2). Safe to run repeatedly:
// existing users are updated in place (roles, name, password, re-activated), never duplicated.
import { pathToFileURL } from 'node:url';
import mongoose from 'mongoose';
import { env, assertRuntimeEnv } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { hashPassword } from '../utils/password.js';

export const DEMO_PASSWORD = 'Passw0rd!';

export const DEMO_USERS = [
  { email: 'admin@staffhub.test', displayName: 'System Admin', roles: ['admin'] },
  { email: 'hr@staffhub.test', displayName: 'Florence Kato', roles: ['hr', 'employee'] },
  { email: 'recruiter@staffhub.test', displayName: 'Allan Tumusiime', roles: ['recruiter', 'employee'] },
  { email: 'manager@staffhub.test', displayName: 'Sarah Achieng', roles: ['manager', 'employee'] },
  { email: 'payroll@staffhub.test', displayName: 'Daniel Okello', roles: ['payroll', 'employee'] },
  { email: 'assets@staffhub.test', displayName: 'Joseph Lubega', roles: ['asset', 'employee'] },
  { email: 'employee@staffhub.test', displayName: 'Grace Namuli', roles: ['employee'] },
];

export async function seedUsers({ password = DEMO_PASSWORD, rounds } = {}) {
  const passwordHash = await hashPassword(password, rounds);
  const results = [];
  for (const u of DEMO_USERS) {
    const res = await User.updateOne(
      { email: u.email },
      { $set: { displayName: u.displayName, roles: u.roles, passwordHash, isActive: true } },
      { upsert: true, runValidators: true },
    );
    results.push({ email: u.email, created: res.upsertedCount === 1 });
  }
  return results;
}

async function main() {
  assertRuntimeEnv();
  await connectDB(env.mongoUri);
  const results = await seedUsers();
  for (const r of results) console.log(`${r.created ? 'created' : 'updated'}  ${r.email}`);
  console.log(`\nDemo password for all accounts: ${DEMO_PASSWORD}  (change before any real use)`);
  await disconnectDB();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (err) => {
    console.error(err.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
}
