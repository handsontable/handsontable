describe('settings', () => {
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

  describe('selectionHandles hover detection', () => {
    it('should show four visible handles when the pointer enters a cell within the selected range', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 5, 5]]);

      // Hover an interior cell inside the selection.
      await mouseOver(getCell(3, 3));

      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      expect(visibleHandles.length).toBe(4);
    });

    it('should hide handles when the pointer moves to a cell outside the selected range', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 5, 5]]);

      // First hover inside to show handles.
      await mouseOver(getCell(3, 3));

      // Then hover outside the selection.
      await mouseOver(getCell(0, 0));

      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      expect(visibleHandles.length).toBe(0);
    });

    it('should not show handles when selectionHandles is disabled', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        selectionHandles: false,
        selectionMode: 'multiple',
        width: 400,
        height: 300,
      });

      await selectCells([[2, 2, 5, 5]]);
      await mouseOver(getCell(3, 3));

      // Handles are created in the DOM but should not be visible when the option is off.
      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      expect(visibleHandles.length).toBe(0);
    });

    it('should show four handles immediately after a drag-select ends with the pointer still inside the selection', async() => {
      handsontable({
        data: createSpreadsheetData(10, 10),
        selectionHandles: true,
        selectionMode: 'multiple',
        width: 500,
        height: 400,
      });

      // Simulate a real drag-select: mousedown on (2,2), mouseover intermediate cells, mouseup on (4,4).
      // This reproduces the bug where no new mouseover fires after mouseup, so handles stay hidden.
      await mouseDown(getCell(2, 2));
      await mouseOver(getCell(3, 3));
      await mouseOver(getCell(4, 4));
      await mouseUp(getCell(4, 4));

      // The handles must be visible immediately after mouseup — without any extra mouse move.
      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      expect(visibleHandles.length).toBe(4);
    });

    it('should hide the bottom handle when the selection bottom edge lies on the fixedRowsBottom boundary', async() => {
      handsontable({
        data: createSpreadsheetData(8, 8),
        selectionHandles: true,
        selectionMode: 'multiple',
        fixedRowsBottom: 2,
        width: 400,
        height: 300,
      });

      // Row 5 is the last non-frozen row (8 rows − 2 bottom-frozen − 1), so the selection's
      // bottom edge lands exactly on the bottom freeze line.
      await selectCells([[2, 2, 5, 5]]);
      await mouseOver(getCell(3, 3));

      const handles = spec().$container[0].querySelectorAll('.wtSelectionHandle');
      const visibleHandles = Array.from(handles).filter(el => el.style.display === 'block');

      // The bottom handle is suppressed on the frozen-pane boundary; the other three stay.
      expect(visibleHandles.length).toBe(3);
      expect(visibleHandles.some(el => el.classList.contains('wtSelectionHandle--bottom'))).toBe(false);
    });
  });
});
