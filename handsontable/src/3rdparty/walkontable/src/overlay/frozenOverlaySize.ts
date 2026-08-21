import { OVERLAY_SCROLLBAR_CLEARANCE } from './constants';

/**
 * The inputs the frozen (inline-start) overlay height is derived from. `getMasterClientHeight` stays a
 * callback so the layout-forcing read is only taken on the branch that needs it.
 */
export interface FrozenOverlayHeightInput {
  workspaceHeight: number;
  hasHorizontalScroll: boolean;
  scrollbarWidth: number;
  hasOverlayScrollbar: boolean;
  getMasterClientHeight: () => number;
}

/**
 * Resolves the height the frozen (inline-start) overlay may take without covering the master's
 * horizontal scrollbar.
 *
 * Three cases:
 * - No horizontal scrollbar: the overlay takes the whole workspace.
 * - An overlay ("floating") scrollbar: it measures 0 and the browser reserves no space for it, so the
 *   master holder's `clientHeight` cannot describe it. Reserve a fixed strip, otherwise the overlay
 *   covers the scrollbar and blocks the drag under the frozen columns (#10370).
 * - A classic scrollbar: prefer the master holder's own inner height, which accounts for the scrollbar
 *   at the browser's sub-pixel accuracy and so keeps the two panes' scroll ranges equal (#12632).
 */
export function resolveFrozenOverlayHeight(input: FrozenOverlayHeightInput): number {
  const {
    workspaceHeight,
    hasHorizontalScroll,
    scrollbarWidth,
    hasOverlayScrollbar,
    getMasterClientHeight,
  } = input;

  if (!hasHorizontalScroll) {
    return workspaceHeight;
  }

  if (scrollbarWidth === 0 && hasOverlayScrollbar) {
    return workspaceHeight - OVERLAY_SCROLLBAR_CLEARANCE;
  }

  const masterClientHeight = getMasterClientHeight();

  return masterClientHeight > 0 ? masterClientHeight : workspaceHeight - scrollbarWidth;
}
