describe('Multiple selection scroll (RTL mode)', () => {
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

      await simulateClick(getCell(0, 4));
      await keyDown('shift');
      await simulateClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 4, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCell(0, 4);
      await keyDownUp(['shift', 'arrowleft']);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 4, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should not scroll the viewport after navigating through the column headers using ArrowLeft key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the left side of the table
      await scrollViewportHorizontally(25);
      await selectCell(-1, 4);

      scrollIntoViewSpy.calls.reset();
      await keyDownUp(['shift', 'arrowleft']);

      await sleep(10);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
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
      await selectCells([[0, 4, 0, 5]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 5, true));
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
      await selectCells([[0, 5, 0, 4]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 5, true));
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

      await simulateClick(getCell(0, 1));
      await keyDown('shift');
      await simulateClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCell(0, 1);
      await keyDownUp(['shift', 'arrowright']);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should not scroll the viewport after navigating through the column headers using ArrowRight key', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the right side of the table
      await scrollViewportHorizontally(25);
      await selectCell(-1, 1);
      await keyDownUp(['shift', 'arrowright']);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 1, true));
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
      await selectCells([[0, 1, 0, 0]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
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
      await selectCells([[0, 0, 0, 1]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });
});
