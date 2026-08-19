import {
  LICENSE_EXPIRED_TITLE,
  PURCHASE_LICENSE_TEXT,
  formatExpiryClause,
} from '../../helpers/mixed';
import type { LicenseLifecycleFacet, LicenseStateKey } from '../../helpers/mixed';

export const SALES_MAILTO = 'mailto:sales@handsontable.com';
export const SUPPORT_MAILTO = 'mailto:support@handsontable.com';
export const LICENSE_KEY_DOCS_URL = 'https://handsontable.com/docs/tutorial-license-key.html';

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
 * The copy of one lock screen: a final, non-dismissable overlay over the grid. Three states render
 * one - a trial past its grace period, an unreadable key, and no key at all (see `index.ts`).
 *
 * `action` is the single button. `docsLink` is optional and rendered inside the description as a
 * real link, so the two developer-facing locks keep the documentation pointer their bottom bar
 * carried; the trial lock, which speaks to a buyer rather than an installer, has none.
 */
export interface LockContent {
  title: string;
  description: string;
  action: { text: string; href: string };
  docsLink?: { text: string; href: string; trailingText: string };
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
      `Your Handsontable license key ${formatExpiryClause(daysRemaining)}. ${PURCHASE_LICENSE_TEXT}`,
    linkText: 'Contact Sales',
    linkHref: SALES_MAILTO,
    dismissible: false,
  },
  trial_notice: {
    title: 'Handsontable Trial',
    body: ({ daysRemaining }) =>
      `Your Handsontable license key ${formatExpiryClause(daysRemaining)}. ${PURCHASE_LICENSE_TEXT}`,
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
    action: { text: 'Contact Sales', href: SALES_MAILTO },
  }),
  // A key that cannot be read and no key at all both block the grid, with the sentences their
  // bottom bar used to carry. Both are installation faults, so both point at support rather than
  // sales, and both keep the documentation link the bar had.
  invalid: () => ({
    title: 'The license key for Handsontable is invalid.',
    description: '',
    action: { text: 'Contact Support', href: SUPPORT_MAILTO },
    docsLink: {
      text: 'Read more',
      href: LICENSE_KEY_DOCS_URL,
      trailingText: ' on how to install it properly, or contact us at support@handsontable.com.',
    },
  }),
  missing: () => ({
    title: 'The license key for Handsontable is missing.',
    description: 'Use your purchased key to activate the product. Alternatively, you can activate ' +
      'Handsontable to use for non-commercial purposes by passing the key: ' +
      '\'non-commercial-and-evaluation\'. ',
    action: { text: 'Contact Support', href: SUPPORT_MAILTO },
    docsLink: {
      text: 'Read more',
      href: LICENSE_KEY_DOCS_URL,
      trailingText: ' about it in the documentation, or contact us at support@handsontable.com.',
    },
  }),
};
