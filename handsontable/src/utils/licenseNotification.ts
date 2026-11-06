import {
  _injectProductInfo,
  _getLicenseState,
  _buildMissingFeaturesMessage,
  _createLicenseBar,
  _createLicenseBarBlock,
  _renderMessageParts,
} from '../helpers/mixed';
import { throwWithCause } from '../helpers/errors';
import { error } from '../helpers/console';
import { empty } from '../helpers/dom/element';
import { LAYOUT_SLOTS, SLOT_ITEM_CLASS } from '../core/layout/constants';
import { refreshSlotFilledState } from '../core/layout/layoutManager';
import { isRootInstance } from './rootInstance';
import { POWERED_BY_CLASS } from './licenseBranding/poweredByBar';
import {
  forgetMissingCapabilities,
  hasLicenseCapability,
  hasMissingCapabilities,
  isPluginLicense,
  reportMissingCapability,
  pruneMissingCapabilities,
  takeChangedMissingCapabilities,
} from './licenseCapabilities';
import type { PluginLicense } from './licenseCapabilities';
import type { MessagePart } from '../helpers/mixed';
import type { HotInstance } from '../core/types';

const SCOPE_ID = 'licenseNotification';
const SHORTCUTS_CONTEXT_NAME = `plugin:${SCOPE_ID}`;

export const LICENSE_INFO_CLASS = 'hot-display-license-info';

/**
 * The class of the bar block that names the features the license key left out. It sits inside the one
 * license bar of the grid, next to any lifecycle message.
 */
export const MISSING_FEATURES_CLASS = `${LICENSE_INFO_CLASS}_missing-features`;

/**
 * The order index of the `afterUpdateSettings` listener that writes the message: after every plugin's
 * own listener (default order), so one `updateSettings()` call writes one message for all the features
 * it turned off.
 */
const FLUSH_ORDER_INDEX = 1000;

/**
 * The console messages already printed, per key and set of missing features. Page-wide, like the
 * other license console messages: two grids with the same key and the same missing features print once.
 */
const printedMissingFeatures = new Set<string>();

/**
 * The license bar each grid built for the missing-features message, kept while it is out of the page.
 */
const ownBars = new WeakMap<HotInstance, HTMLElement>();
/**
 * The root grids that reached the `init` hook, where every plugin has had its init turn and its ready step. A
 * flush waits for it, for two reasons. A gated call made while the grid is still being built (an
 * `afterLoadData` listener) would otherwise mount a bar and register its focus scope before the lifecycle
 * bar, which registers the same scope id again and throws. And a flush before it (a settings pass or a gated
 * call made from a hook that runs first) would print a short list, and the `init` write a second, longer one.
 */
const readyGrids = new WeakSet<HotInstance>();

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
 * Puts a license bar last in the bottom slot, in front of the "Powered by" bar when the grid has one
 * (`POWERED_BY_CLASS`), so the branding stays the last line. It carries the shared slot-item class, so
 * it gets the same separator styling as registered slot items. Because it is a foreign (unregistered)
 * node, `DomSlot` always inserts registered items before it, keeping it last as other contributors (for
 * example pagination) register or reorder. The bar bypasses `DomSlot`, so the wrapper's slot-filled
 * state class (kept in sync by the `LayoutManager` for registered items) is refreshed here.
 *
 * @param {HTMLElement} container The bottom slot.
 * @param {HTMLElement} barElement The license bar.
 */
function appendBarLast(container: HTMLElement, barElement: HTMLElement): void {
  const poweredByBar = Array.from(container.children)
    .find(child => child.classList.contains(POWERED_BY_CLASS)) ?? null;

  barElement.classList.add(SLOT_ITEM_CLASS);
  container.insertBefore(barElement, poweredByBar);
  refreshSlotFilledState(LAYOUT_SLOTS.BOTTOM, container);
}

/**
 * Mounts a license bar as the last element of the bottom slot and registers a focus scope so
 * keyboard navigation (Tab/Shift+Tab) includes its links. Two callers: the built-in notification below
 * (an expired key, a past maintenance date, and a soft-stopped trial), and the missing-features message
 * when no lifecycle message holds the bar (`showMissingFeaturesInBar`).
 *
 * The bar is intentionally a foreign node, NOT registered with the LayoutManager: registering it would
 * expose it to the user's `layout` setting (reorder/remove) and to `DomSlot.clear()`, but a license
 * notice must always sit last and must not be user-removable. It carries the slot-item class and
 * refreshes the slot-filled state by hand, exactly as the layout module documents foreign nodes do.
 *
 * At most one license bar exists per grid - a key is in exactly one lifecycle state, and the
 * missing-features message joins a bar that already exists instead of mounting a second one - so the
 * single `licenseNotification` scope is never contended.
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

  appendBarLast(container, barElement);

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
            focusableElements[0]?.focus();
          } else if (focusSource === 'tab_from_below') {
            focusableElements[focusableElements.length - 1]?.focus();
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
  // DO NOT wrap this in a `typeof process` guard (or any `process` existence check). The bundler
  // replaces the whole `process.env.HOT_RELEASE_DATE` expression with a string literal at build time,
  // so the bare read never touches a runtime `process` object and cannot crash. A guard is NOT
  // inlined - it survives as `typeof process !== 'undefined' && "..."`, which is `false` in every
  // browser bundle, blanks the release date, and silently kills expired-key detection. That was the
  // 18.0.0 regression this read restores; re-adding the guard reintroduces it.
  const releaseDate = process.env.HOT_RELEASE_DATE || '';

  const notificationElement = _injectProductInfo({
    className: LICENSE_INFO_CLASS,
    key: licenseKey,
    element: container,
    releaseDate
  });

  if (notificationElement) {
    // `_injectProductInfo` already appended this element into the bottom slot and returned it;
    // `mountBottomLicenseBar` re-appends it as the last child and wires the focus scope.
    mountBottomLicenseBar(hotInstance, notificationElement);
  }

  // The first write waits for the `init` hook: every plugin has had its init turn and its ready step by then
  // (CheckboxHeader checks its columns there), so one message names them all, and the bar is in the page
  // before the first render sizes the grid. Every write asked for before it (`readyGrids`) is left to this
  // one. Later passes (`updateSettings()`) write theirs once every plugin has handled the pass.
  hotInstance.addHookOnce('init', () => {
    readyGrids.add(hotInstance);
    flushMissingCapabilities(hotInstance);
  });
  hotInstance.addHook('afterUpdateSettings', () => flushMissingCapabilities(hotInstance), FLUSH_ORDER_INDEX);
}

/**
 * Writes the features the license key of a root grid keeps off, when the list changed since the last call:
 * the text in the license bar, and one console error when a feature was added. The console message prints
 * once per key and set of features on the page. `no-console-warns` and `no-ui-warns` close the two
 * surfaces; the features stay off either way. Does nothing before the grid's `init` hook: the write made
 * there names everything reported until then.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 */
export function flushMissingCapabilities(hotInstance: HotInstance): void {
  if (hotInstance.isDestroyed || !isRootInstance(hotInstance) || !readyGrids.has(hotInstance)) {
    return;
  }

  pruneMissingCapabilities(hotInstance);

  // A key passed later that leaves nothing out, or options turned off until nothing is missing, takes
  // the message away.
  if (!hasMissingCapabilities(hotInstance)) {
    forgetMissingCapabilities(hotInstance);
    hideMissingFeaturesInBar(hotInstance);

    return;
  }

  const missing = takeChangedMissingCapabilities(hotInstance);

  if (missing === null) {
    return;
  }

  const { channels } = _getLicenseState(missing.key);
  const { text, parts } = _buildMissingFeaturesMessage(missing.features);
  const printedKey = `${missing.key}\n${missing.features.map(({ capability }) => capability).join(',')}`;

  // A list that only got shorter updates the bar: nothing new is missing, so the console stays quiet.
  if (channels.console && missing.added && !printedMissingFeatures.has(printedKey)) {
    printedMissingFeatures.add(printedKey);
    error(text);
  }

  if (channels.ui) {
    showMissingFeaturesInBar(hotInstance, parts);
  } else {
    hideMissingFeaturesInBar(hotInstance);
  }
}

/**
 * Checks the license token of a plugin that is on in every grid (`gate: 'call'`) before one of its public
 * methods does any work. A call the key does not cover writes the message and throws it.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {PluginLicense} [license] The plugin's license (its static `LICENSE`).
 */
export function assertLicensedCall(hotInstance: HotInstance, license: PluginLicense | undefined): void {
  if (!isPluginLicense(license) || hasLicenseCapability(hotInstance, license.capability)) {
    return;
  }

  reportMissingCapability(hotInstance, license);
  flushMissingCapabilities(hotInstance);
  throwWithCause(_buildMissingFeaturesMessage([license]).text);
}

/**
 * Tells whether a plugin that is on in every grid (`gate: 'call'`) may act for a feature that is asked for
 * while the grid renders, where a throw would break the render (the CheckboxHeader header checkbox). A
 * feature the key does not cover is reported, and the message is written in a microtask, after the render.
 *
 * @param {HotInstance} hotInstance The Handsontable instance.
 * @param {PluginLicense} [license] The plugin's license (its static `LICENSE`).
 * @returns {boolean} `true` if the key covers the feature.
 */
export function isLicensedUse(hotInstance: HotInstance, license: PluginLicense | undefined): boolean {
  if (!isPluginLicense(license) || hasLicenseCapability(hotInstance, license.capability)) {
    return true;
  }

  if (reportMissingCapability(hotInstance, license)) {
    hotInstance._registerMicrotask(() => flushMissingCapabilities(hotInstance));
  }

  return false;
}

/**
 * Shows the missing features in the license bar of a grid. A grid has one license bar: a bar that
 * already carries a lifecycle message gets the text as a second block, and a grid with no bar gets one.
 * A later call replaces the block's text. The bar made here is kept for the grid's life (`ownBars`):
 * its focus scope is registered once, and registering the same scope again throws, so a bar taken out
 * by `hideMissingFeaturesInBar()` is put back rather than built again.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 * @param {Array} parts The message parts.
 */
function showMissingFeaturesInBar(hotInstance: HotInstance, parts: MessagePart[]): void {
  const container = hotInstance.rootSlotBottomElement;

  if (!container) {
    return;
  }

  const ownerDocument = container.ownerDocument;
  let bar = getNotificationElement(hotInstance);

  if (!bar) {
    bar = ownBars.get(hotInstance) ?? null;

    if (bar) {
      appendBarLast(container, bar);
    } else {
      bar = _createLicenseBar(ownerDocument, LICENSE_INFO_CLASS);
      mountBottomLicenseBar(hotInstance, bar);
      ownBars.set(hotInstance, bar);
    }
  }

  const block = bar.querySelector<HTMLElement>(`.${MISSING_FEATURES_CLASS}`);

  if (block) {
    empty(block);
    _renderMessageParts(block, parts, ownerDocument);
  } else {
    bar.appendChild(_createLicenseBarBlock(ownerDocument, LICENSE_INFO_CLASS, parts, MISSING_FEATURES_CLASS));
  }
}

/**
 * Takes the missing-features message out of a grid's license bar, when the key passed last leaves nothing
 * out or keeps the bar shut (`no-ui-warns`). A bar that holds no lifecycle message then leaves the page; it
 * stays in `ownBars`, so its focus scope, which reads whether the bar is in the page, simply stands aside.
 *
 * @param {HotInstance} hotInstance The root Handsontable instance.
 */
function hideMissingFeaturesInBar(hotInstance: HotInstance): void {
  const bar = getNotificationElement(hotInstance);
  const block = bar?.querySelector<HTMLElement>(`.${MISSING_FEATURES_CLASS}`);

  if (!bar || !block) {
    return;
  }

  block.remove();

  if (bar.querySelector(`.${LICENSE_INFO_CLASS}_inner`) === null) {
    const container = bar.parentElement;

    bar.remove();

    if (container) {
      refreshSlotFilledState(LAYOUT_SLOTS.BOTTOM, container);
    }
  }
}
