// Your email, phone number and postcode never reach the server's disk or the AI. They live in your
// browser only. Documents hold placeholders such as [[phone]], which the page (and the printable
// CV and letter) fill in from the browser when you look at them.

export const PRIVATE_FIELDS = ['email', 'phone', 'postcode'];
export const placeholder = (field) => `[[${field}]]`;

/** A copy of the profile without the private fields. */
export function withoutPrivate(profile = {}) {
  const out = { ...profile };
  for (const f of PRIVATE_FIELDS) delete out[f];
  return out;
}

const EMAIL = /[\w.+'-]+@[\w-]+(?:\.[\w-]+)+/g;
// 07700 900123, +44 7700 900123, +44 (0)113 496 0000, (0113) 496 0000, 020 7946 0000, 07700900123
const PHONE = /(?:\+44\s?(?:\(0\)\s?)?|\(?\b0)\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g;
// Full UK postcodes, written in capitals as they are on a CV: LS6 2AB, SW1A 1AA, M1 1AE
const POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?) ?(\d[A-Z]{2})\b/;
const STREET_WORDS = 'street|st|road|rd|avenue|ave|lane|ln|close|drive|dr|way|court|ct|crescent|place|pl|gardens|grove|terrace|hill|park|square|mews|walk|row|view|rise';
const STREET = new RegExp(`^\\s*(?:flat|apartment|apt|unit|\\d+[a-z]?)\\b[^,\\n]{0,40}\\b(?:${STREET_WORDS})\\b`, 'i');
const ENDS_LIKE_STREET = new RegExp(`\\b(?:${STREET_WORDS})\\.?$`, 'i');

/**
 * Takes contact details out of a CV's text before anything else sees it. Returns the cleaned text
 * and what was found (to be kept in the browser). A line with a postcode, or one that starts like
 * a street address, is replaced; the town, if the line ends with one, is kept.
 */
export function redact(text = '') {
  const found = {};
  const out = text
    .replace(EMAIL, (m) => { found.email ??= m; return '[email removed]'; })
    .replace(PHONE, (m) => { found.phone ??= m.trim(); return '[phone removed]'; })
    .split('\n')
    .map((line) => {
      const pc = POSTCODE.exec(line);
      if (!pc && !(line.length < 90 && STREET.test(line))) return line;
      if (pc) found.postcode ??= pc[1];
      // "12 Hyde Park Road, Leeds LS6 2AB" keeps "Leeds"; the email and phone markers on the line stay too.
      const parts = line.replace(POSTCODE, '').split(/[,|•·]/).map((s) => s.trim()).filter(Boolean);
      const town = parts.filter((s) => /^[A-Za-z][A-Za-z .'-]+$/.test(s) && !ENDS_LIKE_STREET.test(s)).pop();
      const kept = parts.filter((s) => /^\[(email|phone) removed\]$/.test(s));
      return ['[home address removed]', town, ...kept].filter(Boolean).join(', ');
    })
    .join('\n');
  return { text: out, found };
}
