describe('Single selection scroll', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
    }
  });

  describe('for partially visible cell on the right table\'s edge', () => {
    it('should not scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 400,
        height: 300,
        colWidths: 60,
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleColumn()).toBe(4);

      await sleep(10);

      simulateClick(getCell(0, 5));

      expect(getLastFullyVisibleColumn()).toBe(4);
    });

    it('should scroll the viewport after double mouse click (cell editing)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      mouseDoubleClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after navigating using ArrowRight key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCell(0, 4);
      keyDownUp('arrowright');

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
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

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCell(-1, 4);
      keyDownUp('arrowright');

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

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCell(0, 5);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });
  });

  describe('for partially visible cell on the left table\'s edge', () => {
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      simulateClick(getCell(0, 0));

      await sleep(10);

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

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      mouseDoubleClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after navigating using ArrowLeft key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCell(0, 1);
      keyDownUp('arrowleft');

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
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

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCell(-1, 1);
      keyDownUp('arrowleft');

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

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCell(0, 0);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });
  });

  describe('for partially visible cell on the top table\'s edge', () => {
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      simulateClick(getCell(0, 0));

      await sleep(10);

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after double mouse click (cell editing)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      mouseDoubleClick(getCell(0, 0));

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after navigating using ArrowUp key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      selectCell(1, 0);
      keyDownUp('arrowup');

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after navigating through the row headers using ArrowUp key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      selectCell(1, -1);
      keyDownUp('arrowup');

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after using API', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      selectCell(0, 0);

      expect(topOverlay().getScrollPosition()).toBe(0);
    });
  });

  describe('for partially visible cell on the bottom table\'s edge', () => {
    it('should not scroll the viewport after mouse click', () => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()),
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      simulateClick(getCell(11, 0));

      expect(getLastFullyVisibleRow()).toBe(10);
    });

    it('should scroll the viewport after double mouse click (cell editing)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()) + 5, // 5px to show part of A12
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      mouseDoubleClick(getCell(11, 0));

      await sleep(10);

      expect(getLastFullyVisibleRow()).toBe(11);
    });

    it('should scroll the viewport after navigating using ArrowDown key', () => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      selectCell(10, 0);
      keyDownUp('arrowdown');

      expect(getLastFullyVisibleRow()).toBe(11);
    });

    it('should scroll the viewport after navigating through the row headers using ArrowDown key', () => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      selectCell(10, -1);
      keyDownUp('arrowdown');

      expect(getLastFullyVisibleRow()).toBe(11);
    });

    it('should scroll the viewport after using API', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      selectCell(11, 0);

      expect(getLastFullyVisibleRow()).toBe(11);
    });
  });
});
