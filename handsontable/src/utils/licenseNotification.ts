import { _injectProductInfo } from '../helpers/mixed';
import type { HotInstance } from '../core/types';

const SCOPE_ID = 'licenseNotification';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;
const LICENSE_INFO_CLASS = 'hot-display-license-info';
const LAYOUT_WEIGHT = 200;

/**
 * Returns the license notification DOM element when present.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @returns {HTMLElement | null} The notification element or `null` when absent.
 */
function getNotificationElement(hotInstance: HotInstance): HTMLElement | null {
  return hotInstance.rootSlotBottomElement?.querySelector<HTMLElement>(`.${LICENSE_INFO_CLASS}`) ?? null;
}

/**
 * Returns focusable elements (links) within the license notification.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @returns {HTMLElement[]} The focusable elements within the notification.
 */
function getFocusableElements(hotInstance: HotInstance): HTMLElement[] {
  const notification = getNotificationElement(hotInstance);

  if (!notification) {
    return [];
  }

  return Array.from(notification.querySelectorAll<HTMLElement>('a[href]'));
}

/**
 * Initializes the built-in license notification: injects the product info message into the
 * bottom slot element when the license is invalid, expired, or missing, and registers
 * a focus scope so keyboard navigation (Tab/Shift+Tab) includes the notification links.
 * Only runs for the root Handsontable instance. Cannot be disabled by the user.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @returns {void}
 */
export function initLicenseNotification(hotInstance: HotInstance): void {
  const container = hotInstance.rootSlotBottomElement;

  if (!container) {
    return;
  }

  const licenseKey = hotInstance.getSettings().licenseKey;
  const releaseDate = typeof process !== 'undefined' && process.env?.HOT_RELEASE_DATE
    ? process.env.HOT_RELEASE_DATE
    : '';

  const notificationElement = _injectProductInfo({
    className: LICENSE_INFO_CLASS,
    key: licenseKey,
    element: container,
    releaseDate
  });

  if (!notificationElement) {
    return;
  }

  // `_injectProductInfo` appended this element into the bottom slot element and returned it; register
  // it under the layout slot so the `layout` setting and weights control its order relative to other
  // content.
  hotInstance.getLayoutManager()
    .register('licenseNotification', notificationElement, { side: 'bottom', weight: LAYOUT_WEIGHT });

  // The scope is intentionally never unregistered: the license notification is created once during
  // init, cannot be disabled, and lives for the whole instance lifetime. It is cleaned up when
  // `getFocusScopeManager().destroy()` runs on `hot.destroy()`.
  hotInstance.getFocusScopeManager()
    .registerScope(SCOPE_ID, notificationElement, {
      shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
      runOnlyIf: () => getNotificationElement(hotInstance) !== null,
      onActivate: (focusSource: string) => {
        const focusableElements = getFocusableElements(hotInstance);

        if (focusableElements.length > 0) {
          if (focusSource === 'tab_from_above') {
            focusableElements.at(0)?.focus();
          } else if (focusSource === 'tab_from_below') {
            focusableElements.at(-1)?.focus();
          }
        }
      },
    });
}
