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
 * How tall the frozen (inline-start) overlay is allowed to be.
 */
export interface FrozenOverlaySize {
  /**
   * Height of the overlay's root element.
   */
  height: number;
  /**
   * How much shorter than the root the overlay's holder must be. Non-zero only for an overlay
   * scrollbar: the root keeps covering the strip (so the master's cells cannot show through it) while
   * the holder stops above it, and CSS makes the uncovered strip pass presses to the master.
   */
  holderClearance: number;
}

/**
 * Resolves how tall the frozen (inline-start) overlay may be without swallowing the master's
 * horizontal scrollbar.
 *
 * Three cases:
 * - No horizontal scrollbar: the overlay takes the whole workspace.
 * - An overlay ("floating") scrollbar: it takes no space, so the browser never shrinks the master
 *   holder and `clientHeight` cannot describe it. The root stays full height and the holder gives up a
 *   strip, which is what lets the press through to the scrollbar underneath (#10370).
 * - A classic scrollbar: prefer the master holder's own inner height, which accounts for the scrollbar
 *   at the browser's sub-pixel accuracy and so keeps the two panes' scroll ranges equal (#12632).
 */
export function resolveFrozenOverlayHeight(input: FrozenOverlayHeightInput): FrozenOverlaySize {
  const {
    workspaceHeight,
    hasHorizontalScroll,
    scrollbarWidth,
    hasOverlayScrollbar,
    getMasterClientHeight,
  } = input;

  if (!hasHorizontalScroll) {
    return { height: workspaceHeight, holderClearance: 0 };
  }

  if (scrollbarWidth === 0 && hasOverlayScrollbar) {
    return { height: workspaceHeight, holderClearance: OVERLAY_SCROLLBAR_CLEARANCE };
  }

  const masterClientHeight = getMasterClientHeight();

  return {
    height: masterClientHeight > 0 ? masterClientHeight : workspaceHeight - scrollbarWidth,
    holderClearance: 0,
  };
}
