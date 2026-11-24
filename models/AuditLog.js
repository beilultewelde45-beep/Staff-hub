import mongoose from 'mongoose';

// Append-only history of important changes and approvals (BR-G4, BR-A6).
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = system job
    action: { type: String, required: true, trim: true }, // e.g. "leave.approve"
    entity: { type: String, required: true, trim: true }, // e.g. "LeaveRequest"
    entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
    before: { type: mongoose.Schema.Types.Mixed, default: null },
    after: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, trim: true, default: '' },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false, minimize: false },
);

auditLogSchema.index({ entity: 1, entityId: 1 });
auditLogSchema.index({ at: -1 });

function appendOnly() {
  throw new Error('AuditLog is append-only: entries cannot be changed or deleted.');
}

// Block every update/delete path, document- and query-level (BR-X3).
auditLogSchema.pre('save', function blockResave(next) {
  if (!this.isNew) return next(new Error('AuditLog is append-only: entries cannot be changed or deleted.'));
  next();
});
for (const op of [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
]) {
  auditLogSchema.pre(op, { document: true, query: true }, appendOnly);
}

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema);
