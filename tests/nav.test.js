import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildNav } from '../config/nav.js';

const texts = (roles, path) => buildNav({ roles }, path).flatMap((s) => s.items.map((i) => i.text));

test('employee sees self-service items only', () => {
  const t = texts(['employee']);
  assert.ok(t.includes('Payslips') && t.includes('Leave') && t.includes('My profile'));
  for (const hidden of ['Users', 'Audit log', 'Payroll', 'Employees', 'Approvals', 'Assets']) {
    assert.ok(!t.includes(hidden), `employee should not see ${hidden}`);
  }
});

test('admin sees system items but no self-service', () => {
  const t = texts(['admin']);
  assert.ok(t.includes('Users') && t.includes('Settings') && t.includes('Audit log'));
  assert.ok(!t.includes('Payslips') && !t.includes('Payroll'));
});

test('multiple roles combine (manager + employee)', () => {
  const t = texts(['manager', 'employee']);
  assert.ok(t.includes('Approvals') && t.includes('Team attendance') && t.includes('Leave'));
  assert.ok(!t.includes('Payroll'));
});

test('only the most specific item is active', () => {
  const items = buildNav({ roles: ['employee'] }, '/me/payslips').flatMap((s) => s.items);
  assert.deepEqual(items.filter((i) => i.active).map((i) => i.href), ['/me/payslips']);
  const home = buildNav({ roles: ['employee'] }, '/').flatMap((s) => s.items);
  assert.deepEqual(home.filter((i) => i.active).map((i) => i.href), ['/']);
});

test('empty sections are dropped', () => {
  const labels = buildNav({ roles: ['employee'] }).map((s) => s.label);
  assert.ok(!labels.includes('System') && !labels.includes('Recruitment'));
});
