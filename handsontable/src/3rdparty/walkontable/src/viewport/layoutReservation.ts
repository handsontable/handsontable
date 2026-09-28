/**
 * The smallest height the table keeps of a vertical axis owner's box after the host's layout slots
 * (the `layoutReservedHeight` setting) took theirs. One pixel, not zero: at zero the holder collapses,
 * `hasTableHeight` reads `false`, and the overlays stop repositioning, so a container briefly
 * shorter than its bar (a collapsing panel) would blank the grid instead of showing a sliver. Both
 * sizing paths (`measureWorkspaceHeight` and the master table's holder height) floor here, so they
 * cannot disagree once the bar is taller than the box (DEV-2848).
 */
export const MIN_RESERVED_LAYOUT_HEIGHT = 1;

/**
 * Hands the table what is left of an axis owner's box after the host's layout slots took theirs.
 *
 * The floor applies only to a real subtraction. With nothing reserved the box passes through
 * untouched, and a zero-height box stays zero: that `0` is how the master table signals an owner
 * with no defined size (`hasDefinedSize()`, the `#3119` fallback), and a slot cannot take room from
 * a box that has none.
 *
 * @param {number} ownerHeight The owner's box height.
 * @param {number} reservedHeight The height the host reserves inside that box.
 * @returns {number}
 */
export function subtractReservedHeight(ownerHeight: number, reservedHeight: number): number {
  if (reservedHeight <= 0 || ownerHeight <= 0) {
    return ownerHeight;
  }

  return Math.max(ownerHeight - reservedHeight, MIN_RESERVED_LAYOUT_HEIGHT);
}
