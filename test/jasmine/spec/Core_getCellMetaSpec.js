describe('Core_getCellMeta', function () {
  var id = 'testContainer';

  beforeEach(function () {
    this.$container = $('<div id="' + id + '"></div>').appendTo('body');
  });

  afterEach(function () {
    if (this.$container) {
      this.$container.remove();
    }
  });

  it('should not allow manual editing of a read only cell', function () {
    runs(function () {
      handsontable();
      setCellReadOnly(2, 2);
      selectCell(2, 2);
      keyDown('enter');
    });

    waits(1);

    runs(function () {
      expect(isEditorVisible()).toEqual(false);
    });
  });

  it('should allow manual editing of cell that is no longer read only', function () {
    runs(function () {
      handsontable();
      setCellReadOnly(2, 2);
      setCellEditable(2, 2);
      selectCell(2, 2);
      keyDown('enter');
    });

    waits(1);

    runs(function () {
      expect(isEditorVisible()).toEqual(true);
    });
  });
});