import {
  LICENSE_EXPIRED_TITLE,
  PURCHASE_COMMERCIAL_LICENSE_TEXT,
  RENEW_LICENSE_TEXT,
} from '../../helpers/mixed';
import type { LicenseLifecycleFacet, LicenseStateKey } from '../../helpers/mixed';

export const SALES_MAILTO = 'mailto:sales@handsontable.com';
export const PRICING_URL = 'https://handsontable.com/pricing';

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
 * The copy of one hard-stop lock screen. The trial lock is not closable - the evaluation has
 * definitively ended. The subscription lock (Internal deployments only, see the routing in
 * `index.ts`) is closable per the license spec: the end user can dismiss it and keep working while
 * the licensee renews.
 */
export interface LockContent {
  title: string;
  description: string;
  closable: boolean;
}

/**
 * The badge popover copy per branded lifecycle state. Only the trial and freemium states show the
 * corner badge and its popover; every other state (missing/invalid/expired-legacy/non-commercial,
 * running subscription, perpetual) renders no badge here - its console message and any bottom bar
 * come from `initLicenseNotification` instead.
 */
export const POPOVER_CONTENT: Partial<Record<LicenseStateKey, PopoverContent>> = {
  trial_active: {
    title: 'Handsontable Trial',
    body: ({ daysRemaining }) =>
      `Your Handsontable license key expires in ${formatDays(daysRemaining)}. ${PURCHASE_COMMERCIAL_LICENSE_TEXT}`,
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: false,
  },
  trial_expired: {
    title: 'Expired trial license key',
    body: () => `${LICENSE_EXPIRED_TITLE} ${PURCHASE_COMMERCIAL_LICENSE_TEXT}`,
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: true,
  },
  freemium: {
    title: 'You\'re using the Handsontable Free plan.',
    body: () => 'Upgrade to remove the watermark and unlock all features.',
    linkText: 'Learn more',
    linkHref: PRICING_URL,
    dismissible: false,
  },
};

/**
 * The lock-screen copy per hard-stopped lifecycle state.
 */
export const LOCK_CONTENT = {
  trial_expired_hard: {
    title: LICENSE_EXPIRED_TITLE,
    description: PURCHASE_COMMERCIAL_LICENSE_TEXT,
    closable: false,
  },
  sub_expired_hard: {
    title: 'Your Handsontable subscription has expired.',
    description: RENEW_LICENSE_TEXT,
    closable: true,
  },
} satisfies Partial<Record<LicenseStateKey, LockContent>>;
