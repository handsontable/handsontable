/**
 * Date helpers for the nl-view schema PoC. All arithmetic is UTC so a
 * `YYYY-MM-DD` string does not shift with the host time zone.
 */

export function parseIso(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));

  if (!match) {
    throw new Error(`expected YYYY-MM-DD, got ${iso}`);
  }

  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function formatIso(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function addDays(iso, days) {
  const { y, m, d } = parseIso(iso);
  const date = new Date(Date.UTC(y, m - 1, d));

  date.setUTCDate(date.getUTCDate() + days);

  return date.toISOString().slice(0, 10);
}

/**
 * Anchors the model can copy instead of doing calendar arithmetic.
 * `today` is the eval override (default 2026-10-20), not the computer clock.
 */
export function calendarFor(today) {
  const { y, m } = parseIso(today);
  const weekday = new Date(Date.UTC(y, m - 1, parseIso(today).d)).getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monthEnd = new Date(Date.UTC(y, m, 0));

  return {
    today,
    yesterday: addDays(today, -1),
    tomorrow: addDays(today, 1),
    last7DaysInclusive: { from: addDays(today, -6), to: today },
    last30DaysInclusive: { from: addDays(today, -29), to: today },
    thisWeekMondayToSunday: { from: addDays(today, mondayOffset), to: addDays(today, mondayOffset + 6) },
    thisMonth: { from: formatIso(y, m, 1), to: monthEnd.toISOString().slice(0, 10) },
    thisYear: { from: `${y}-01-01`, to: `${y}-12-31` },
  };
}
