import mongoose from 'mongoose';
import { AuditLog } from '../models/AuditLog.js';
import { ValidationError } from '../utils/errors.js';

// Never written to the audit log at all.
const STRIPPED_KEYS = new Set(['passwordHash', 'password', '__v']);
// Kept, but only the last 4 characters are visible ("****1234").
const MASKED_KEYS = new Set(['bankAccountNo', 'accountNo', 'nationalId', 'nin', 'tin', 'nssfNo']);

export function maskValue(value) {
  if (value === null || value === undefined || value === '') return value;
  const s = String(value);
  return s.length <= 4 ? '****' : `****${s.slice(-4)}`;
}

/** Deep-copy a snapshot into plain data, stripping secrets and masking identifiers. */
export function sanitize(value) {
  if (value === null || value === undefined) return value;
  if (value instanceof mongoose.Document) return sanitize(value.toObject({ depopulate: true }));
  if (value instanceof mongoose.Types.ObjectId) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(sanitize);
  if (typeof value === 'object') {
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      if (STRIPPED_KEYS.has(key)) continue;
      out[key] = MASKED_KEYS.has(key) ? maskValue(v) : sanitize(v);
    }
    return out;
  }
  return value;
}

/**
 * Record an important change or approval.
 * @param {object} entry
 * @param {object|string|null} entry.actor  User doc/id, or null for system jobs
 * @param {string} entry.action             e.g. "leave.approve"
 * @param {string} entry.entity             model name, e.g. "LeaveRequest"
 * @param {*} [entry.entityId]
 * @param {*} [entry.before]
 * @param {*} [entry.after]
 * @param {string} [entry.reason]
 * @param {boolean} [entry.requireReason]   throw ValidationError if reason is blank (BR-G3)
 * @param {import('mongoose').ClientSession} [entry.session]  include in a transaction
 */
export async function log({
  actor = null,
  action,
  entity,
  entityId = null,
  before = null,
  after = null,
  reason = '',
  requireReason = false,
  session,
}) {
  if (!action || !entity) throw new Error('auditService.log needs action and entity');
  const cleanReason = typeof reason === 'string' ? reason.trim() : '';
  if (requireReason && !cleanReason) throw new ValidationError('A reason is required.');

  const [doc] = await AuditLog.create(
    [
      {
        actor: actor?._id ?? actor,
        action,
        entity,
        entityId: entityId?._id ?? entityId,
        before: sanitize(before),
        after: sanitize(after),
        reason: cleanReason,
      },
    ],
    { session },
  );
  return doc;
}

export const auditService = { log, sanitize, maskValue };
