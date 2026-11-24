import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { startDb, stopDb, clearDb } from './helpers/db.js';
import { AuditLog } from '../models/AuditLog.js';
import { log, sanitize, maskValue } from '../services/auditService.js';
import { ValidationError } from '../utils/errors.js';

before(startDb);
after(stopDb);
beforeEach(clearDb);

test('masking keeps only the last 4 characters', () => {
  assert.equal(maskValue('0123456789'), '****6789');
  assert.equal(maskValue('123'), '****');
  assert.equal(maskValue(''), '');
});

test('sanitize strips password hashes and masks identifiers, recursively', () => {
  const out = sanitize({
    email: 'a@b.c',
    passwordHash: '$2b$...',
    compensation: { bankAccountNo: '0123456789', nationalId: 'CM900123456ABC', basicSalary: 1500000 },
    history: [{ tin: '1000123456' }],
  });
  assert.equal(out.passwordHash, undefined);
  assert.equal(out.compensation.bankAccountNo, '****6789');
  assert.equal(out.compensation.nationalId, '****6ABC');
  assert.equal(out.compensation.basicSalary, 1500000);
  assert.equal(out.history[0].tin, '****3456');
});

test('T-A6: log() stores actor, action, entity, before/after and reason', async () => {
  const actor = new mongoose.Types.ObjectId();
  const entityId = new mongoose.Types.ObjectId();
  await log({
    actor,
    action: 'leave.approve',
    entity: 'LeaveRequest',
    entityId,
    before: { status: 'pending_manager' },
    after: { status: 'approved' },
    reason: '  ok  ',
  });
  const [row] = await AuditLog.find().lean();
  assert.equal(String(row.actor), String(actor));
  assert.equal(row.action, 'leave.approve');
  assert.equal(String(row.entityId), String(entityId));
  assert.deepEqual(row.before, { status: 'pending_manager' });
  assert.deepEqual(row.after, { status: 'approved' });
  assert.equal(row.reason, 'ok');
  assert.ok(row.at instanceof Date);
});

test('BR-G3: requireReason rejects a blank reason and writes nothing', async () => {
  await assert.rejects(
    log({ actor: null, action: 'leave.reject', entity: 'LeaveRequest', reason: '   ', requireReason: true }),
    ValidationError,
  );
  assert.equal(await AuditLog.countDocuments(), 0);
});

test('BR-G4: audit entries are append-only', async () => {
  const entry = await log({ action: 'user.deactivate', entity: 'User' });
  await assert.rejects(AuditLog.updateOne({ _id: entry._id }, { reason: 'edited' }), /append-only/);
  await assert.rejects(AuditLog.deleteOne({ _id: entry._id }), /append-only/);
  await assert.rejects(AuditLog.deleteMany({}), /append-only/);
  await assert.rejects(AuditLog.findOneAndUpdate({ _id: entry._id }, { reason: 'x' }), /append-only/);
  entry.reason = 'edited';
  await assert.rejects(entry.save(), /append-only/);
  await assert.rejects(entry.deleteOne(), /append-only/);
  assert.equal(await AuditLog.countDocuments(), 1);
});
