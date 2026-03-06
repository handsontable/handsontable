import { _injectProductInfo } from '../helpers/mixed';

const SCOPE_ID = 'licenseNotification';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;
const LICENSE_INFO_CLASS = 'hot-display-license-info';

/**
 * Returns the license notification DOM element when present.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @returns {HTMLElement | null}
 */
function getNotificationElement(hotInstance) {
  return hotInstance.rootAfterGridElement?.querySelector(`.${LICENSE_INFO_CLASS}`) ?? null;
}

/**
 * Returns focusable elements (links) within the license notification.
 *
 * @param {Handsontable} hotInstance The Handsontable instance.
 * @returns {HTMLElement[]}
 */
function getFocusableElements(hotInstance) {
  const notification = getNotificationElement(hotInstance);

  if (!notification) {
    return [];
  }

  return Array.from(notification.querySelectorAll('a[href]'));
}

/**
 * Initializes the built-in license notification: injects the product info message into the
 * after-grid element when the license is invalid, expired, or missing, and registers
 * a focus scope so keyboard navigation (Tab/Shift+Tab) includes the notification links.
 * Only runs for the root Handsontable instance. Cannot be disabled by the user.
 *
 * @param {Handsontable} hotInstance The root Handsontable instance.
 */
export function initLicenseNotification(hotInstance) {
  const container = hotInstance.rootAfterGridElement;

  if (!container) {
    return;
  }

  const licenseKey = hotInstance.getSettings().licenseKey;
  const releaseDate = typeof process !== 'undefined' && process.env?.HOT_RELEASE_DATE
    ? process.env.HOT_RELEASE_DATE
    : '';

  _injectProductInfo(licenseKey, container, releaseDate);

  const notificationElement = getNotificationElement(hotInstance);

  if (!notificationElement) {
    return;
  }

  hotInstance.getFocusScopeManager()
    .registerScope(SCOPE_ID, notificationElement, {
      shortcutsContextName: SHORTCUTS_CONTEXT_NAME,
      runOnlyIf: () => getNotificationElement(hotInstance) !== null,
      onActivate: (focusSource) => {
        const focusableElements = getFocusableElements(hotInstance);

        if (focusableElements.length > 0) {
          if (focusSource === 'tab_from_above') {
            focusableElements.at(0).focus();
          } else if (focusSource === 'tab_from_below') {
            focusableElements.at(-1).focus();
          }
        }
      },
    });
}
