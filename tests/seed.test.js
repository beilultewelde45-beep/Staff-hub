import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startDb, stopDb } from './helpers/db.js';
import { User } from '../models/User.js';
import { seedUsers, DEMO_USERS, DEMO_PASSWORD } from '../seed/seed.js';

before(startDb);
after(stopDb);

test('F-09: seed creates one account per demo user and is idempotent', async () => {
  const first = await seedUsers({ rounds: 4 });
  assert.ok(first.every((r) => r.created));

  // Simulate drift: deactivated and roles changed. Re-seeding restores the demo state.
  await User.updateOne({ email: 'manager@staffhub.test' }, { isActive: false, roles: ['employee'] });
  const second = await seedUsers({ rounds: 4 });
  assert.ok(second.every((r) => !r.created));

  assert.equal(await User.countDocuments(), DEMO_USERS.length);
  const mgr = await User.findOne({ email: 'manager@staffhub.test' }).select('+passwordHash');
  assert.equal(mgr.isActive, true);
  assert.deepEqual([...mgr.roles], ['manager', 'employee']);
  assert.ok(await mgr.checkPassword(DEMO_PASSWORD));
});

test('every role is covered by at least one demo account', () => {
  const roles = new Set(DEMO_USERS.flatMap((u) => u.roles));
  for (const r of ['admin', 'hr', 'recruiter', 'manager', 'payroll', 'asset', 'employee']) {
    assert.ok(roles.has(r), r);
  }
});

test('passwords are stored as bcrypt hashes and hidden by default', async () => {
  const plain = await User.findOne({ email: 'employee@staffhub.test' });
  assert.equal(plain.passwordHash, undefined);
  assert.equal(JSON.stringify(plain).includes('passwordHash'), false);
  const withHash = await User.findOne({ email: 'employee@staffhub.test' }).select('+passwordHash');
  assert.match(withHash.passwordHash, /^\$2[aby]\$/);
});
