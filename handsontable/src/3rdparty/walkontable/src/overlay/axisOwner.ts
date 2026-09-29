import { getTrimmingContainer, isHTMLElement, type OverflowAxis } from '../../../../helpers/dom/element';

export type { OverflowAxis };

/**
 * The value of the `preventOverflow` setting. `'horizontal'` and `'vertical'` name the axis whose
 * overflow the grid keeps inside its own box; `true` only suppresses the window-mode overflow reset
 * in `MasterTable`; `false` leaves every axis to the DOM.
 */
export type PreventOverflowSetting = 'horizontal' | 'vertical' | boolean;

/**
 * Checks whether the `preventOverflow` setting forces the given axis to be owned by the grid's own
 * box instead of whatever the DOM resolves. `'horizontal'` prevents horizontal overflow, so it
 * forces the `x` axis; `'vertical'` forces the `y` axis.
 *
 * @param {OverflowAxis} axis The axis to check.
 * @param {PreventOverflowSetting} preventOverflow The `preventOverflow` setting value.
 * @returns {boolean}
 */
export function isAxisForcedByPreventOverflow(axis: OverflowAxis, preventOverflow: PreventOverflowSetting): boolean {
  return (preventOverflow === 'horizontal' && axis === 'x') || (preventOverflow === 'vertical' && axis === 'y');
}

/**
 * Resolves the element that owns scrolling on one axis: the nearest ancestor of the Walkontable root
 * whose `overflow-x` (or `overflow-y`) traps the table on that axis, or the window when no ancestor
 * does. The two axes are resolved independently, so a root element that clips only the horizontal
 * axis (`overflow-x: clip`, which core writes for a definite `width` with no sized `height`) owns the
 * horizontal axis while the window keeps the vertical one.
 *
 * `preventOverflow` is folded in as a forced answer: the axis it names is owned by the Walkontable
 * root's parent (the grid's root element) whatever its overflow says. That is the whole of the legacy
 * option's meaning inside the engine — every other behavior it used to switch follows from the axis
 * owners.
 *
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {OverflowAxis} axis The axis to resolve.
 * @param {PreventOverflowSetting} preventOverflow The `preventOverflow` setting value.
 * @returns {HTMLElement | Window}
 */
export function resolveAxisOwner(
  wtRootElement: HTMLElement,
  axis: OverflowAxis,
  preventOverflow: PreventOverflowSetting,
): HTMLElement | Window {
  const { parentElement } = wtRootElement;

  if (parentElement && isAxisForcedByPreventOverflow(axis, preventOverflow)) {
    return parentElement;
  }

  return getTrimmingContainer(wtRootElement, axis);
}

/**
 * Resolves the grid's root element when it bounds the holder width next to the horizontal owner.
 *
 * An element that owns the horizontal axis sizes the holder to its own box, which is the grid's box
 * only when the grid fills it edge to edge. An owner further up the tree can be wider than the grid:
 * its own padding, a padded wrapper between the two, or a relative `width` under 100% all leave the
 * grid narrower. A holder as wide as the owner then overflows the grid by the difference, and
 * `.ht_master`, which clips at the grid's own width, cuts off the grid's inline-end edge. When the host
 * sized the grid as a plain block (`widthFollowsRoot`), the grid's root element – the Walkontable
 * root's parent, the element `preventOverflow` forces an axis to – bounds the width as well, the way
 * `resolveRootWidthBound()` resolves it.
 *
 * @param {HTMLElement} wtRootElement The Walkontable root element (`.ht_master`).
 * @param {HTMLElement | Window} ownerX The owner of the horizontal axis.
 * @param {boolean} widthFollowsRoot The `widthFollowsRoot` setting value.
 * @returns {HTMLElement | null} The grid's root element, or `null` when the owner alone bounds the
 * width: the setting is off, the window owns the axis, or the root element is the owner itself.
 */
export function resolveWidthBoundingRoot(
  wtRootElement: HTMLElement,
  ownerX: HTMLElement | Window,
  widthFollowsRoot: boolean,
): HTMLElement | null {
  const { parentElement } = wtRootElement;

  if (!widthFollowsRoot || !parentElement || !isHTMLElement(ownerX) || ownerX === parentElement) {
    return null;
  }

  return parentElement;
}
