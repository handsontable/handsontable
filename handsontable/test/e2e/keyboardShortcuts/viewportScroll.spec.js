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

      const layout = getThemeLayout();
      const pos = getCurrentScrollPosition();

      // Scrolled down to bring row 90 into view; x should remain 0.
      expect(pos.x).toBe(0);
      expect(pos.y).toBeGreaterThan(layout.verticalScrollForRow(80));
      expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(91));
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

      const pos = getCurrentScrollPosition();

      // Scrolled right to bring col 40 into view; y should remain 0.
      expect(pos.x).toBeGreaterThan(35 * 50);
      expect(pos.y).toBe(0);
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

      const pos = getCurrentScrollPosition();

      // Scrolled left to bring col 10 into view; y should remain 0.
      expect(pos.x).toBeGreaterThanOrEqual(5 * 50);
      expect(pos.x).toBeLessThanOrEqual(11 * 50);
      expect(pos.y).toBe(0);
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

      const layout = getThemeLayout();
      const pos = getCurrentScrollPosition();

      // Scrolled up to bring row 10 into view; x should remain 0.
      expect(pos.x).toBe(0);
      expect(pos.y).toBeGreaterThanOrEqual(layout.verticalScrollForRow(3));
      expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(11));
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

      const layout = getThemeLayout();
      const pos = getCurrentScrollPosition();

      // Scrolled to bring row 62 into view; x should remain 0.
      expect(pos.x).toBe(0);
      expect(pos.y).toBeGreaterThan(layout.verticalScrollForRow(50));
      expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(63));
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

      const layout = getThemeLayout();
      const pos = getCurrentScrollPosition();

      // Scrolled to center cell (50, 25) in the viewport.
      expect(pos.x).toBeGreaterThanOrEqual(20 * 50);
      expect(pos.x).toBeLessThanOrEqual(28 * 50);
      expect(pos.y).toBeGreaterThan(layout.verticalScrollForRow(40));
      expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(51));
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

      const yBefore = getCurrentScrollPosition().y;

      await keyDownUp(['control/meta', 'backspace']);

      const pos = getCurrentScrollPosition();

      // Only horizontal scroll should change to bring col 25 into view.
      // Vertical scroll should remain unchanged since only a column header is focused.
      expect(pos.x).toBeGreaterThanOrEqual(20 * 50);
      expect(pos.x).toBeLessThanOrEqual(28 * 50);
      expect(pos.y).toBe(yBefore);
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

      const xBefore = getCurrentScrollPosition().x;

      await keyDownUp(['control/meta', 'backspace']);

      const layout = getThemeLayout();
      const pos = getCurrentScrollPosition();

      // Only vertical scroll should change to bring row 50 into view.
      // Horizontal scroll should remain unchanged since only a row header is focused.
      expect(pos.x).toBe(xBefore);
      expect(pos.y).toBeGreaterThan(layout.verticalScrollForRow(40));
      expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(51));
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

      {
        const layout = getThemeLayout();
        const pos = getCurrentScrollPosition();

        // Scrolled vertically to bring row 50 into view; x should remain 0.
        expect(pos.x).toBe(0);
        expect(pos.y).toBeGreaterThan(layout.verticalScrollForRow(40));
        expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(51));
      }
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

      {
        const layout = getThemeLayout();
        const pos = getCurrentScrollPosition();

        // Scrolled vertically to bring row 50 into view; x should remain 0.
        expect(pos.x).toBe(0);
        expect(pos.y).toBeGreaterThan(layout.verticalScrollForRow(40));
        expect(pos.y).toBeLessThanOrEqual(layout.verticalScrollForRow(51));
      }
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

      const scrollBefore = getCurrentScrollPosition();

      await keyDownUp(['control/meta', 'backspace']);

      // Scroll position should not change when corner is focused.
      expect(getCurrentScrollPosition()).toEqual(scrollBefore);
    });
  });
});
