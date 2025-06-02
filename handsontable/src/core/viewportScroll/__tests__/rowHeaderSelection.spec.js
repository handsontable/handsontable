describe('Row header selection scroll', () => {
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
      await simulateClick(getCell(0, -1));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after extending header selection with mouse and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollViewportVertically(15);

      await simulateClick(getCell(1, -1));
      await keyDown('shift');
      await simulateClick(getCell(0, -1));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, -1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after extending header selection with API and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      await listen();

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollViewportVertically(15);
      await selectRows(1);
      await keyDownUp(['shift', 'arrowup']);

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(1, -1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
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

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollViewportVertically(15);
      await selectRows(1, 0);

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
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

      // make sure that the `A1` cell is partially visible on the top side of the table
      await scrollViewportVertically(15);
      await selectRows(0, 1);

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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

      await simulateClick(getCell(11, -1));

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(11, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after extending header selection with mouse and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      await simulateClick(getCell(10, -1));
      await keyDown('shift');
      await simulateClick(getCell(11, -1));

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(10, -1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(11, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after extending header selection with mouse and Shift key', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      await listen();

      await selectRows(10);
      await keyDownUp(['shift', 'arrowdown']);

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(10, -1, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(11, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after using API (selecting fully visible row to partially visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      await selectRows(10, 11);

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(11, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });

    it('should scroll the viewport after using API (selecting partially visible row to fully visible row)', async() => {
      handsontable({
        data: createSpreadsheetData(20, 5),
        width: 300,
        height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
        rowHeaders: true,
        colHeaders: true,
      });

      await selectRows(11, 10);

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(11, -1, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });

  it('should scroll the viewport to the focused cell when the selection is higher than table\'s viewport (first to last)', async() => {
    handsontable({
      data: createSpreadsheetData(20, 5),
      width: 300,
      height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
      rowHeaders: true,
      colHeaders: true,
    });

    await scrollViewportVertically(getDefaultRowHeight() * 6);
    await selectRows(0, 19);

    expect(topOverlay().getScrollPosition()).toBe(0);
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, -1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });

  it('should scroll the viewport to the focused cell when the selection is higher than table\'s viewport (last to first)', async() => {
    handsontable({
      data: createSpreadsheetData(20, 5),
      width: 300,
      height: getDefaultColumnHeaderHeight() + (12 * getDefaultRowHeight()), // height includes the scrollbar
      rowHeaders: true,
      colHeaders: true,
    });

    // scroll to the middle of the table
    await scrollViewportVertically(getDefaultRowHeight() * 6);
    await selectRows(19, 0);

    expect(topOverlay().getScrollPosition()).forThemes(({ classic, main, horizon }) => {
      classic.toBe(202);
      main.toBe(250);
      horizon.toBe(314);
    });
    expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(19, -1, true));
    expect(scrollIntoViewSpy).toHaveBeenCalledWith({
      block: 'nearest',
      inline: 'nearest',
    });
  });
});
