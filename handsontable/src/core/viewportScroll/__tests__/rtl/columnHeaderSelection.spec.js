describe('Column header selection scroll (RTL mode)', () => {
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
    it('should scroll the viewport after mouse click', async() => {
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

      simulateClick(getCell(-1, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after extending header selection using Shift key', async() => {
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

      simulateClick(getCell(-1, 4));
      keyDown('shift');
      simulateClick(getCell(-1, 5));

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

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectColumns(4, 5);

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

      // make sure that the `F1` cell is partially visible on the left side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectColumns(5, 4);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
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

      simulateClick(getCell(-1, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after extending header selection using Shift key', async() => {
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

      simulateClick(getCell(-1, 1));
      keyDown('shift');
      simulateClick(getCell(-1, 0));

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

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectColumns(1, 0);

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

      // make sure that the `A1` cell is partially visible on the right side of the table
      inlineStartOverlay().setScrollPosition(25);

      await sleep(10);

      selectColumns(0, 1);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
    });
  });
});
