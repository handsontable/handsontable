import {
  LICENSE_EXPIRED_TITLE,
  PURCHASE_LICENSE_TEXT,
} from '../../helpers/mixed';
import type { LicenseLifecycleFacet, LicenseStateKey } from '../../helpers/mixed';

export const SALES_MAILTO = 'mailto:sales@handsontable.com';

/**
 * Formats a day count with a correctly pluralized unit ("1 day", "2 days"), so the last-day trial
 * popover does not read "expires in 1 days".
 *
 * @param {number|null} days The number of days.
 * @returns {string}
 */
function formatDays(days: number | null): string {
  return `${days} ${days === 1 ? 'day' : 'days'}`;
}

/**
 * The copy of one badge popover: its title, body (interpolated from the lifecycle facet), and the
 * action link. `dismissible` marks the auto-opening popovers (the stops) that carry a close (X)
 * button; the others are hover/focus tooltips.
 */
export interface PopoverContent {
  title: string;
  body: (lifecycle: LicenseLifecycleFacet) => string;
  linkText: string;
  linkHref: string;
  dismissible: boolean;
}

/**
 * The copy of one hard-stop lock screen. The lock is a final, non-dismissable overlay (only the
 * trial hard stop renders one - see the routing in `index.ts`).
 */
export interface LockContent {
  title: string;
  description: string;
}

/**
 * The badge popover copy per lifecycle state. Only a trial shows the corner badge and its popover;
 * every other state renders no badge - a subscription and a perpetual license are developer-facing
 * only, and the states outside the entitlement format (missing, invalid, expired legacy,
 * non-commercial) speak through the console message and the bottom bar of
 * `initLicenseNotification`.
 *
 * The dates here carry no `(UTC)` marker: the specification puts it on the license text and the
 * console messages, which a developer reads, not on the end-user-facing surfaces.
 */
export const POPOVER_CONTENT: Partial<Record<LicenseStateKey, PopoverContent>> = {
  trial_valid: {
    title: 'Handsontable Trial',
    body: ({ daysRemaining }) =>
      `Your Handsontable license key expires in ${formatDays(daysRemaining)}. ${PURCHASE_LICENSE_TEXT}`,
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: false,
  },
  trial_notice: {
    title: 'Handsontable Trial',
    body: ({ daysRemaining }) =>
      `Your Handsontable license key expires in ${formatDays(daysRemaining)}. ${PURCHASE_LICENSE_TEXT}`,
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: false,
  },
  trial_soft_stop: {
    title: 'Handsontable Trial Expired',
    body: () => `${LICENSE_EXPIRED_TITLE} ${PURCHASE_LICENSE_TEXT}`,
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: true,
  },
};

/**
 * The lock-screen copy per hard-stopped lifecycle state, built from the lifecycle facet so the
 * expiry date the key carries can be named. Only the trial hard stop renders a lock; a hard-stopped
 * subscription keeps its console error and nothing else in 18.1.
 */
export const LOCK_CONTENT: Partial<Record<LicenseStateKey, (lifecycle: LicenseLifecycleFacet) => LockContent>> = {
  trial_hard_stop: ({ licensedUntil }) => ({
    title: `Your Handsontable trial license key expired on ${licensedUntil}.`,
    description: 'You may no longer use Handsontable under the trial license. To continue using ' +
      'the software, contact sales@handsontable.com to purchase a valid license.',
  }),
};
