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
      await scrollViewportHorizontally(25);
      await simulateClick(getCell(-1, 5));

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
      await scrollViewportHorizontally(25);

      await simulateClick(getCell(-1, 4));
      await keyDown('shift');
      await simulateClick(getCell(-1, 5));

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

      await listen();

      // make sure that the `F1` cell is partially visible on the left side of the table
      await scrollViewportHorizontally(25);
      await selectColumns(4);
      await keyDownUp(['shift', 'arrowleft']);

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
      await scrollViewportHorizontally(25);
      await selectColumns(4, 5);

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
      await scrollViewportHorizontally(25);
      await selectColumns(5, 4);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await simulateClick(getCell(-1, 0));

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
      await scrollViewportHorizontally(25);

      await simulateClick(getCell(-1, 1));
      await keyDown('shift');
      await simulateClick(getCell(-1, 0));

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

      await listen();

      // make sure that the `A1` cell is partially visible on the right side of the table
      await scrollViewportHorizontally(25);
      await selectColumns(1);
      await keyDownUp(['shift', 'arrowright']);

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
      await scrollViewportHorizontally(25);
      await selectColumns(1, 0);

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
      await scrollViewportHorizontally(25);
      await selectColumns(0, 1);

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

    await scrollViewportHorizontally(100);
    await selectColumns(0, 9);

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

    await scrollViewportHorizontally(100);
    await selectColumns(9, 0);

    expect(inlineStartOverlay().getScrollPosition()).toBe(251);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 9, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });
});
