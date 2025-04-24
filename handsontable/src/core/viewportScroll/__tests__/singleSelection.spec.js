describe('Single selection scroll', () => {
  const id = 'testContainer';
  let scrollIntoViewSpy;

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');

    scrollIntoViewSpy = spyOn(Element.prototype, 'scrollIntoView');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
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

      await simulateClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
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
      await scrollViewportHorizontally(25);
      await mouseDoubleClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
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
      await scrollViewportHorizontally(25);
      await selectCell(0, 4);
      await keyDownUp('arrowright');

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 4, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCell(-1, 4);
      await keyDownUp('arrowright');

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 4, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(-1, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCell(0, 5);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await simulateClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await mouseDoubleClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
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

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollViewportHorizontally(25);
      await selectCell(0, 1);
      await keyDownUp('arrowleft');

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCell(-1, 1);
      await keyDownUp('arrowleft');

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(-1, 1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(-1, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCell(0, 0);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportVertically(15);
      await simulateClick(getCell(0, 0));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportVertically(15);
      await mouseDoubleClick(getCell(0, 0));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportVertically(15);
      await selectCell(1, 0);
      await keyDownUp('arrowup');

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, 0, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportVertically(15);
      await selectCell(1, -1);
      await keyDownUp('arrowup');

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, -1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportVertically(15);
      await selectCell(0, 0);

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });

  describe('for partially visible cell on the bottom table\'s edge', () => {
    it('should not scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()),
        rowHeaders: true,
        colHeaders: true,
      });

      await simulateClick(getCell(11, 0));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    });

    it('should scroll the viewport after double mouse click (cell editing)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()) + 5, // 5px to show part of A12
        rowHeaders: true,
        colHeaders: true,
      });

      await mouseDoubleClick(getCell(11, 0));

      expect(topOverlay().getScrollPosition()).toBe(13);
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    });

    it('should scroll the viewport after navigating using ArrowDown key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCell(10, 0);
      await keyDownUp('arrowdown');

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(10, 0, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(11, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after navigating through the row headers using ArrowDown key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
        navigableHeaders: true,
      });

      await selectCell(10, -1);
      await keyDownUp('arrowdown');

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(10, -1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(11, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after using API', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      await selectCell(11, 0);

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(11, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });
});
