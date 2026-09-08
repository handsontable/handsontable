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
 * The pixels the summed row heights fall short of the rendered body's real height, because the FIRST
 * rendered body row draws its own 1px `border-top` and the sum reports every row at its logical
 * height.
 *
 * `1` only when that border exists: a grid with column headers hands the gridline under the header
 * to the header's own `border-bottom` at every scroll position (DEV-2786), so no body row draws a top
 * border; and AutoRowSize (`externalRowCalculator`) measures rendered heights, so the pixel is
 * already in its sums either way.
 *
 * Two call sites must agree on this to the pixel or a grid predicts a scrollbar it does not get:
 * `SpreaderSize#adjustElementsSize`, which writes the hider height, and `gatherLayoutInput`, which
 * predicts the scrollbars from the same total before the DOM is written.
 *
 * @param {boolean} hasExternalRowCalculator The `externalRowCalculator` setting (AutoRowSize).
 * @param {boolean} hasColumnHeaders Whether the grid renders any column header row.
 * @returns {number}
 */
export function getFirstRowBorderCompensation(
  hasExternalRowCalculator: boolean,
  hasColumnHeaders: boolean
): number {
  return (hasExternalRowCalculator || hasColumnHeaders) ? 0 : 1;
}
