describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    $('body').find('#testContainer').remove();
  });

  describe('modifyGetCoordsElement', () => {
    it('should be fired before the cell is clicked', async() => {
      const modifyGetCoordsElement = jasmine.createSpy('modifyGetCellCoords');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyGetCoordsElement,
      });

      modifyGetCoordsElement.calls.reset();
      await mouseDown(getCell(1, 2));

      expect(modifyGetCoordsElement).toHaveBeenCalledWith(1, 2);
      expect(modifyGetCoordsElement).toHaveBeenCalledTimes(1);
    });

    it('should shift the selection after cell click', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyGetCoordsElement(row, column) {
          return [row + 1, column + 2];
        },
      });

      await simulateClick(getCell(1, 1));

      expect(getSelected()).toEqual([[2, 3, 2, 3]]);
    });
  });
});
