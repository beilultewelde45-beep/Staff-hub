import { test, before, after, beforeEach, describe } from 'node:test';
import assert from 'node:assert/strict';
import { startDb, stopDb, clearDb } from './helpers/db.js';
import { login, newAgent } from './helpers/http.js';
import { createApp } from '../app.js';
import { User } from '../models/User.js';
import { seedUsers, DEMO_USERS, DEMO_PASSWORD } from '../seed/seed.js';
import { NAV, buildNav } from '../config/nav.js';
import { requireRole } from '../middleware/auth.js';
import { ForbiddenError } from '../utils/errors.js';

const SECRET = 'test-secret';
let app;

before(async () => {
  await startDb();
  app = createApp({ sessionSecret: SECRET, loginRateLimit: 1000 });
});
after(stopDb);
beforeEach(async () => {
  await clearDb();
  await seedUsers({ rounds: 4 });
});

describe('BR-A1: every page needs sign-in', () => {
  test('T-A1: logged-out visitors are redirected to /login', async () => {
    const agent = newAgent(app);
    for (const path of ['/', '/employees', '/payroll']) {
      const res = await agent.get(path);
      assert.equal(res.status, 302, path);
      assert.equal(res.headers.location, '/login', path);
    }
  });

  test('public endpoints stay public', async () => {
    const agent = newAgent(app);
    assert.equal((await agent.get('/login')).status, 200);
    assert.equal((await agent.get('/health')).status, 200);
    assert.equal((await agent.get('/css/app.css')).status, 200);
  });

  test('after sign-in the user returns to the page they asked for', async () => {
    const agent = newAgent(app);
    await agent.get('/approvals');
    const res = await login(agent, 'manager@staffhub.test', DEMO_PASSWORD);
    assert.equal(res.headers.location, '/approvals');
  });
});

describe('Day-1 AC: each seeded user logs in and only sees their menu items', () => {
  const allTexts = [...new Set(NAV.flatMap((s) => s.items.map((i) => i.text)))];

  for (const demo of DEMO_USERS) {
    test(demo.email, async () => {
      const agent = newAgent(app);
      const res = await login(agent, demo.email, DEMO_PASSWORD);
      assert.equal(res.status, 302);
      assert.equal(res.headers.location, '/');

      const page = await agent.get('/');
      assert.equal(page.status, 200);
      assert.match(page.text, new RegExp(demo.displayName));

      const sidebar = page.text.slice(page.text.indexOf('<aside'), page.text.indexOf('</aside>'));
      const expected = buildNav({ roles: demo.roles }).flatMap((s) => s.items.map((i) => i.text));
      for (const text of allTexts) {
        const shown = sidebar.includes(`>${text.replaceAll('&', '&amp;')}<`);
        assert.equal(shown, expected.includes(text), `${demo.email}: "${text}" ${shown ? 'shown' : 'hidden'}`);
      }
    });
  }
});

describe('login', () => {
  test('F-04 AC: wrong password and unknown email get the same generic error', async () => {
    const a = await login(newAgent(app), 'employee@staffhub.test', 'wrong-password');
    const b = await login(newAgent(app), 'nobody@staffhub.test', 'wrong-password');
    for (const res of [a, b]) {
      assert.equal(res.status, 401);
      assert.match(res.text, /Invalid email or password\./);
    }
  });

  test('email is matched case- and space-insensitively', async () => {
    const res = await login(newAgent(app), '  Employee@StaffHub.TEST ', DEMO_PASSWORD);
    assert.equal(res.status, 302);
  });

  test('F-04 AC / BR-A7: an inactive user cannot sign in', async () => {
    await User.updateOne({ email: 'employee@staffhub.test' }, { isActive: false });
    const res = await login(newAgent(app), 'employee@staffhub.test', DEMO_PASSWORD);
    assert.equal(res.status, 403);
    assert.match(res.text, /deactivated/);
  });

  test('T-A7: deactivating a signed-in user logs them out on the next request', async () => {
    const agent = newAgent(app);
    await login(agent, 'employee@staffhub.test', DEMO_PASSWORD);
    assert.equal((await agent.get('/')).status, 200);

    await User.updateOne({ email: 'employee@staffhub.test' }, { isActive: false });
    const res = await agent.get('/');
    assert.equal(res.status, 302);
    assert.equal(res.headers.location, '/login');
    const loginPage = await agent.get('/login');
    assert.match(loginPage.text, /This account has been deactivated/);
    assert.equal((await agent.get('/')).status, 302, 'stays logged out');
  });

  test('session id changes on login (no session fixation)', async () => {
    const agent = newAgent(app);
    const page = await agent.get('/login');
    const before = page.headers['set-cookie']?.[0]?.split(';')[0];
    const res = await login(agent, 'employee@staffhub.test', DEMO_PASSWORD);
    const afterCookie = res.headers['set-cookie']?.[0]?.split(';')[0];
    assert.ok(afterCookie && afterCookie !== before);
  });

  test('records lastLoginAt', async () => {
    await login(newAgent(app), 'hr@staffhub.test', DEMO_PASSWORD);
    const u = await User.findOne({ email: 'hr@staffhub.test' });
    assert.ok(u.lastLoginAt instanceof Date);
  });

  test('logout ends the session', async () => {
    const agent = newAgent(app);
    await login(agent, 'employee@staffhub.test', DEMO_PASSWORD);
    const page = await agent.get('/');
    const csrf = /name="_csrf" value="([^"]+)"/.exec(page.text)[1];
    const res = await agent.post('/logout').type('form').send({ _csrf: csrf });
    assert.equal(res.headers.location, '/login');
    assert.equal((await agent.get('/')).status, 302);
  });

  test('forms without a CSRF token are rejected', async () => {
    const agent = newAgent(app);
    await agent.get('/login');
    const res = await agent.post('/login').type('form').send({ email: 'employee@staffhub.test', password: DEMO_PASSWORD });
    assert.equal(res.status, 403);
  });

  test('failed logins are rate limited per IP', async () => {
    const limited = createApp({ sessionSecret: SECRET, loginRateLimit: 2 });
    const agent = newAgent(limited);
    assert.equal((await login(agent, 'employee@staffhub.test', 'bad-pass-1')).status, 401);
    assert.equal((await login(agent, 'employee@staffhub.test', 'bad-pass-2')).status, 401);
    const res = await login(agent, 'employee@staffhub.test', DEMO_PASSWORD);
    assert.equal(res.status, 429);
    assert.match(res.text, /Too many sign-in attempts/);
  });
});

describe('BR-A2: requireRole', () => {
  const run = (roles, user) =>
    new Promise((resolve) => {
      const res = { redirect: (to) => resolve({ redirect: to }) };
      requireRole(...roles)({ user }, res, (err) => resolve({ err }));
    });

  test('passes when the user holds any of the roles', async () => {
    assert.deepEqual(await run(['hr', 'payroll'], { roles: ['payroll', 'employee'] }), { err: undefined });
  });

  test('ForbiddenError when no role overlaps', async () => {
    const { err } = await run(['payroll'], { roles: ['employee'] });
    assert.ok(err instanceof ForbiddenError);
  });

  test('redirects to login without a user', async () => {
    assert.deepEqual(await run(['hr'], null), { redirect: '/login' });
  });
});

test('signed-in users get a 404 page for unknown routes', async () => {
  const agent = newAgent(app);
  await login(agent, 'employee@staffhub.test', DEMO_PASSWORD);
  const res = await agent.get('/does-not-exist');
  assert.equal(res.status, 404);
  assert.match(res.text, /Page not found/);
});
