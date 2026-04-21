/**
 * Width and height for {@link BaseEditor#getEditedCellRect} (outer box + border compensation),
 * derived from the active editor TD. Matches BaseEditor#getEditedCellRect math for any theme.
 *
 * @returns {{ width: number, height: number }}
 */
export function activeEditorEditedCellRectWidthHeightFromTd() {
  const editor = getActiveEditor();
  const hotInstance = hot();
  const TD = editor.TD;
  const rootWindow = hotInstance.rootWindow;
  const cs = rootWindow.getComputedStyle(TD);
  const borderPhysicalWidthProp = hotInstance.isRtl() ? 'borderRightWidth' : 'borderLeftWidth';
  const inlineStartBorderCompensation = parseInt(cs[borderPhysicalWidthProp], 10) > 0 ? 0 : 1;
  const topBorderCompensation = parseInt(cs.borderTopWidth, 10) > 0 ? 0 : 1;

  return {
    width: Handsontable.dom.outerWidth(TD) + inlineStartBorderCompensation,
    height: Handsontable.dom.outerHeight(TD) + topBorderCompensation,
  };
}

/**
 * Returns the data needed to assert that `BaseEditor#getEditedCellRect()` matches a theme-specific
 * partial rect. Specs write their own `expect()` calls so failures point to the spec line and
 * the intent is visible at the call site.
 *
 * @param {function(object): object} buildExpected Receives the layout from `getThemeLayout()` and
 *   returns the expected rect partial for the active theme (use `rtlEditorRect*` helpers below).
 *   Pass `getE2eDocumentViewport()` into helpers that need `scrollLeft` / `offsetHeight`.
 * @returns {{ rect: object, expected: object, wh: { width: number, height: number } }}
 *   `rect` is the editor's reported rect, `expected` is the theme-specific partial, and `wh`
 *   is the live TD width/height to merge into the expectation.
 */
export function getEditedCellRectExpectation(buildExpected) {
  const expected = buildExpected(getThemeLayout());
  const wh = activeEditorEditedCellRectWidthHeightFromTd();
  const rect = getActiveEditor().getEditedCellRect();

  return { rect, expected, wh };
}

/**
 * `baseEditor/rtl/API.spec.js` -- `getEditedCellRect` partial when editing the 234th column.
 * The column start is always 234 (test configuration, not a theme value). `top` is the height
 * of the first data row (one row header above). `width` / `maxWidth` describe one TD outer
 * width (walkontable default column + one cell border). `height` describes one TD outer height.
 *
 * @param {object} layout Theme layout from `getThemeLayout()`.
 * @returns {{ start: number, top: number, width: number, maxWidth: number, height: number }}
 */
export function rtlEditorRectAtColumnStart234(layout) {
  const colOuter = layout.defaultColumnWidth + layout.cellBorderWidth;

  return {
    start: 234, // fixed left-column-start from the test configuration, not a theme value
    top: layout.defaultDataRowHeight,
    width: colOuter,
    maxWidth: colOuter,
    height: layout.cellContentHeight + (2 * layout.cellBorderWidth),
  };
}

/**
 * `baseEditor/rtl/API.spec.js` -- `getEditedCellRect` partial for the far-right column at pixel
 * offset 4949 (test configuration, not a theme value), snapped to the bottom of the viewport.
 * `top` is the viewport offsetHeight minus the snap pad (one outer data row plus two cell
 * borders).
 *
 * @param {object} layout Theme layout from `getThemeLayout()`.
 * @param {object} docViewport Viewport metrics from `getE2eDocumentViewport()`.
 * @returns {{ start: number, top: number, width: number, maxWidth: number, height: number }}
 */
export function rtlEditorRectAtColumnStart4949SnapBottom(layout, docViewport) {
  const { offsetHeight } = docViewport;
  const topSnapPad = layout.defaultDataRowHeight + (2 * layout.cellBorderWidth);
  const colOuter = layout.defaultColumnWidth + layout.cellBorderWidth;

  return {
    start: 4949, // fixed right-column-start from the test configuration, not a theme value
    top: offsetHeight - topSnapPad,
    width: colOuter,
    maxWidth: colOuter,
    height: layout.cellContentHeight + (2 * layout.cellBorderWidth),
  };
}
