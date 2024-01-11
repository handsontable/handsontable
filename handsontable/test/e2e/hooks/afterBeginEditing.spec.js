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

  describe('afterBeginEditing', () => {
    it('should be fired after editing the editor\'s value', () => {
      const afterBeginEditing = jasmine.createSpy('afterBeginEditing');

      handsontable({
        data: createSpreadsheetData(5, 5),
        afterBeginEditing,
      });

      selectCell(1, 2);
      keyDownUp('enter'); // open editor
      keyDownUp('enter'); // save and close editor

      expect(afterBeginEditing).toHaveBeenCalledWith(1, 2);
    });

    it('should not be fired when editor was blocked by `beforeBeginEditing` hook', () => {
      const afterBeginEditing = jasmine.createSpy('afterBeginEditing');

      handsontable({
        data: createSpreadsheetData(5, 5),
        beforeBeginEditing: () => false,
        afterBeginEditing,
      });

      selectCell(1, 2);
      keyDownUp('enter'); // open editor
      keyDownUp('enter'); // save and close editor

      expect(afterBeginEditing).not.toHaveBeenCalled();
    });
  });
});
