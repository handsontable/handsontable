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
 * @param {boolean} isInitialMount Whether this mount runs during `init()` (the grid is not rendered yet).
 * @returns {Function|null} The unmount function, or `null` when the state renders nothing.
 */
function mountBrandingSurface(
  hotInstance: HotInstance,
  descriptor: ReturnType<typeof _getLicenseState>,
  isInitialMount: boolean,
): (() => void) | null {
  const { lifecycle, grants } = descriptor;

  if (lifecycle.state === 'trial_expired_hard') {
    return mountLicenseLock(hotInstance, LOCK_CONTENT.trial_expired_hard, { deferActivation: isInitialMount });
  }

  if (lifecycle.state === 'sub_expired_hard') {
    if (getProductMode(grants, HANDSONTABLE_PRODUCT) !== 'internal') {
      return null;
    }

    return mountLicenseLock(hotInstance, LOCK_CONTENT.sub_expired_hard, { deferActivation: isInitialMount });
  }

  return mountLicenseBadge(hotInstance, lifecycle);
}

/**
 * Initializes the license branding UI (the corner badge, its popovers, and the hard-stop lock
 * screen) for the resolved license state. The `*.handsontable.com` bypass is already resolved by
 * `_getLicenseState`. Runs once for the root instance.
 *
 * The surface follows RUNTIME KEY CHANGES: when `updateSettings({ licenseKey })` supplies a
 * different key, the current surface unmounts and the new state's surface mounts - a customer who
 * buys a license must never stay locked (or badged) until a page reload. The re-resolution is
 * memoized on the key string, because resolving checksums the whole key (SHA-512) - a settings
 * update that does not touch the key costs one string comparison. A user's dismissal of the
 * closable subscription lock naturally survives settings updates: nothing remounts while the key
 * is unchanged.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @returns {void}
 */
export function initLicenseBranding(hotInstance: HotInstance): void {
  const resolveState = () => {
    // Bare on purpose - see the matching comment in `initLicenseNotification`: a `typeof process`
    // guard breaks the build-time replacement in browser bundles.
    const releaseDate = process.env.HOT_RELEASE_DATE || '';

    return _getLicenseState(hotInstance.getSettings().licenseKey, releaseDate);
  };

  let currentKey = hotInstance.getSettings().licenseKey;
  let unmountSurface = mountBrandingSurface(hotInstance, resolveState(), true);

  hotInstance.addHook('afterUpdateSettings', () => {
    const key = hotInstance.getSettings().licenseKey;

    if (key === currentKey) {
      return;
    }

    currentKey = key;
    unmountSurface?.();
    unmountSurface = mountBrandingSurface(hotInstance, resolveState(), false);
  });
}
