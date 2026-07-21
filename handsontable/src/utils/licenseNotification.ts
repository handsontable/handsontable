import { _injectProductInfo } from '../helpers/mixed';
import { LAYOUT_SLOTS, SLOT_ITEM_CLASS } from '../core/layout/constants';
import { refreshSlotFilledState } from '../core/layout/layoutManager';
import type { HotInstance } from '../core/types';

const SCOPE_ID = 'licenseNotification';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;

export const LICENSE_INFO_CLASS = 'hot-display-license-info';

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
 * Mounts a license bar as the last element of the bottom slot and registers a focus scope so
 * keyboard navigation (Tab/Shift+Tab) includes its links. Shared by the built-in notification
 * (invalid/expired/missing/soft-stop) and the hard-stop fallback bar (shown when the Dialog plugin is
 * not in the bundle).
 *
 * The bar is intentionally a foreign node, NOT registered with the LayoutManager: registering it would
 * expose it to the user's `layout` setting (reorder/remove) and to `DomSlot.clear()`, but a license
 * notice must always sit last and must not be user-removable. It carries the slot-item class and
 * refreshes the slot-filled state by hand, exactly as the layout module documents foreign nodes do.
 *
 * At most one license bar exists at a time - a key is in exactly one lifecycle state - so both callers
 * can share the single `licenseNotification` scope without conflict.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {HTMLElement} barElement The license bar element to mount into the bottom slot.
 * @returns {void}
 */
export function mountBottomLicenseBar(hotInstance: HotInstance, barElement: HTMLElement): void {
  const container = hotInstance.rootSlotBottomElement;

  if (!container) {
    return;
  }

  // Append as the last child and carry the shared slot-item class so it gets the same separator
  // styling as registered slot items. Because it is a foreign (unregistered) node, `DomSlot` always
  // inserts registered items before it, keeping it last as other contributors (for example pagination)
  // register or reorder.
  barElement.classList.add(SLOT_ITEM_CLASS);
  container.appendChild(barElement);

  // The bar bypasses `DomSlot`, so the wrapper's slot-filled state class (kept in sync by the
  // `LayoutManager` for registered items) has to be refreshed here explicitly.
  refreshSlotFilledState(LAYOUT_SLOTS.BOTTOM, container);

  // The scope is intentionally never unregistered: the license bar is created once during init,
  // cannot be disabled, and lives for the whole instance lifetime. It is cleaned up when
  // `getFocusScopeManager().destroy()` runs on `hot.destroy()`.
  hotInstance.getFocusScopeManager()
    .registerScope(SCOPE_ID, barElement, {
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

/**
 * Initializes the built-in license notification: injects the product info message as the last
 * element of the bottom slot when the license is invalid, expired, or missing, and registers
 * a focus scope so keyboard navigation (Tab/Shift+Tab) includes the notification links.
 * Only runs for the root Handsontable instance. It is not a layout-slot contributor, so it cannot
 * be reordered, removed, or disabled by the user.
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
  // Read the build constant bare (no `typeof process` guard): the bundler replaces the whole
  // `process.env.HOT_RELEASE_DATE` expression with a literal at build time, while a guard compiles to
  // `typeof process !== 'undefined' && "..."` - false in every browser, which silently blanked the
  // release date and killed the expired-key detection in the built bundles.
  const releaseDate = process.env.HOT_RELEASE_DATE || '';

  const notificationElement = _injectProductInfo({
    className: LICENSE_INFO_CLASS,
    key: licenseKey,
    element: container,
    releaseDate
  });

  if (!notificationElement) {
    return;
  }

  // `_injectProductInfo` already appended this element into the bottom slot and returned it;
  // `mountBottomLicenseBar` re-appends it as the last child and wires the focus scope.
  mountBottomLicenseBar(hotInstance, notificationElement);
}
