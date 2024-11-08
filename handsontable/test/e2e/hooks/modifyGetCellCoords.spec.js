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

    it('should be fired before the DOM element is being retrieved', () => {
      const modifyGetCellCoords = jasmine.createSpy('modifyGetCellCoords');

      handsontable({
        data: createSpreadsheetData(5, 5),
        modifyGetCellCoords,
      });

      modifyGetCellCoords.calls.reset();
      getCell(1, 2);

      expect(modifyGetCellCoords).toHaveBeenCalledWith(1, 2, false, 'render');
      expect(modifyGetCellCoords).toHaveBeenCalledTimes(1);
    });

    it('should open editor for proper cell', () => {
      handsontable({
        data: createSpreadsheetData(5, 5),
        rowHeaders: true,
        colHeaders: true,
        columns: [
          {},
          {},
          {},
          {},
          {},
        ],
        modifyGetCellCoords(visualRow, visualColumn) {
          if (visualColumn === 1) {
            visualColumn -= 1;
          }

          visualRow += 1;

          return [visualRow, visualColumn];
        }
      });

      mouseDoubleClick(spec().$container.find('tr:eq(1) td:eq(1)'));

      let editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(editor.TD).toBe(spec().$container.find('tr:eq(2) td:eq(0)')[0]);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('A2');

      // Closing the editor.
      keyDownUp('enter');

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(false);
      expect(editor.isInFullEditMode()).toBe(false);

      mouseDoubleClick(spec().$container.find('tr:eq(1) td:eq(2)'));

      editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(editor.TD).toBe(spec().$container.find('tr:eq(2) td:eq(2)')[0]);
      expect(spec().$container.find('.handsontableInputHolder textarea').val()).toEqual('C2');
    });

    it('should cooperate with cell meta properly', async() => {
      handsontable({
        data: [
          ['one', 'two'],
          ['three', 'four']
        ],
        rowHeaders: true,
        colHeaders: true,
        columns: [
          { editor: 'select', selectOptions: ['one', 'two', 'three', 'four'] },
          { readOnly: true }, // Should we be able to click on read only cell?
        ],
        modifyGetCellCoords(visualRow, visualColumn) {
          if (visualColumn === 1) {
            visualColumn -= 1;
          }

          visualRow += 1;

          return [visualRow, visualColumn];
        }
      });

      mouseDoubleClick(spec().$container.find('tr:eq(1) td:eq(1)'));

      const editor = getActiveEditor();

      expect(editor.isOpened()).toBe(true);
      expect(editor.isInFullEditMode()).toBe(true);
      expect(editor.TD).toBe(spec().$container.find('tr:eq(2) td:eq(0)')[0]);
      expect(editor.select).toBe(spec().$container.find('select')[0]);
      expect(editor.select.length).toBe(4);
      expect(editor.select.value).toBe('three');
    });
  });
});
