import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  nowKampala,
  todayKey,
  fmt,
  fmtTime,
  endOfDayKampala,
  startOfDayKampala,
  kampalaDateTime,
  isDateKey,
} from '../utils/time.js';

test('T-G5: 07:30 UTC is shown as 10:30 EAT', () => {
  const d = new Date('2026-11-23T07:30:00Z');
  assert.equal(fmtTime(d), '10:30');
  assert.equal(fmt(d), '23 Nov 2026 10:30');
});

test('todayKey uses the Kampala calendar day, not the UTC one', () => {
  // 22:30 UTC on the 23rd is already 01:30 on the 24th in Kampala.
  assert.equal(todayKey(new Date('2026-11-23T22:30:00Z')), '2026-11-24');
  assert.equal(todayKey(new Date('2026-11-23T20:59:59Z')), '2026-11-23');
});

test('nowKampala accepts an injected clock', () => {
  assert.equal(nowKampala(new Date('2026-11-21T05:00:00Z')).format('HH:mm'), '08:00');
});

test('day boundaries are Kampala midnight (UTC+3, no DST)', () => {
  assert.equal(startOfDayKampala('2026-11-30').toISOString(), '2026-11-29T21:00:00.000Z');
  assert.equal(endOfDayKampala('2026-11-30').toISOString(), '2026-11-30T20:59:59.999Z');
  // Same offset in mid-year: Uganda has no daylight saving.
  assert.equal(startOfDayKampala('2026-06-15').toISOString(), '2026-06-14T21:00:00.000Z');
});

test('kampalaDateTime builds the UTC instant for a local schedule time', () => {
  assert.equal(kampalaDateTime('2026-11-23', '08:15').toISOString(), '2026-11-23T05:15:00.000Z');
});

test('fmt returns empty string for missing values', () => {
  assert.equal(fmt(null), '');
  assert.equal(fmt(undefined), '');
  assert.equal(fmt('not a date'), '');
});

test('isDateKey is strict', () => {
  assert.equal(isDateKey('2026-11-30'), true);
  assert.equal(isDateKey('2026-02-30'), false);
  assert.equal(isDateKey('30/11/2026'), false);
  assert.equal(isDateKey(20261130), false);
});
