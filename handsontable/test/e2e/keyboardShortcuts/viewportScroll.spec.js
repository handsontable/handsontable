describe('Core viewport scroll keyboard shortcuts', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  function getCurrentScrollPosition() {
    return {
      x: hot().view._wt.wtOverlays.inlineStartOverlay.getScrollPosition(),
      y: hot().view._wt.wtOverlays.topOverlay.getScrollPosition(),
    };
  }

  /**
   * Calculate the expected vertical scroll offset when Ctrl+Backspace centers a row
   * in a viewport of the given height (no column headers taken into account).
   *
   * @param {number} row - Target row index.
   * @param {number} viewportH - Viewport height in pixels.
   * @param {string} theme - Theme name passed to `calcRowHeight`.
   * @returns {number} Expected scroll-top value.
   */
  function calcCenterScrollY(row, viewportH, theme) {
    const rh = calcRowHeight(theme);

    return (row - (Math.ceil(Math.floor(viewportH / rh) / 2) - 1)) * rh;
  }

  /**
   * Calculate the expected vertical scroll offset when Ctrl+Backspace centers a row
   * in a viewport that has a column header, reducing the effective height.
   *
   * @param {number} row - Target row index.
   * @param {number} viewportH - Total viewport height in pixels.
   * @param {string} theme - Theme name passed to `calcRowHeight` / `calcColHeaderHeight`.
   * @returns {number} Expected scroll-top value.
   */
  function calcCenterScrollYWithColHeader(row, viewportH, theme) {
    const rh = calcRowHeight(theme);
    const ch = calcColHeaderHeight(theme);

    return (row - (Math.ceil(Math.floor((viewportH - ch) / rh) / 2) - 1)) * rh;
  }

  describe('"Ctrl/Cmd + Backspace"', () => {
    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the top-left position)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        colWidths: 60,
        rowHeights: 60,
        width: 400,
        height: 400,
      });

      await selectCell(0, 0);
      // move the viewport to position that the focused cell is partially visible on the top-left
      await scrollViewportTo({
        row: 6,
        col: 6,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).toEqual({ x: 35, y: 36 });

      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the top-right position)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        colWidths: 60,
        rowHeights: 60,
        width: 400,
        height: 400,
      });

      await selectCell(0, 6);
      // move the viewport to position that the focused cell is partially visible on the top-right
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).toEqual({ x: 0, y: 0 });

      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the bottom-right position)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        colWidths: 60,
        rowHeights: 60,
        width: 400,
        height: 400,
      });

      await selectCell(6, 6);
      // move the viewport to position that the focused cell is partially visible on the bottom-right
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).toEqual({ x: 0, y: 0 });

      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the bottom-left position)', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        colWidths: 60,
        rowHeights: 60,
        width: 400,
        height: 400,
      });

      await selectCell(6, 0);
      // move the viewport to position that the focused cell is partially visible on the bottom-left
      await scrollViewportTo({
        row: 0,
        col: 6,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).toEqual({ x: 35, y: 0 });

      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should scroll the viewport down to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      await selectCell(90, 1);
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // y = (row - (ceil(floor(viewportH / rowHeight) / 2) - 1)) * rowHeight, viewportH=300
        classic.toEqual({ x: 0, y: calcCenterScrollY(90, 300, 'classic') });
        main.toEqual({ x: 0, y: calcCenterScrollY(90, 300, 'main') });
        horizon.toEqual({ x: 0, y: calcCenterScrollY(90, 300, 'horizon') });
      });
    });

    it('should scroll the viewport right to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      await selectCell(1, 40);
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // x values depend on auto-sized column widths (2-char column headers at col 40 = "AO"),
        // which are font-metric-dependent and cannot be derived from design tokens alone.
        // TODO: verify formula
        classic.toEqual({ x: 1887, y: 0 });
        main.toEqual({ x: 2001, y: 0 });
        horizon.toEqual({ x: 2292, y: 0 });
      });
    });

    it('should scroll the viewport left to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      await selectCell(1, 10);
      await scrollViewportTo({
        row: 99,
        col: 49,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // x values depend on auto-sized column widths (single-char column headers at col 10 = "K"),
        // which are font-metric-dependent and cannot be derived from design tokens alone.
        // TODO: verify formula
        classic.toEqual({ x: 350, y: 0 });
        main.toEqual({ x: 412, y: 0 });
        horizon.toEqual({ x: 476, y: 0 });
      });
    });

    it('should scroll the viewport up to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      await selectCell(10, 1);
      await scrollViewportTo({
        row: 99,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // y = (row - (ceil(floor(viewportH / rowHeight) / 2) - 1)) * rowHeight, viewportH=300
        classic.toEqual({ x: 0, y: calcCenterScrollY(10, 300, 'classic') });
        main.toEqual({ x: 0, y: calcCenterScrollY(10, 300, 'main') });
        horizon.toEqual({ x: 0, y: calcCenterScrollY(10, 300, 'horizon') });
      });
    });

    it('should scroll the viewport to the focused cell for different active selection layer', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      await selectCells([
        [60, 1, 61, 2],
        [80, 1, 81, 2],
      ]);
      await keyDownUp(['shift', 'tab']); // move focus to the previous layer (C62)
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // Focused cell is at row 61 (second selection layer, after Shift+Tab).
        // y = (row - (ceil(floor(viewportH / rowHeight) / 2) - 1)) * rowHeight, viewportH=300
        classic.toEqual({ x: 0, y: calcCenterScrollY(61, 300, 'classic') });
        main.toEqual({ x: 0, y: calcCenterScrollY(61, 300, 'main') });
        horizon.toEqual({ x: 0, y: calcCenterScrollY(61, 300, 'horizon') });
      });
    });

    it('should scroll the viewport to the focused cell by positioning the viewport in the center of the cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      await selectCell(50, 25);
      await scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // y = (row - (ceil(floor(viewportH / rowHeight) / 2) - 1)) * rowHeight, viewportH=300
        // x values depend on auto-sized column widths (font-metric-dependent).
        // TODO: verify formula for x
        classic.toEqual({ x: 1100, y: calcCenterScrollY(50, 300, 'classic') });
        main.toEqual({ x: 1132, y: calcCenterScrollY(50, 300, 'main') });
        horizon.toEqual({ x: 1303, y: calcCenterScrollY(50, 300, 'horizon') });
      });
    });

    it('should scroll the viewport horizontally only when the column header is focused', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, 25);
      await scrollViewportTo({
        row: 90,
        col: 1,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // y = scrollViewportTo result: (row + 1) * rowHeight - (viewportH - colHeaderHeight - 18), viewportH=300
        // x = Ctrl+Backspace centering on col 25 with rowHeaders present (font-metric-dependent width).
        // TODO: verify formula for x
        classic.toEqual({ x: 1100, y: calcTopOverlayBottomSnapScroll(90, 300, 'classic') });
        main.toEqual({ x: 1187, y: calcTopOverlayBottomSnapScroll(90, 300, 'main') });
        horizon.toEqual({ x: 1366, y: calcTopOverlayBottomSnapScroll(90, 300, 'horizon') });
      });
    });

    it('should scroll the viewport horizontally when the column header is focused and all rows are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(1, 50),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-trimming-map', 'trimming', true);
      await render();

      await selectCell(-1, 25, -1, 25, false);
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual({ x: 1100, y: 0 });
    });

    it('should scroll the viewport horizontally when the column header is focused and all rows are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(1, 50),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      rowIndexMapper().createAndRegisterIndexMap('my-trimming-map', 'hiding', true);
      await render();

      await selectCell(-1, 25, -1, 25, false);
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual({ x: 1100, y: 0 });
    });

    it('should scroll the viewport vertically only when the row header is focused', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(50, -1);
      await scrollViewportTo({
        row: 1,
        col: 40,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // y = (row - (ceil(floor((viewportH - colHeaderH) / rowHeight) / 2) - 1)) * rowHeight
        // viewportH=300; effective height reduced by colHeaders.
        // x = scrollViewportTo result for col 40 with rowHeaders present (font-metric-dependent).
        // TODO: verify formula for x
        classic.toEqual({ x: 1800, y: calcCenterScrollYWithColHeader(50, 300, 'classic') });
        main.toEqual({ x: 1942, y: calcCenterScrollYWithColHeader(50, 300, 'main') });
        horizon.toEqual({ x: 2265, y: calcCenterScrollYWithColHeader(50, 300, 'horizon') });
      });
    });

    it('should scroll the viewport vertically when the row header is focused and all columns are trimmed', async() => {
      handsontable({
        data: createSpreadsheetData(100, 1),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-trimming-map', 'trimming', true);
      await render();

      await selectCell(50, -1, 50, -1, false);
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // When all columns are trimmed, no col header is rendered so viewportH=300 (full height).
        // y = (row - (ceil(floor(viewportH / rowHeight) / 2) - 1)) * rowHeight, viewportH=300
        classic.toEqual({ x: 0, y: calcCenterScrollY(50, 300, 'classic') });
        main.toEqual({ x: 0, y: calcCenterScrollY(50, 300, 'main') });
        horizon.toEqual({ x: 0, y: calcCenterScrollY(50, 300, 'horizon') });
      });
    });

    it('should scroll the viewport vertically when the row header is focused and all columns are hidden', async() => {
      handsontable({
        data: createSpreadsheetData(100, 1),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      columnIndexMapper().createAndRegisterIndexMap('my-trimming-map', 'hiding', true);
      await render();

      await selectCell(50, -1, 50, -1, false);
      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // When all columns are hidden, no col header is rendered so viewportH=300 (full height).
        // y = (row - (ceil(floor(viewportH / rowHeight) / 2) - 1)) * rowHeight, viewportH=300
        classic.toEqual({ x: 0, y: calcCenterScrollY(50, 300, 'classic') });
        main.toEqual({ x: 0, y: calcCenterScrollY(50, 300, 'main') });
        horizon.toEqual({ x: 0, y: calcCenterScrollY(50, 300, 'horizon') });
      });
    });

    it('should not scroll the viewport when corner is focused', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(-1, -1);
      await scrollViewportTo({
        row: 50,
        col: 25,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // y = scrollViewportTo result: (row + 1) * rowHeight - (viewportH - colHeaderHeight - 18), viewportH=300
        // x = scrollViewportTo result for col 25 with rowHeaders present (font-metric-dependent).
        // TODO: verify formula for x
        classic.toEqual({ x: 996, y: calcTopOverlayBottomSnapScroll(50, 300, 'classic') });
        main.toEqual({ x: 1035, y: calcTopOverlayBottomSnapScroll(50, 300, 'main') });
        horizon.toEqual({ x: 1238, y: calcTopOverlayBottomSnapScroll(50, 300, 'horizon') });
      });

      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        // Corner header focused: Ctrl+Backspace does not scroll, position unchanged.
        classic.toEqual({ x: 996, y: calcTopOverlayBottomSnapScroll(50, 300, 'classic') });
        main.toEqual({ x: 1035, y: calcTopOverlayBottomSnapScroll(50, 300, 'main') });
        horizon.toEqual({ x: 1238, y: calcTopOverlayBottomSnapScroll(50, 300, 'horizon') });
      });
    });
  });
});
