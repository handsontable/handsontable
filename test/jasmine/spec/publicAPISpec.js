describe('Public API', function () {

  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  describe('Plugins', function () {
    it('should expose static method for registering external plugins', function () {
      expect(Handsontable.plugins.registerPlugin).toBeFunction();
    });

    it('should expose BasePlugin class', function () {
      expect(Handsontable.plugins.BasePlugin).toBeFunction();
    });

    it('should expose all registered plugin classes', function () {
      expect(Handsontable.plugins.AutoColumnSize).toBeFunction();
      expect(Handsontable.plugins.AutoRowSize).toBeFunction();
      expect(Handsontable.plugins.ColumnSorting).toBeFunction();
      expect(Handsontable.plugins.Comments).toBeFunction();
      expect(Handsontable.plugins.ContextMenu).toBeFunction();
      expect(Handsontable.plugins.ContextMenuCopyPaste).toBeFunction();
      expect(Handsontable.plugins.DragToScroll).toBeFunction();
      expect(Handsontable.plugins.ManualColumnFreeze).toBeFunction();
      expect(Handsontable.plugins.ManualColumnResize).toBeFunction();
      expect(Handsontable.plugins.ManualRowResize).toBeFunction();
      expect(Handsontable.plugins.MultipleSelectionHandles).toBeFunction();
      expect(Handsontable.plugins.TouchScroll).toBeFunction();
    });
  });

  describe('Editors', function () {
    it('should expose static method for registering external editors', function () {
      expect(Handsontable.editors.registerEditor).toBeFunction();
    });

    it('should expose BaseEditor class', function () {
      expect(Handsontable.editors.BaseEditor).toBeFunction();
    });

    it('should expose all registered editor classes', function () {
      expect(Handsontable.editors.AutocompleteEditor).toBeFunction();
      expect(Handsontable.editors.CheckboxEditor).toBeFunction();
      expect(Handsontable.editors.DateEditor).toBeFunction();
      expect(Handsontable.editors.DropdownEditor).toBeFunction();
      expect(Handsontable.editors.HandsontableEditor).toBeFunction();
      expect(Handsontable.editors.MobileEditor).toBeFunction();
      expect(Handsontable.editors.NumericEditor).toBeFunction();
      expect(Handsontable.editors.PasswordEditor).toBeFunction();
      expect(Handsontable.editors.SelectEditor).toBeFunction();
      expect(Handsontable.editors.TextEditor).toBeFunction();
    });
  });
});
