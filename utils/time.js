// All instants are stored as UTC Dates; everything shown to people is Kampala time.
// Working days are identified by a "YYYY-MM-DD" key computed in Kampala (BR-G5).
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

export const TZ = 'Africa/Kampala';
export const DATE_KEY = 'YYYY-MM-DD';

/** Current moment as a Kampala-zoned dayjs. Pass `now` to freeze time in tests. */
export function nowKampala(now = new Date()) {
  return dayjs(now).tz(TZ);
}

/** Any Date/ISO string → Kampala-zoned dayjs. */
export function toKampala(date) {
  return dayjs(date).tz(TZ);
}

/** Kampala calendar date ("YYYY-MM-DD") for an instant — the working-day key. */
export function todayKey(now = new Date()) {
  return nowKampala(now).format(DATE_KEY);
}

export function isDateKey(value) {
  return typeof value === 'string' && dayjs(value, DATE_KEY, true).isValid();
}

/** Start of a Kampala calendar day as a UTC Date. */
export function startOfDayKampala(key) {
  return dayjs.tz(key, DATE_KEY, TZ).startOf('day').toDate();
}

/** 23:59:59.999 Kampala on that date as a UTC Date (closing dates are inclusive). */
export function endOfDayKampala(key) {
  return dayjs.tz(key, DATE_KEY, TZ).endOf('day').toDate();
}

/** Build a UTC Date from a Kampala date key and "HH:mm" time. */
export function kampalaDateTime(key, hhmm) {
  return dayjs.tz(`${key} ${hhmm}`, 'YYYY-MM-DD HH:mm', TZ).toDate();
}

/** Format an instant in Kampala time. Empty string for null/invalid. */
export function fmt(date, pattern = 'DD MMM YYYY HH:mm') {
  if (date === null || date === undefined || date === '') return '';
  const d = toKampala(date);
  return d.isValid() ? d.format(pattern) : '';
}

export const fmtDate = (date) => fmt(date, 'DD MMM YYYY');
export const fmtTime = (date) => fmt(date, 'HH:mm');
export const fmtDateTime = (date) => `${fmt(date, 'ddd DD MMM YYYY · HH:mm')} EAT`;

export { dayjs };
