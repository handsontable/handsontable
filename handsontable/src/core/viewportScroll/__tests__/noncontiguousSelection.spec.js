describe('Non-contiguous selection scroll', () => {
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
    it('should scroll the viewport after mouse click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 10),
        width: 300,
        height: 300,
        rowHeaders: true,
        colHeaders: true,
      });

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollViewportHorizontally(25);

      await simulateClick(getCell(0, 3));
      await keyDown('control/meta');
      await simulateClick(getCell(0, 5));

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 3, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 5, true));
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

      // make sure that the `F1` cell is partially visible on the right side of the table
      await scrollViewportHorizontally(25);
      await selectCells([[0, 3], [0, 5]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(51);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 5, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCells([[0, 5], [0, 3]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 3, true));
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

      await simulateClick(getCell(0, 2));
      await keyDown('control/meta');
      await simulateClick(getCell(0, 0));

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 2, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 0, true));
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

      // make sure that the `A1` cell is partially visible on the left side of the table
      await scrollViewportHorizontally(25);
      await selectCells([[0, 2], [0, 0]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportHorizontally(25);
      await selectCells([[0, 0], [0, 2]]);

      expect(inlineStartOverlay().getScrollPosition()).toBe(25);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 2, true));
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

      await simulateClick(getCell(2, 0));
      await keyDown('control/meta');
      await simulateClick(getCell(0, 0));

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(2, 0, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(0, 0, true));
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
      await selectCells([[2, 0], [0, 0]]);

      expect(topOverlay().getScrollPosition()).toBe(0);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(0, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
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
      await scrollViewportVertically(15);
      await selectCells([[0, 0], [2, 0]]);

      expect(topOverlay().getScrollPosition()).toBe(15);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(2, 0, true));
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

      await simulateClick(getCell(10, 0));
      await keyDown('control/meta');
      await simulateClick(getCell(11, 0));

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(10, 0, true));
      expect(scrollIntoViewSpy.calls.thisFor(1)).toBe(getCell(11, 0, true));
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

      await selectCells([[10, 0], [11, 0]]);

      expect(topOverlay().getScrollPosition()).toBe(18);
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(11, 0, true));
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

      // make sure that the `A12` cell is partially visible on the bottom side of the table
      await scrollViewportVertically(5);
      await selectCells([[11, 0], [9, 0]]);

      // The viewport should have scrolled to make cell(9, 0) visible. Whether a scroll was
      // actually needed depends on the theme: shorter rows (classic) already fit row 9 inside
      // the 300px viewport and the pre-scroll of 5 should be preserved; taller rows (main,
      // horizon) do not fit and the viewport must scroll further. Deriving the required scroll
      // from tokens keeps the assertion theme-agnostic while still catching a regression where
      // the taller-row themes fail to scroll.
      const L = getThemeLayout();
      const scrollbarHeight = Handsontable.dom.getScrollbarWidth();
      const headerHeight = L.defaultColumnHeaderHeight + L.cellBorderWidth;
      const dataAreaHeight = 300 - headerHeight - scrollbarHeight;
      const row9BottomInData = 10 * L.defaultDataRowHeight;
      const preScroll = 5;

      if (row9BottomInData > dataAreaHeight + preScroll) {
        // A scroll past the pre-scroll baseline is required on this theme.
        expect(topOverlay().getScrollPosition()).toBeGreaterThan(preScroll);
      } else {
        // Row 9 already fit inside the viewport; no additional scroll was required.
        expect(topOverlay().getScrollPosition()).toBe(preScroll);
      }
      expect(scrollIntoViewSpy.calls.thisFor(0)).toBe(getCell(9, 0, true));
      expect(scrollIntoViewSpy).toHaveBeenCalledWith({
        block: 'nearest',
        inline: 'nearest',
      });
    });
  });
});
