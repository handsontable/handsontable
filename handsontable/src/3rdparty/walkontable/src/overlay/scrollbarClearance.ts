import { addClass, removeClass } from '../../../../helpers/dom/element';
import { isFirefox } from '../../../../helpers/browser';
import { OVERLAY_SCROLLBAR_CLEARANCE, OVERLAY_SCROLLBAR_CLEARANCE_CLASS } from './constants';

/**
 * Firefox paints an overlay ("floating") scrollbar over the content and reserves no space for it, so
 * the browser never shrinks the master holder and `getScrollbarWidth()` reports 0. A frozen overlay
 * sized to the full holder then covers the scrollbar, hiding it and swallowing the press (#10370).
 *
 * Other engines that report 0 - macOS Chrome/Safari, headless Chrome - composite their scrollbar above
 * the overlays and need no clearance, so they are deliberately excluded.
 *
 * @param {number} scrollbarWidth The measured scrollbar width, from `getScrollbarWidth()`.
 * @param {boolean} axisScrolls Whether the axis this overlay would cover actually scrolls.
 * @returns {number} The strip to keep clear, in pixels, or 0 when none is needed.
 */
export function overlayScrollbarClearance(scrollbarWidth: number, axisScrolls: boolean): number {
  if (!axisScrolls || scrollbarWidth !== 0 || !isFirefox()) {
    return 0;
  }

  return OVERLAY_SCROLLBAR_CLEARANCE;
}

/**
 * Subtracts a clearance from an inline CSS length, keeping the `px` suffix and leaving the empty
 * string ("size me automatically") untouched.
 *
 * @param {string} cssSize The inline size to shrink.
 * @param {number} clearance The strip to subtract, in pixels.
 * @returns {string}
 */
export function insetCssSize(cssSize: string, clearance: number): string {
  if (clearance === 0 || cssSize === '') {
    return cssSize;
  }

  return `${Math.max(0, parseFloat(cssSize) - clearance)}px`;
}

/**
 * Marks (or unmarks) an overlay root as leaving a clearance strip. The styles keyed off the class keep
 * the root opaque over the strip, so the master's scrolled cells cannot show through it, and let a
 * press in the strip reach the master's scrollbar underneath.
 *
 * @param {HTMLElement} overlayRoot The overlay's root element.
 * @param {boolean} active Whether a clearance strip is being left.
 */
export function toggleScrollbarClearance(overlayRoot: HTMLElement, active: boolean): void {
  if (active) {
    addClass(overlayRoot, OVERLAY_SCROLLBAR_CLEARANCE_CLASS);
  } else {
    removeClass(overlayRoot, OVERLAY_SCROLLBAR_CLEARANCE_CLASS);
  }
}
