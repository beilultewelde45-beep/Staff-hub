import { ValidationError } from './errors.js';

// Allowed status transitions (docs/02-architecture.md §7). Anything not listed is illegal.
export const MACHINES = Object.freeze({
  requisition: {
    draft: ['submitted'],
    submitted: ['approved', 'rejected'],
  },
  vacancy: {
    draft: ['published'],
    published: ['closed'],
  },
  application: {
    submitted: ['shortlisted', 'rejected', 'withdrawn'],
    shortlisted: ['interview', 'rejected', 'withdrawn'],
    interview: ['offered', 'rejected', 'withdrawn'],
    offered: ['hired', 'rejected', 'withdrawn'],
  },
  offer: {
    draft: ['pending_approval'],
    pending_approval: ['approved', 'rejected'],
    approved: ['sent'],
    sent: ['accepted', 'declined'],
  },
  leave: {
    pending_manager: ['pending_hr', 'approved', 'rejected', 'cancelled'],
    pending_hr: ['approved', 'rejected', 'cancelled'],
  },
  correction: {
    pending: ['approved', 'rejected'],
  },
  attendanceMonth: {
    open: ['locked'],
  },
  payrollRun: {
    draft: ['submitted'],
    submitted: ['approved', 'draft'], // HR rejection sends the run back to draft for recalculation
    approved: ['locked'],
  },
  asset: {
    available: ['assigned', 'retired'],
    assigned: ['available', 'damaged', 'lost'],
    damaged: ['available', 'retired'],
  },
  exitCase: {
    open: ['clearance_in_progress'],
    clearance_in_progress: ['cleared'],
    cleared: ['closed'],
  },
});

export function canTransition(machine, from, to) {
  const m = MACHINES[machine];
  if (!m) throw new Error(`Unknown state machine: ${machine}`);
  return (m[from] ?? []).includes(to);
}

/** Throw a ValidationError (shown to the user) when a status change is not allowed. */
export function assertTransition(machine, from, to) {
  if (!canTransition(machine, from, to)) {
    throw new ValidationError(`Cannot change ${machine} status from "${from}" to "${to}".`);
  }
}
