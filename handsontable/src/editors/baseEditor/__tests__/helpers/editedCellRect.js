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
 *   returns the expected rect partial for the active theme (use `layout.e2eGcr_*` helpers). Pass
 *   `getE2eDocumentViewport()` into helpers that need `scrollLeft` / `offsetHeight`.
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
