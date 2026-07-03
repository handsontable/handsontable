/**
 * Value objects for the single-pass layout resolution.
 *
 * `LayoutInput` is everything the layout math needs, expressed as plain numbers and enums — no DOM
 * nodes, no live reads. `LayoutSnapshot` is the immutable answer: whether each scrollbar will be
 * present after the draw, and the boxes that follow from that. Both are pure data so the solver
 * (`resolveLayout`) can be unit-tested without a browser.
 *
 * This module is intentionally free of any DOM or engine imports. Gathering the input from the live
 * DOM is the job of `createLayoutDeps`; consuming the snapshot is the job of the viewport (wired in a
 * later stage). Keeping the three concerns apart is what lets a caching or predictive adapter replace
 * the input-gathering step without touching the math.
 */

/**
 * How the table scrolls: inside its own element, or by scrolling the whole window/document.
 */
export type ScrollMode = 'window' | 'element';

/**
 * The CSS `overflow` behavior for one axis, narrowed to the three values that change the scrollbar
 * decision. `'auto'` means "a scrollbar appears only when the content overflows"; `'scroll'` forces
 * one; `'hidden'` forbids one.
 */
export type OverflowMode = 'auto' | 'scroll' | 'hidden';

/**
 * Window-mode metrics. In window mode the scrollbars belong to the document, and other page content
 * contributes to the document's scroll size, so the solver predicts the post-render document scroll
 * size by delta: `documentScrollHeight - currentHiderHeight + newHiderHeight`. These are only read in
 * window mode; in element mode the field is absent.
 */
export interface WindowLayoutContext {
  documentScrollWidth: number;
  documentScrollHeight: number;
  documentClientWidth: number;
  documentClientHeight: number;
  currentHiderWidth: number;
  currentHiderHeight: number;
}

/**
 * Everything the layout math needs, as pure data.
 */
export interface LayoutInput {
  scrollMode: ScrollMode;
  /**
   * The outer box the content plus our own scrollbars must fit into, in pixels. Stable and
   * scrollbar-independent by construction (it is the container box, not a post-render measurement).
   */
  workspaceWidth: number;
  workspaceHeight: number;
  /**
   * Total size of everything the table will render along each axis, from the prefix-sum caches plus
   * the header extents. `totalContentWidth` includes the row-header width; `totalContentHeight`
   * includes the column-header height.
   */
  totalContentWidth: number;
  totalContentHeight: number;
  /**
   * Thickness of one scrollbar, in pixels. `0` on overlay scrollbars (e.g. macOS trackpad mode).
   */
  scrollbarSize: number;
  overflowX: OverflowMode;
  overflowY: OverflowMode;
  /**
   * Width taken by the row headers, subtracted from the inner width to get the column viewport.
   */
  rowHeaderWidth: number;
  /**
   * Height taken by all column-header levels, subtracted from the inner height to get the row
   * viewport.
   */
  columnHeaderHeight: number;
  /**
   * Right-to-left layout. Carried through to the snapshot for downstream overlay placement; it does
   * not change whether scrollbars appear.
   */
  isRtl: boolean;
  /**
   * Present only in window mode (see `WindowLayoutContext`).
   */
  windowContext?: WindowLayoutContext;
}

/**
 * The immutable result of resolving a `LayoutInput`. Every field is a number or boolean known before
 * a single cell is written to the DOM, so the draw can render once in final geometry.
 */
export interface LayoutSnapshot {
  readonly scrollMode: ScrollMode;
  readonly hasVerticalScroll: boolean;
  readonly hasHorizontalScroll: boolean;
  /**
   * The stable outer box (equal to the input workspace box — scrollbar-independent).
   */
  readonly workspaceWidth: number;
  readonly workspaceHeight: number;
  /**
   * The outer box minus the scrollbar that the opposite axis consumes.
   */
  readonly innerWidth: number;
  readonly innerHeight: number;
  /**
   * The inner box minus the header extent — the area available for cells along each axis.
   */
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  /**
   * The viewport as the RENDER band sees it: the workspace box minus the header extent, WITHOUT
   * subtracting either scrollbar. The rendered band is kept scrollbar-unaware on purpose so it always
   * covers the strip a scrollbar will later sit over — that keeps `getCell` on the row/column under the
   * scrollbar returning a real TD, so native `scrollIntoView` still works. Wider/taller than the
   * scrollbar-aware `visibleViewport*` by exactly one scrollbar when the opposite axis scrolls.
   */
  readonly renderViewportWidth: number;
  readonly renderViewportHeight: number;
  /**
   * The viewport as the VISIBLE band sees it: the workspace box minus the header extent AND the
   * opposite-axis scrollbar when present. This scrollbar-aware area drives the fully/partially-visible
   * row and column counts and the scroll-to-cell decisions. Always equal to `viewportWidth` /
   * `viewportHeight` — the explicit name exists so consumers reading it beside `renderViewport*` state
   * intent; keep both.
   */
  readonly visibleViewportWidth: number;
  readonly visibleViewportHeight: number;
  readonly rowHeaderWidth: number;
  readonly columnHeaderHeight: number;
  readonly totalContentWidth: number;
  readonly totalContentHeight: number;
  /**
   * The size the hider element must take so its scrollable content matches the total content.
   */
  readonly hiderWidth: number;
  readonly hiderHeight: number;
  readonly scrollbarSize: number;
  readonly isRtl: boolean;
}
