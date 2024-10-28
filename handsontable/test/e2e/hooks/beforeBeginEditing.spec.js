describe('Hook', () => {
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

  describe('beforeBeginEditing', () => {
    it('should be fired after opening the editor using Enter key', () => {
      const beforeBeginEditing = jasmine.createSpy('beforeBeginEditing');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing,
      });

      selectCell(1, 2);
      keyDownUp('enter');

      expect(beforeBeginEditing).toHaveBeenCalledWith(1, 2, null, jasmine.any(Event), true);
    });

    it('should be fired after opening the editor using F2 key', () => {
      const beforeBeginEditing = jasmine.createSpy('beforeBeginEditing');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing,
      });

      selectCell(1, 2);
      keyDownUp('f2');

      expect(beforeBeginEditing).toHaveBeenCalledWith(1, 2, null, jasmine.any(Event), true);
    });

    it('should be fired after opening the editor by typing any printable character', () => {
      const beforeBeginEditing = jasmine.createSpy('beforeBeginEditing');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing,
      });

      selectCell(1, 2);
      keyDownUp('g');

      expect(beforeBeginEditing).toHaveBeenCalledWith(1, 2, '', jasmine.any(Event), false);
    });

    it('should be fired after calling the `openEditor` method', () => {
      const beforeBeginEditing = jasmine.createSpy('beforeBeginEditing');

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing,
      });

      selectCell(1, 2);
      hot._getEditorManager().openEditor('test');

      expect(beforeBeginEditing).toHaveBeenCalledWith(1, 2, 'test', undefined, false);
    });

    it('should be fired before the `afterBeginEditing` hook', () => {
      const beforeBeginEditing = jasmine.createSpy('beforeBeginEditing');
      const afterBeginEditing = jasmine.createSpy('afterBeginEditing');

      const hot = handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing,
        afterBeginEditing,
      });

      selectCell(1, 2);
      hot._getEditorManager().openEditor('test');

      expect(beforeBeginEditing).toHaveBeenCalledWith(1, 2, 'test', undefined, false);
      expect(beforeBeginEditing).toHaveBeenCalledBefore(afterBeginEditing);
    });

    it('should be possible to prevent opening the editor', () => {
      const beforeBeginEditing = jasmine.createSpy('beforeBeginEditing').and.returnValue(false);

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing,
      });

      selectCell(1, 2);
      keyDownUp('enter');

      expect(isEditorVisible()).toBe(false);
      expect(getActiveEditor()).toBeUndefined();
    });
  });
});
