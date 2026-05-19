/**
 * Row-header offsetWidth for a nested-rows level-0 header.
 *
 * The `45` constant is NOT a theme value: it is the pixel budget reserved by the test
 * fixture's CSS for the nesting indicator and collapse chevron rendered inside the TH.
 * The remaining `2 * cellHorizontalPadding` is the TH's left+right cell padding.
 *
 * Formula: `(2 * layout.cellHorizontalPadding) + 45`.
 *
 * @param {object} layout Theme layout from `getThemeLayout()`.
 * @returns {number}
 */
export function nestedRowsLevel0HeaderWidth(layout) {
  return (2 * layout.cellHorizontalPadding) + 45;
}

/**
 * Row-header offsetWidth for a nested-rows level-1 header (one extra indent level vs level-0).
 *
 * The `65` constant is NOT a theme value: it is the pixel budget reserved by the test
 * fixture's CSS for the nesting indicator, collapse chevron, and one level of indentation
 * (adds 20px to the level-0 45px budget). The remaining `2 * cellHorizontalPadding` is the
 * TH's left+right cell padding.
 *
 * Formula: `(2 * layout.cellHorizontalPadding) + 65`.
 *
 * @param {object} layout Theme layout from `getThemeLayout()`.
 * @returns {number}
 */
export function nestedRowsLevel1HeaderWidth(layout) {
  return (2 * layout.cellHorizontalPadding) + 65;
}
