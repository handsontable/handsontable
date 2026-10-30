/**
 * What an edge slot's width is decided from, read from the grid once per render.
 */
export interface EdgeSlotWidthInput {
  /**
   * Whether the window owns the horizontal axis (no `width` option, no scrollable parent).
   */
  isWindowAxis: boolean;
  /**
   * The width of the table drawn.
   */
  tableWidth: number;
  /**
   * The width of the grid's own box, which the slot follows when the root owns the axis.
   */
  workspaceWidth: number;
  /**
   * The root wrapper's `offsetWidth`, the fallback for a grid that draws no column.
   */
  wrapperOffsetWidth: number;
  /**
   * The root wrapper's `clientWidth`, the most the slot may take while the window owns the axis.
   */
  wrapperClientWidth: number;
  /**
   * Whether the grid draws at least one column.
   */
  hasRenderedColumns: boolean;
  /**
   * Whether an element registered in the slot asked to fill the wrapper's width
   * (`LayoutRegisterOptions#fillsWrapperWidth`).
   */
  fillsWrapperWidth: boolean;
}

/**
 * The widths core writes for an edge slot: the slot's own, and the width its other elements keep while an
 * element that fills the wrapper widens the slot past the table (`null` when they take the slot's width).
 */
export interface EdgeSlotWidth {
  slotWidth: number;
  itemWidth: number | null;
}

/**
 * Resolves an edge slot's width. The slot aligns with the TABLE (a narrow table gets a narrow bar), and never
 * runs past the wrapper while the WINDOW owns the horizontal axis: the table can then be wider than its
 * CSS-sized container. With a definite `width` option the root owns the axis and the slot follows the grid's
 * own box. A grid with no column drawn takes the wrapper's width.
 *
 * An element that fills the wrapper (the sheets bar: workbook navigation, not a table footer) widens the slot
 * to the wrapper while the window owns the axis and the table is narrower. The other elements of that slot keep
 * the table's width (`itemWidth`), so a pager still lines up with the table.
 *
 * @param {object} input What the width is decided from.
 * @returns {object} The slot's width, and the width its other elements keep.
 */
export function resolveEdgeSlotWidth(input: EdgeSlotWidthInput): EdgeSlotWidth {
  const { isWindowAxis, wrapperClientWidth } = input;
  let width = isWindowAxis ? input.tableWidth : input.workspaceWidth;

  if (width === 0 || (isWindowAxis && !input.hasRenderedColumns)) {
    width = input.wrapperOffsetWidth;
  }

  if (isWindowAxis && wrapperClientWidth > 0) {
    width = Math.min(width, wrapperClientWidth);
  }

  if (input.fillsWrapperWidth && isWindowAxis && wrapperClientWidth > width) {
    return { slotWidth: wrapperClientWidth, itemWidth: width };
  }

  return { slotWidth: width, itemWidth: null };
}
