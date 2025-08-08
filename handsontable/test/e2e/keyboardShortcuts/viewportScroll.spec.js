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
        classic.toEqual({ x: 0, y: 1932 });
        main.toEqual({ x: 0, y: 2494 });
        horizon.toEqual({ x: 0, y: 3219 });
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
        classic.toEqual({ x: 1850, y: 0 });
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
        classic.toEqual({ x: 0, y: 92 });
        main.toEqual({ x: 0, y: 174 });
        horizon.toEqual({ x: 0, y: 259 });
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
        classic.toEqual({ x: 0, y: 1265 });
        main.toEqual({ x: 0, y: 1653 });
        horizon.toEqual({ x: 0, y: 2146 });
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
        classic.toEqual({ x: 1100, y: 1012 });
        main.toEqual({ x: 1132, y: 1334 });
        horizon.toEqual({ x: 1303, y: 1739 });
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
        classic.toEqual({ x: 1100, y: 1836 });
        main.toEqual({ x: 1187, y: 2385 });
        horizon.toEqual({ x: 1366, y: 3121 });
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
        // 2050 column width - 320 viewport width + 15 scrollbar compensation + 1 header border compensation
        classic.toEqual({ x: 1747, y: 1035 });

        main.toEqual({ x: 1942, y: 1334 });
        horizon.toEqual({ x: 2265, y: 1739 });
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
        classic.toEqual({ x: 0, y: 1035 });
        main.toEqual({ x: 0, y: 1334 });
        horizon.toEqual({ x: 0, y: 1739 });
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
        classic.toEqual({ x: 0, y: 1035 });
        main.toEqual({ x: 0, y: 1334 });
        horizon.toEqual({ x: 0, y: 1739 });
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
        // 1300 column width - 320 viewport width + 15 scrollbar compensation + 1 header border compensation
        classic.toEqual({ x: 996, y: 916 });

        main.toEqual({ x: 1035, y: 1225 });
        horizon.toEqual({ x: 1238, y: 1641 });
      });

      await keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toEqual({ x: 996, y: 916 });
        main.toEqual({ x: 1035, y: 1225 });
        horizon.toEqual({ x: 1238, y: 1641 });
      });
    });
  });
});
