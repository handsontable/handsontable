/**
 * Relative date phrases become an inclusive YYYY-MM-DD range.
 * Weeks start on Monday. "last N days" includes today.
 */

const DAY = 86400000;

/**
 * @param {string} iso YYYY-MM-DD.
 * @returns {number|null} UTC midnight, or null when the string is not a real date.
 */
export function parseDay(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso).trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const check = new Date(utc);

  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    return null;
  }

  return utc;
}

/**
 * @param {number} utc UTC midnight.
 * @returns {string}
 */
export function formatDay(utc) {
  const date = new Date(utc);
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${date.getUTCFullYear()}-${month}-${day}`;
}

/**
 * @param {string} phrase
 * @param {string} todayIso
 * @returns {[string, string]|null} Inclusive start and end, or null when the phrase is not relative.
 */
export function resolveRelativeRange(phrase, todayIso) {
  const today = parseDay(todayIso);

  if (today == null || typeof phrase !== 'string') {
    return null;
  }

  const text = phrase.trim().toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^(?:in|over|within|during|for) the /, '')
    .replace(/^the /, '');
  const span = (start, end) => [formatDay(start), formatDay(end)];

  if (text === 'today') {
    return span(today, today);
  }

  if (text === 'yesterday') {
    return span(today - DAY, today - DAY);
  }

  if (text === 'tomorrow') {
    return span(today + DAY, today + DAY);
  }

  let match = text.match(/^(?:last|past|previous)\s+(\d+)\s+days?$/);

  if (match) {
    const count = Number(match[1]);

    return count > 0 ? span(today - (count - 1) * DAY, today) : null;
  }

  match = text.match(/^next\s+(\d+)\s+days?$/);

  if (match) {
    const count = Number(match[1]);

    return count > 0 ? span(today, today + (count - 1) * DAY) : null;
  }

  if (text === 'this week') {
    const start = startOfWeek(today);

    return span(start, start + 6 * DAY);
  }

  if (text === 'last week' || text === 'previous week') {
    const start = startOfWeek(today) - 7 * DAY;

    return span(start, start + 6 * DAY);
  }

  if (text === 'this month') {
    return span(startOfMonth(today), endOfMonth(today));
  }

  if (text === 'last month' || text === 'previous month') {
    const start = startOfMonth(startOfMonth(today) - DAY);

    return span(start, endOfMonth(start));
  }

  if (text === 'this year') {
    const year = new Date(today).getUTCFullYear();

    return span(Date.UTC(year, 0, 1), Date.UTC(year, 11, 31));
  }

  if (text === 'last year' || text === 'previous year') {
    const year = new Date(today).getUTCFullYear() - 1;

    return span(Date.UTC(year, 0, 1), Date.UTC(year, 11, 31));
  }

  if (text === 'year to date' || text === 'ytd') {
    const year = new Date(today).getUTCFullYear();

    return span(Date.UTC(year, 0, 1), today);
  }

  if (text === 'this quarter') {
    const start = startOfQuarter(today);

    return span(start, endOfQuarter(start));
  }

  if (text === 'last quarter' || text === 'previous quarter') {
    const start = startOfQuarter(startOfQuarter(today) - DAY);

    return span(start, endOfQuarter(start));
  }

  return null;
}

/**
 * @param {number} utc
 * @returns {number}
 */
function startOfWeek(utc) {
  const day = new Date(utc).getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;

  return utc + delta * DAY;
}

/**
 * @param {number} utc
 * @returns {number}
 */
function startOfMonth(utc) {
  const date = new Date(utc);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1);
}

/**
 * @param {number} utc
 * @returns {number}
 */
function endOfMonth(utc) {
  const date = new Date(utc);

  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0);
}

/**
 * @param {number} utc
 * @returns {number}
 */
function startOfQuarter(utc) {
  const date = new Date(utc);
  const month = Math.floor(date.getUTCMonth() / 3) * 3;

  return Date.UTC(date.getUTCFullYear(), month, 1);
}

/**
 * @param {number} quarterStart
 * @returns {number}
 */
function endOfQuarter(quarterStart) {
  const date = new Date(quarterStart);

  return endOfMonth(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 1));
}
