describe('Non-contiguous selection scroll', () => {
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

  describe('for partially visible cell on the right table\'s edge', () => {
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      simulateClick(getCell(0, 3));
      keyDown('control/meta');
      simulateClick(getCell(0, 5));

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after using API (selecting fully visible column to partially visible column)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCells([[0, 3], [0, 5]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should not scroll the viewport after using API (selecting partially visible column to fully visible column)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCells([[0, 5], [0, 3]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
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

      simulateClick(getCell(0, 1));
      keyDown('control/meta');
      simulateClick(getCell(0, 0));

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after using API (selecting fully visible column to partially visible column)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCells([[0, 1], [0, 0]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should not scroll the viewport after using API (selecting partially visible column to fully visible column)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectCells([[0, 0], [0, 1]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
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

      simulateClick(getCell(1, 0));
      keyDown('control/meta');
      simulateClick(getCell(0, 0));

      await sleep(10);

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after using API (selecting fully visible row to partially visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      selectCells([[1, 0], [0, 0]]);

      await sleep(10);

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should not scroll the viewport after using API (selecting partially visible row to fully visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollOverlay(topOverlay(), 15);

      selectCells([[0, 0], [1, 0]]);

      expect(topOverlay().getScrollPosition()).toBe(15);
    });
  });

  describe('for partially visible cell on the bottom table\'s edge', () => {
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      await sleep(10);

      simulateClick(getCell(10, 0));
      keyDown('control/meta');
      simulateClick(getCell(11, 0));

      await sleep(10);

      expect(getLastFullyVisibleRow()).toBe(11);
    });

    it('should scroll the viewport after using API (selecting fully visible row to partially visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      expect(getLastFullyVisibleRow()).toBe(10);

      selectCells([[10, 0], [11, 0]]);

      await sleep(10);

      expect(getLastFullyVisibleRow()).toBe(11);
    });

    it('should scroll the viewport after using API (selecting partially visible row to fully visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A12` cell is partially visible on the bottom side of the table
      await scrollOverlay(topOverlay(), 5);

      selectCells([[11, 0], [10, 0]]);

      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
        classic.toBe(5);
        main.toBe(65);
        horizon.toBe(161);
      });
    });
  });
});
