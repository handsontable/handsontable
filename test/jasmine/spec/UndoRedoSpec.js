describe('UndoRedo', function () {
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

  it('should undo single change', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    setDataAtCell(0, 0, 'new value');

    HOT.undo();
    expect(getDataAtCell(0, 0)).toBe('A0');
  });

  it('should redo single change', function () {
    handsontable({
      data: createSpreadsheetData(2, 2)
    });
    var HOT = getInstance();

    setDataAtCell(0, 0, 'new value');

    HOT.undo();
    HOT.redo();
    expect(getDataAtCell(0, 0)).toBe('new value');
  });
});