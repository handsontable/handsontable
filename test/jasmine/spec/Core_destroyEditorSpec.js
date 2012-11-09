describe('Core_destroyEditor', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('editor should not be visible', function () {
    runs(function () {
      handsontable();
      selectCell(1, 1);
      keyDownUp('enter');
    });

    waits(1);

    runs(function () {
      destroyEditor();
      expect(isEditorVisible()).toEqual(false);
    });
  });

  it('value should be saved', function () {
    runs(function () {
      handsontable();
      selectCell(1, 1);
      keyDownUp('enter');
      this.$keyboardProxy.val('Ted');
    });

    waits(1);

    runs(function () {
      destroyEditor();
      expect(getDataAtCell(1, 1)).toEqual('Ted');
    });
  });

  it('cell should be selected', function () {
    runs(function () {
      handsontable();
      selectCell(1, 1);
      keyDownUp('enter');
    });

    waits(1);

    runs(function () {
      destroyEditor();
      expect(getSelected()).toEqual([1, 1, 1, 1]);
    });
  });

  it('should revert original value when param set to true', function () {
    runs(function () {
      handsontable();
      selectCell(1, 1);
      keyDownUp('enter');
      this.$keyboardProxy.val('Ted');
    });

    waits(1);

    runs(function () {
      destroyEditor(true);
      expect(getDataAtCell(1, 1)).toEqual(null);
    });
  });
});