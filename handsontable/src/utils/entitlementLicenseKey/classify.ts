import type { ProductEntitlement, LicenseLifecycle, LicenseState, LicenseChannels } from './types';
import { parseIsoDateToTimestamp } from './encoding';
import {
  TRIAL_FLAG,
  NO_CONSOLE_WARNS_FLAG,
  NO_UI_WARNS_FLAG,
  MILLISECONDS_PER_DAY,
} from './constants';

/**
 * The time references a license is measured against: the current instant for a
 * `usage_until` entitlement, and the build release date (as the bare
 * "YYYY-MM-DD" text it is compared to) for a `release_until` one. The build
 * date is text on purpose - the maintenance check is static against static, so
 * it holds on a machine with no clock and cannot disagree between two
 * timezones.
 */
export interface LicenseTimeReference {
  now: number;
  buildDate: string;
}

/**
 * The window a `usage_until` license is in, before the trial flag decides how
 * it is worded.
 */
type UsageWindow = 'valid' | 'notice' | 'soft_stop' | 'hard_stop';

/**
 * The UTC midnight of the day an instant falls on. Every window boundary is a
 * UTC midnight, so both sides of every comparison are snapped to one - the
 * local calendar, the locale and DST are inputs the classification must not
 * read at all.
 *
 * @param {number} timestamp The instant, in epoch milliseconds.
 * @returns {number}
 */
function utcMidnightOf(timestamp: number): number {
  return Math.floor(timestamp / MILLISECONDS_PER_DAY) * MILLISECONDS_PER_DAY;
}

/**
 * Whole UTC days from today until the last licensed day. `0` on the last
 * licensed day (which is still licensed in full) and negative once it has
 * passed. Both sides are UTC midnights, so the count is a whole number of
 * calendar days and never a rounded fraction.
 *
 * @param {number} expiryTimestamp The UTC midnight of the last licensed day.
 * @param {number} now The current instant, in epoch milliseconds.
 * @returns {number}
 */
function daysUntil(expiryTimestamp: number, now: number): number {
  return (expiryTimestamp - utcMidnightOf(now)) / MILLISECONDS_PER_DAY;
}

/**
 * Places a `usage_until` license in its window.
 *
 * The named day is licensed in full: the license runs until the UTC midnight
 * that FOLLOWS it, and the grace period is measured from there. A `notice` of
 * `0` means no advance warning at all, so the notice window is empty rather
 * than one day long.
 *
 * @param {number} expiryTimestamp The UTC midnight of the last licensed day.
 * @param {ProductEntitlement} entitlement The product entry the windows come from.
 * @param {number} now The current instant, in epoch milliseconds.
 * @returns {UsageWindow}
 */
function resolveUsageWindow(
  expiryTimestamp: number,
  entitlement: ProductEntitlement,
  now: number,
): UsageWindow {
  const expiryBoundary = expiryTimestamp + MILLISECONDS_PER_DAY;

  if (now >= expiryBoundary) {
    return now < expiryBoundary + (entitlement.grace * MILLISECONDS_PER_DAY) ? 'soft_stop' : 'hard_stop';
  }

  const daysRemaining = daysUntil(expiryTimestamp, now);

  return entitlement.notice > 0 && daysRemaining <= entitlement.notice ? 'notice' : 'valid';
}

/**
 * Classifies one product entitlement into its lifecycle facet.
 *
 * Which of the two dates the entry carries decides how it is measured; the
 * `trial` flag decides only what the user is told. Nothing here branches on a
 * contract type, because the payload does not carry one.
 *
 * @param {ProductEntitlement} entitlement The verified product entry.
 * @param {LicenseTimeReference} time The time references to measure against.
 * @returns {LicenseLifecycle}
 */
export function classifyEntitlement(
  entitlement: ProductEntitlement,
  time: LicenseTimeReference,
): LicenseLifecycle {
  const isTrial = entitlement.flags.indexOf(TRIAL_FLAG) !== -1;

  if (entitlement.release_until !== undefined) {
    const releaseUntil = entitlement.release_until;
    // Fail OPEN when the build release date is unavailable (a bundler consuming the source without
    // the build-time define step, a broken build): a paying customer must never be told their
    // license lapsed because of a build defect. The legacy path stays valid in the same
    // environment.
    const covered = releaseUntil >= time.buildDate || parseIsoDateToTimestamp(time.buildDate) === null;

    return {
      state: covered ? 'release_valid' : 'release_expired',
      isTrial,
      daysRemaining: null,
      licensedUntil: releaseUntil,
    };
  }

  const usageUntil = `${entitlement.usage_until}`;
  // Verified at read time, so the date always parses here; the fallback only keeps the arithmetic
  // finite if this is ever called with an unverified entry.
  const expiryTimestamp = parseIsoDateToTimestamp(usageUntil) ?? utcMidnightOf(time.now);
  const window = resolveUsageWindow(expiryTimestamp, entitlement, time.now);

  return {
    state: `${isTrial ? 'trial' : 'usage'}_${window}` as LicenseState,
    isTrial,
    daysRemaining: daysUntil(expiryTimestamp, time.now),
    licensedUntil: usageUntil,
  };
}

/**
 * Reads which notification channels a product entitlement leaves open. Both
 * flags are per product and default to open; a key issued for external,
 * end-user-facing use carries both.
 *
 * @param {ProductEntitlement} entitlement The verified product entry.
 * @returns {LicenseChannels}
 */
export function resolveChannels(entitlement: ProductEntitlement): LicenseChannels {
  return {
    console: entitlement.flags.indexOf(NO_CONSOLE_WARNS_FLAG) === -1,
    ui: entitlement.flags.indexOf(NO_UI_WARNS_FLAG) === -1,
  };
}
