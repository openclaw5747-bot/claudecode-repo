// UK pay is quoted per annum, per day (contracting) or per hour. Job boards give bare numbers,
// so the period is inferred from the size of the figure.

const gbp = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });
const gbpPence = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2 });

export function salaryPeriod(amount) {
  if (!amount || amount <= 0) return null;
  if (amount < 100) return 'hour';
  if (amount < 2000) return 'day';
  return 'year';
}

const PERIOD_LABEL = { hour: 'an hour', day: 'a day', year: 'a year' };

function money(amount, period) {
  return period === 'hour' ? gbpPence.format(amount) : gbp.format(amount);
}

/** "£30,000–£35,000 a year", "£450 a day", or null when nothing is known. */
export function formatSalary(min, max, { predicted = false } = {}) {
  min = Number(min) || 0;
  max = Number(max) || 0;
  if (!min && !max) return null;
  if (!min) min = max;
  if (!max) max = min;
  const period = salaryPeriod(max);
  const range = min === max ? money(min, period) : `${money(min, period)}–${money(max, period)}`;
  return `${range} ${PERIOD_LABEL[period]}${predicted ? ' (estimated)' : ''}`;
}

/** A rough annual figure, for sorting and filtering: 7.5h days, 230 working days a year. */
export function annualise(amount) {
  const period = salaryPeriod(amount);
  if (period === 'hour') return Math.round(amount * 7.5 * 230);
  if (period === 'day') return Math.round(amount * 230);
  return amount || 0;
}

/** Flags in a posting's text that matter in the UK and that boards don't give as fields. */
export function ukFlags(text = '') {
  const t = text.toLowerCase();
  const flags = [];
  if (/\boutside ir35\b/.test(t)) flags.push('Outside IR35');
  else if (/\binside ir35\b/.test(t)) flags.push('Inside IR35');
  else if (/\bir35\b/.test(t)) flags.push('IR35 mentioned');
  if (/\b(no|not able to|unable to|cannot|can't|do not|does not|don't)\b[^.]{0,40}\bsponsor/.test(t)) flags.push('Says no sponsorship');
  else if (/\b(visa )?sponsorship (is )?(available|offered|provided)|\bwill sponsor\b|\bcan sponsor\b/.test(t)) flags.push('Offers sponsorship');
  if (/\b(sc|dv|ctc|bpss)\b[^.]{0,30}\bclearance|\bsecurity clearance\b|\bsc cleared\b|\bdv cleared\b/.test(t)) flags.push('Security clearance');
  if (/\b(enhanced )?dbs\b/.test(t)) flags.push('DBS check');
  if (/\bfull (uk )?driving licen[cs]e\b|\bdriving licen[cs]e (is )?(required|essential)/.test(t)) flags.push('Driving licence');
  if (/\bhybrid\b/.test(t)) flags.push('Hybrid');
  if (/\b(fully )?remote\b/.test(t)) flags.push('Remote');
  if (/\bgraduate scheme\b|\bgraduate programme\b/.test(t)) flags.push('Graduate scheme');
  return flags;
}
