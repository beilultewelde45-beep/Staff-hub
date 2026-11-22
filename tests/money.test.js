import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtUGX, roundUGX } from '../utils/money.js';

test('T-G5: amounts are shown as UGX with thousands separators', () => {
  assert.equal(fmtUGX(1250000), 'UGX 1,250,000');
  assert.equal(fmtUGX(0), 'UGX 0');
  assert.equal(fmtUGX(999), 'UGX 999');
  assert.equal(fmtUGX(-5000), '-UGX 5,000');
});

test('fmtUGX rounds to whole shillings and handles blanks', () => {
  assert.equal(fmtUGX(1234.5), 'UGX 1,235');
  assert.equal(fmtUGX('300000'), 'UGX 300,000');
  assert.equal(fmtUGX(null), '');
  assert.equal(fmtUGX(undefined), '');
});

test('roundUGX rejects non-numbers and never returns -0', () => {
  assert.equal(roundUGX(10.4), 10);
  assert.ok(Object.is(roundUGX(-0.4), 0));
  assert.throws(() => roundUGX('abc'), TypeError);
  assert.throws(() => roundUGX(Infinity), TypeError);
});
