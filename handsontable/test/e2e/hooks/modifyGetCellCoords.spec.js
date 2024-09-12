describe('Hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    this.$container.data('handsontable')?.destroy();
    this.$container.remove();
  });

  describe('modifyGetCellCoords', () => {
    it('should be fired before the editor is prepared', () => {
      const modifyGetCellCoords = jasmine.createSpy('modifyGetCellCoords');

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        modifyGetCellCoords,
      });

      selectCell(1, 2);
      spyOn(hot, 'getCell').and.returnValue(null);

      modifyGetCellCoords.calls.reset();

      hot._getEditorManager().prepareEditor();

      expect(modifyGetCellCoords).toHaveBeenCalledWith(1, 2, false, 'meta');
      expect(modifyGetCellCoords).toHaveBeenCalledTimes(1);
    });

    it('should be fired after the editor saves the value', () => {
      const modifyGetCellCoords = jasmine.createSpy('modifyGetCellCoords');

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        modifyGetCellCoords,
      });

      selectCell(1, 2);
      spyOn(hot, 'populateFromArray');

      modifyGetCellCoords.calls.reset();

      getActiveEditor().saveValue('test');

      expect(modifyGetCellCoords).toHaveBeenCalledWith(1, 2, false, 'meta');
      expect(modifyGetCellCoords).toHaveBeenCalledTimes(1);
    });

    it('should be fired before the DOM element is get', () => {
      const modifyGetCellCoords = jasmine.createSpy('modifyGetCellCoords');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyGetCellCoords,
      });

      modifyGetCellCoords.calls.reset();
      getCell(1, 2);

      expect(modifyGetCellCoords).toHaveBeenCalledWith(1, 2, undefined, 'render');
      expect(modifyGetCellCoords).toHaveBeenCalledTimes(1);
    });
  });
});
