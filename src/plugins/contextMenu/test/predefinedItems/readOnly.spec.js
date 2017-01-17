describe('ContextMenuReadOnly', function () {
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

  it('should trigger `afterSetCellMeta` callback after changing cell to read only by context menu', function () {
    var afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
    var rows = 5, columns = 5;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(rows, columns),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      afterSetCellMeta: afterSetCellMetaCallback
    });

    selectCell(2, 3);
    contextMenu();

    var changeToReadOnluButton = $('.htItemWrapper').filter(function () {
      return $(this).text() === 'Read only';
    })[0];

    $(changeToReadOnluButton).simulate('mousedown');
    expect(afterSetCellMetaCallback).toHaveBeenCalledWith(2, 3, 'readOnly', true, undefined, undefined);
  });
});
