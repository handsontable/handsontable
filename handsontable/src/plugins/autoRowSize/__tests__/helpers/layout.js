/**
 * Expected cell height for `autoRowSize.spec.js` -- custom renderer that sets
 * `td.style.padding = '100px'` on row 1 col 0, with two lines of wrapped text.
 *
 * The `201` constant is NOT a theme value: it is `2 * 100px` custom padding from the
 * test renderer plus `1px` for the bottom cell border emitted by the test's CSS. The
 * remaining two lineHeights cover the two text lines that wrap inside the padded cell.
 *
 * Formula: `(2 * layout.lineHeight) + 201`.
 *
 * @param {object} layout Theme layout from `getThemeLayout()`.
 * @returns {number}
 */
export function autoRowSizeRowHeightWith100pxPadding(layout) {
  return (2 * layout.lineHeight) + 201;
}
