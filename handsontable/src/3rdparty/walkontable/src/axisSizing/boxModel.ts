/**
 * The row box-model relationship between a row's logical height and the pixel height written to the
 * DOM. Pure functions of the border-box flag (`stylesHandler.areCellsBorderBox()`), so they carry no
 * DOM or engine dependency and are unit-testable directly.
 *
 * The size caches store the LOGICAL row height (the value the calculators and `sumCellSizes` sum). The
 * renderer writes a slightly different PIXEL height to each row element: in content-box mode it writes
 * `logical - 1`, because that 1px is "replaced" by the row's 1px top border, so the row still occupies
 * `logical` px in the layout; in border-box mode the border is included and it writes `logical`. Either
 * way the rendered row occupies `logical` px, which is why the logical cache total already equals the
 * DOM-occupied total.
 *
 * Centralizing the 1px constant here keeps that equality true when the border model is edited later. It
 * also lets the hider math size the hider from the cache total and agree with the sum of the pixel
 * heights the renderer actually wrote.
 */

/**
 * The per-row border compensation in pixels: `1` in content-box mode (the row's 1px top border stands
 * in for the missing pixel), `0` in border-box mode (the border is inside the box).
 *
 * @param {boolean} isBorderBox Whether cells use `box-sizing: border-box` (`stylesHandler.areCellsBorderBox()`).
 * @returns {number}
 */
export function getRowBorderCompensation(isBorderBox: boolean): number {
  return isBorderBox ? 0 : 1;
}

/**
 * Converts a row's logical height to the pixel height the renderer writes to the row element.
 *
 * @param {number} logicalHeight The logical row height (as stored in the size cache).
 * @param {boolean} isBorderBox Whether cells use `box-sizing: border-box` (`stylesHandler.areCellsBorderBox()`).
 * @returns {number}
 */
export function getBoxAdjustedRowHeight(logicalHeight: number, isBorderBox: boolean): number {
  return logicalHeight - getRowBorderCompensation(isBorderBox);
}

/**
 * Whether the first rendered `<tr>` of a table draws its own 1px `border-top`, which makes it one pixel
 * taller than the other rows. It does when the table renders no head row: the
 * `thead:not(:empty) + tbody > tr:first-child` rule in `styles/base/_base.scss` hands the seam under a
 * column header to the header's own `border-bottom`, so a body row abutting a head row has no top border.
 * Per table, not per grid: the bottom clones render no head row, so their first row keeps the border (there it
 * is the bottom-freeze seam). `StylesHandler#firstRenderedRowDrawsTopBorder` is the grid-level form of the
 * same question, for the master's own row heights.
 *
 * @param {HTMLElement|null|undefined} thead The table's `<thead>`.
 * @returns {boolean}
 */
export function firstRowDrawsTopBorder(thead: HTMLElement | null | undefined): boolean {
  return !thead?.hasChildNodes();
}
