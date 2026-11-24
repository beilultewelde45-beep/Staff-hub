// Money is stored as integer UGX (no subunit in practice). Round every computed amount.

const grouping = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

/** Round to a whole shilling. Throws on non-numeric input so bad data surfaces early. */
export function roundUGX(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new TypeError(`Not a valid amount: ${value}`);
  return Math.round(n) || 0; // `|| 0` turns -0 into 0
}

/** 1250000 → "UGX 1,250,000"; -5000 → "-UGX 5,000"; null → "". */
export function fmtUGX(value) {
  if (value === null || value === undefined || value === '') return '';
  const n = roundUGX(value);
  const body = `UGX ${grouping.format(Math.abs(n))}`;
  return n < 0 ? `-${body}` : body;
}
