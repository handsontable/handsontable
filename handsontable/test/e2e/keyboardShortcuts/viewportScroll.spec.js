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
    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the top-left position)', () => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(0, 0);
      // move the viewport to position that the focused cell is partially visible
      scrollViewportTo({
        row: 12,
        col: 7,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 45, y: 15 });
        main.toEqual({ x: 57, y: 93 });
      });

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the top-right position)', () => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(0, 7);
      // move the viewport to position that the focused cell is partially visible
      scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).toEqual({ x: 0, y: 0 });

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the bottom-right position)', () => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(12, 7);
      // move the viewport to position that the focused cell is partially visible
      scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).toEqual({ x: 0, y: 0 });

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should not scroll the viewport when the focused cell is already in the viewport (focus is placed on the bottom-left position)', () => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(12, 0);
      // move the viewport to position that the focused cell is partially visible
      scrollViewportTo({
        row: 0,
        col: 7,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      const scrollPosition = getCurrentScrollPosition();

      expect(scrollPosition).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 45, y: 0 });
        main.toEqual({ x: 57, y: 0 });
      });

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).toEqual(scrollPosition);
    });

    it('should scroll the viewport down to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(90, 1);
      scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 0, y: 1932 });
        main.toEqual({ x: 0, y: 2494 });
      });
    });

    it('should scroll the viewport right to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(1, 40);
      scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 1850, y: 0 });
        main.toEqual({ x: 2001, y: 0 });
      });
    });

    it('should scroll the viewport left to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(1, 10);
      scrollViewportTo({
        row: 99,
        col: 49,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 350, y: 0 });
        main.toEqual({ x: 412, y: 0 });
      });
    });

    it('should scroll the viewport up to the focused cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(10, 1);
      scrollViewportTo({
        row: 99,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 0, y: 92 });
        main.toEqual({ x: 0, y: 174 });
      });
    });

    it('should scroll the viewport to the focused cell by positioning the viewport in the center of the cell', async() => {
      handsontable({
        data: createSpreadsheetData(100, 50),
        width: 370,
        height: 300,
      });

      selectCell(50, 25);
      scrollViewportTo({
        row: 0,
        col: 0,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 1100, y: 1012 });
        main.toEqual({ x: 1132, y: 1334 });
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

      selectCell(-1, 25);
      scrollViewportTo({
        row: 90,
        col: 1,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 1100, y: 1836 });
        main.toEqual({ x: 1187, y: 2385 });
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
      render();

      selectCell(-1, 25, -1, 25, false);

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

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
      render();

      selectCell(-1, 25, -1, 25, false);

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

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

      selectCell(50, -1);
      scrollViewportTo({
        row: 1,
        col: 40,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        // 2050 column width - 320 viewport width + 15 scrollbar compensation + 1 header border compensation
        classic.toEqual({ x: 1747, y: 1035 });

        main.toEqual({ x: 1942, y: 1334 });
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
      render();

      selectCell(50, -1, 50, -1, false);

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 0, y: 1035 });
        main.toEqual({ x: 0, y: 1334 });
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
      render();

      selectCell(50, -1, 50, -1, false);

      await sleep(100);

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 0, y: 1035 });
        main.toEqual({ x: 0, y: 1334 });
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

      selectCell(-1, -1);
      scrollViewportTo({
        row: 50,
        col: 25,
        verticalSnap: 'bottom',
        horizontalSnap: 'end',
      });

      await sleep(100);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        // 1300 column width - 320 viewport width + 15 scrollbar compensation + 1 header border compensation
        classic.toEqual({ x: 996, y: 916 });

        main.toEqual({ x: 1035, y: 1225 });
      });

      keyDownUp(['control/meta', 'backspace']);

      expect(getCurrentScrollPosition()).forThemes(({ classic, main }) => {
        classic.toEqual({ x: 996, y: 916 });
        main.toEqual({ x: 1035, y: 1225 });
      });
    });
  });
});
