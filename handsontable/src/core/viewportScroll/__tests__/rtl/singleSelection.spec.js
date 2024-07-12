describe('Single selection scroll (RTL mode)', () => {
  const id = 'testContainer';

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    $('html').attr('dir', 'ltr');

    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('for partially visible cell on the left table\'s edge', () => {
    it('should not scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      simulateClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
    });

    it('should scroll the viewport after double mouse click (cell editing)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      mouseDoubleClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after navigating using ArrowLeft key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectCell(0, 4);
      keyDownUp('arrowleft');

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after navigating through the column headers using ArrowLeft key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectCell(-1, 4);
      keyDownUp('arrowleft');

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after using API', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectCell(0, 5);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });
  });

  describe('for partially visible cell on the right table\'s edge', () => {
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      simulateClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after double mouse click (cell editing)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      mouseDoubleClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after navigating using ArrowRight key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectCell(0, 1);
      keyDownUp('arrowright');

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after navigating through the column headers using ArrowRight key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectCell(-1, 1);
      keyDownUp('arrowright');

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after using API', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectCell(0, 0);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });
  });
});
