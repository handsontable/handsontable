describe('Column header selection scroll (RTL mode)', () => {
  const id = 'testContainer';
  let scrollIntoViewSpy;

  beforeEach(function() {
    $('html').attr('dir', 'rtl');
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    scrollIntoViewSpy = spyOn(Element.prototype, 'scrollIntoView');
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
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 4, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      keyDownUp(['shift', 'arrowleft']);

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 4, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });

  describe('for partially visible cell on the right table\'s edge', async() => {
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(-1, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      keyDownUp(['shift', 'arrowright']);

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(-1, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 0, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
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

    await sleep(10);

    expect(inlineStartOverlay().getScrollPosition()).toBe(251);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 9, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });
});
