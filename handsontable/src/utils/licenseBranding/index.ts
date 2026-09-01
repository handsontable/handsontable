import { _getLicenseState } from '../../helpers/mixed';
import { LOCK_CONTENT } from './content';
import { mountLicenseBadge } from './badge';
import { mountLicenseLock } from './lockScreen';
import type { HotInstance } from '../../core/types';

/**
 * Mounts the branding surface for one resolved license state:
 *   - a running or soft-stopped trial -> the corner "H." badge with its popover;
 *   - a hard-stopped trial, an unreadable key, or no key at all -> the Core-owned, non-dismissable
 *     lock screen (whichever states `LOCK_CONTENT` holds copy for - that table IS this routing).
 *
 * Every other state renders nothing here. The corner badge is reserved for a trial. The lock is
 * reserved for the three states a user cannot work through: the trial hard stop, and the two
 * install faults - a key that cannot be read and a key that was never set - which the specification
 * (S4.5) gives the same blocking shape as a lapsed trial. A hard-stopped SUBSCRIPTION is
 * deliberately not among them: it is developer-facing only (console error, nothing else), because
 * 18.1 never blocks a paying customer. A non-commercial key, an expired or valid legacy key, a
 * running subscription and a covered perpetual license render nothing here; their console message
 * and any bottom bar come from `initLicenseNotification`.
 *
 * A key carrying `no-ui-warns` renders no WARNING surface - no badge and no popover - which is what
 * keeps a licensed SaaS application from showing license copy to its own end users. It does NOT
 * suppress the lock screen: the flag covers UI *warnings* (S2.3), while the hard stop is the
 * *enforcement* of a license that has stopped. The lock is therefore routed BEFORE the channel gate
 * below.
 *
 * Scope of the change: only `trial_hard_stop` is affected. A lapsed SUBSCRIPTION (`usage_hard_stop`)
 * has no `LOCK_CONTENT` entry and blocks nothing by product decision, and `release_expired` never
 * blocks either - so what this fixed is external/SaaS TRIALS, which were the only externally-issued
 * keys that could ever have been blocked. `invalid` and `missing` describe keys whose flags could
 * not be read, and both resolve to open channels, so they reached the lock either way.
 *
 * This is a product decision recorded under DEV-2709, NOT a reading the specification states. S4.1
 * heads its behavior column "Behaviour (unless `silent`)" over a hard-stop row that says
 * "Trial: block", which read literally puts the block inside the silenced set; S2.3's `trial` row
 * ("Trial messages + hard-stop block") separates the two. The split below is the answer to that
 * ambiguity and the specification still needs amending to match - do not revert this from S4.1 alone.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {ReturnType<typeof _getLicenseState>} descriptor The resolved license state descriptor.
 * @returns {void}
 */
function mountBrandingSurface(
  hotInstance: HotInstance,
  descriptor: ReturnType<typeof _getLicenseState>,
): void {
  const { lifecycle, channels } = descriptor;
  const buildLockContent = LOCK_CONTENT[lifecycle.state];

  if (buildLockContent) {
    mountLicenseLock(hotInstance, buildLockContent(lifecycle));

    return;
  }

  if (!channels.ui) {
    return;
  }

  mountLicenseBadge(hotInstance, lifecycle);
}

/**
 * Initializes the license branding UI (the corner badge, its popovers, and the hard-stop lock
 * screen) for the resolved license state. The `*.handsontable.com` bypass is already resolved by
 * `_getLicenseState`. Runs once for the root instance.
 *
 * The license key is read once, at initialization - like the rest of the license system (the
 * console message and the bottom bar in `initLicenseNotification`). Changing `licenseKey` through
 * `updateSettings` does not re-brand; applying a new key requires re-creating the instance.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @returns {void}
 */
export function initLicenseBranding(hotInstance: HotInstance): void {
  // DO NOT add a `typeof process` guard here - see the matching comment in `initLicenseNotification`.
  // The bundler inlines `process.env.HOT_RELEASE_DATE` to a string literal (the bare read cannot
  // crash); a guard is left un-inlined and compiles to `false` in browser bundles, blanking the date
  // and silently killing expired-key detection.
  const releaseDate = process.env.HOT_RELEASE_DATE || '';

  mountBrandingSurface(hotInstance, _getLicenseState(hotInstance.getSettings().licenseKey, releaseDate));
}
