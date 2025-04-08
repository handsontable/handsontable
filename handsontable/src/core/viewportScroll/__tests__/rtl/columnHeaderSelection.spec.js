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
      await scrollOverlay(inlineStartOverlay(), 25);

      simulateClick(getCell(-1, 5));

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after extending header selection with mouse and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      simulateClick(getCell(-1, 4));
      keyDown('shift');
      simulateClick(getCell(-1, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after extending header selection with API and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectColumns(4);
      listen();
      keyDown('shift');
      keyDownUp('arrowleft');

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
      await scrollOverlay(inlineStartOverlay(), 25);

      selectColumns(4, 5);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
    });

    it('should scroll the viewport after using API (selecting partially visible column to fully visible column)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectColumns(5, 4);

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
      await scrollOverlay(inlineStartOverlay(), 25);

      simulateClick(getCell(-1, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after extending header selection with mouse and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      simulateClick(getCell(-1, 1));
      keyDown('shift');
      simulateClick(getCell(-1, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after extending header selection with API and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectColumns(1);
      listen();
      keyDown('shift');
      keyDownUp('arrowright');

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
      await scrollOverlay(inlineStartOverlay(), 25);

      selectColumns(1, 0);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });

    it('should scroll the viewport after using API (selecting partially visible column to fully visible column)', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      await scrollOverlay(inlineStartOverlay(), 25);

      selectColumns(0, 1);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    });
  });

  it('should scroll the viewport to the focused cell when the selection is wider than table\'s viewport (first to last)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 10),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollOverlay(inlineStartOverlay(), 100);

    selectColumns(0, 9);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
  });

  it('should scroll the viewport to the focused cell when the selection is wider than table\'s viewport (last to first)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 10),
      width: 300,
      height: 300,
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollOverlay(inlineStartOverlay(), 100);

    selectColumns(9, 0);

    expect(inlineStartOverlay().getScrollPosition()).toBe(251);
  });
});
