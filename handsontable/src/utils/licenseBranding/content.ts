import {
  _formatUtcDate,
  LICENSE_EXPIRED_TITLE,
  PURCHASE_COMMERCIAL_LICENSE_TEXT,
  RENEW_LICENSE_TEXT,
} from '../../helpers/mixed';
import type { LicenseLifecycleFacet } from '../../helpers/mixed';

export const SALES_MAILTO = 'mailto:sales@handsontable.com';
export const PRICING_URL = 'https://handsontable.com/pricing';
export const LICENSE_DOCS_URL = 'https://handsontable.com/docs/license-key/';

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
 * The badge popover copy per branded lifecycle state - the typed states come from the license spec
 * mockups; the non-typed states (missing key, expired legacy key, invalid key) reuse the same badge
 * + popover surface.
 */
export const POPOVER_CONTENT: Record<string, PopoverContent> = {
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
  missing: {
    title: 'Missing license key',
    body: () =>
      'The license key for Handsontable is missing. Use your purchased key, or pass ' +
      '\'non-commercial-and-evaluation\' for non-commercial use.',
    linkText: 'Learn more',
    linkHref: LICENSE_DOCS_URL,
    dismissible: false,
  },
  invalid: {
    title: 'Invalid license key',
    body: () =>
      'The license key for Handsontable is invalid. Check that you pass the whole key string, ' +
      'exactly as you received it.',
    linkText: 'Learn more',
    linkHref: LICENSE_DOCS_URL,
    dismissible: false,
  },
  legacy_expired: {
    title: 'Expired license key',
    body: ({ expiryTimestamp }) => {
      const expiredOn = expiryTimestamp === null ? '' : _formatUtcDate(expiryTimestamp);

      return `Your Handsontable license key expired on ${expiredOn}. ${RENEW_LICENSE_TEXT}`;
    },
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: true,
  },
};

/**
 * The badge-only states: the corner badge renders with an accessible label but WITHOUT any popover.
 * The Non-Commercial and Evaluation License permits the usage, so it gets no tooltip and no
 * upgrade/purchase messaging - the badge itself is the only marker.
 */
export const BADGE_ONLY_LABELS: Record<string, string> = {
  non_commercial: 'You\'re using the Non-Commercial and Evaluation License of Handsontable',
};

/**
 * The lock-screen copy per hard-stopped lifecycle state.
 */
export const LOCK_CONTENT: Record<string, LockContent> = {
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
};
