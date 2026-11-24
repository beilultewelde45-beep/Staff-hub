import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertTransition, canTransition, MACHINES } from '../utils/stateMachine.js';
import { ValidationError } from '../utils/errors.js';

test('allowed transitions pass', () => {
  assert.doesNotThrow(() => assertTransition('offer', 'approved', 'sent'));
  assert.doesNotThrow(() => assertTransition('leave', 'pending_manager', 'pending_hr'));
  assert.doesNotThrow(() => assertTransition('payrollRun', 'approved', 'locked'));
});

test('illegal transitions throw ValidationError (BR-R4: offer must be approved before sent)', () => {
  assert.throws(() => assertTransition('offer', 'draft', 'sent'), ValidationError);
  assert.throws(() => assertTransition('offer', 'pending_approval', 'sent'), ValidationError);
});

test('terminal states have no way out', () => {
  assert.equal(canTransition('payrollRun', 'locked', 'draft'), false);
  assert.equal(canTransition('leave', 'approved', 'pending_manager'), false);
  assert.equal(canTransition('asset', 'lost', 'available'), false);
  assert.equal(canTransition('exitCase', 'closed', 'open'), false);
});

test('HR stage only after manager stage', () => {
  assert.equal(canTransition('leave', 'pending_hr', 'pending_manager'), false);
});

test('unknown machine is a programming error, not a user error', () => {
  assert.throws(() => canTransition('nope', 'a', 'b'), /Unknown state machine/);
});

test('every listed target state is a string', () => {
  for (const [name, states] of Object.entries(MACHINES)) {
    for (const [from, tos] of Object.entries(states)) {
      assert.ok(Array.isArray(tos) && tos.every((t) => typeof t === 'string'), `${name}.${from}`);
    }
  }
});
