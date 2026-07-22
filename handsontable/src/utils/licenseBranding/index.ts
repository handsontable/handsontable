import { _getLicenseState } from '../../helpers/mixed';
import { getProductMode, HANDSONTABLE_PRODUCT } from '../typedLicenseKey';
import { LOCK_CONTENT } from './content';
import { mountLicenseBadge } from './badge';
import { mountLicenseLock } from './lockScreen';
import type { HotInstance } from '../../core/types';

/**
 * Mounts the branding surface for one resolved license state:
 *   - `trial_active`, `trial_expired`, `freemium` -> the corner "H." badge with its popover;
 *   - `missing`, `invalid` -> the corner badge with a hover tooltip;
 *   - `non_commercial` -> the corner badge alone, no popover (the Non-Commercial and Evaluation
 *     License permits the usage, so there is nothing to warn about);
 *   - `legacy_expired` -> the corner badge with the auto-open, closable expired popover (the legacy
 *     bottom bar and console message stay exactly as they always were);
 *   - `trial_expired_hard` -> the Core-owned, non-closable lock screen;
 *   - `sub_expired_hard` -> the lock screen, closable, but ONLY for Internal-mode keys (Case 3a of
 *     the license spec); SaaS-mode keys - and any unknown future mode, whose audience is not the
 *     licensee - stay console-only (Case 3b): no lock, no bar, no badge.
 *
 * Every other state (valid legacy, running subscription, perpetual) renders nothing here - their
 * console warning and any bottom bar come from `initLicenseNotification`.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {ReturnType<typeof _getLicenseState>} descriptor The resolved license state descriptor.
 * @returns {void}
 */
function mountBrandingSurface(
  hotInstance: HotInstance,
  descriptor: ReturnType<typeof _getLicenseState>,
): void {
  const { lifecycle, grants } = descriptor;

  if (lifecycle.state === 'trial_expired_hard') {
    mountLicenseLock(hotInstance, LOCK_CONTENT.trial_expired_hard);

    return;
  }

  if (lifecycle.state === 'sub_expired_hard') {
    if (getProductMode(grants, HANDSONTABLE_PRODUCT) === 'internal') {
      mountLicenseLock(hotInstance, LOCK_CONTENT.sub_expired_hard);
    }

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
