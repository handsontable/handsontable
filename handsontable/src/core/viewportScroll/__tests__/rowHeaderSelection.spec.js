describe('Row header selection scroll', () => {
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
      topOverlay().setScrollPosition(15);

      await sleep(10);

      simulateClick(getCell(0, -1));

      expect(topOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after extending header selection using Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      topOverlay().setScrollPosition(15);

      await sleep(10);

      simulateClick(getCell(1, -1));
      keyDown('shift');
      simulateClick(getCell(0, -1));

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
      topOverlay().setScrollPosition(15);

      await sleep(10);

      selectRows(1, 0);

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
      topOverlay().setScrollPosition(15);

      await sleep(10);

      selectRows(0, 1);

      expect(topOverlay().getScrollPosition()).toBe(15);
    });
  });

  describe('for partially visible cell on the bottom table\'s edge', () => {
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A12` cell is partially visible on the bottom side of the table
      topOverlay().setScrollPosition(5);

      await sleep(10);

      simulateClick(getCell(11, -1));

      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(19);
        main.toBe(94);
      });
    });

    it('should scroll the viewport after extending header selection using Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A12` cell is partially visible on the bottom side of the table
      topOverlay().setScrollPosition(5);

      await sleep(10);

      simulateClick(getCell(10, -1));
      keyDown('shift');
      simulateClick(getCell(11, -1));

      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(19);
        main.toBe(94);
      });
    });

    it('should scroll the viewport after using API (selecting fully visible row to partially visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A12` cell is partially visible on the bottom side of the table
      topOverlay().setScrollPosition(5);

      await sleep(10);

      selectRows(10, 11);

      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(19);
        main.toBe(94);
      });
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
      topOverlay().setScrollPosition(5);

      await sleep(10);

      selectRows(11, 10);

      expect(topOverlay().getScrollPosition()).forThemes(({ classic, main }) => {
        classic.toBe(5);
        main.toBe(65);
      });
    });
  });
});
