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
 * is a prerequisite for the S16 hider math, which sizes the hider from the cache total and must agree
 * with the sum of the pixel heights the renderer actually wrote.
 *
 * NOTE: this is the row-height compensation only. `markOversizedRows` (deleted in S14) carries a second
 * constant of the OPPOSITE polarity (`firstRowBorderCompensation`) for the first row's top border — do
 * not route that one through here.
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
