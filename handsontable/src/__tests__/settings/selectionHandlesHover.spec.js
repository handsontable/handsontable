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
  });
});
