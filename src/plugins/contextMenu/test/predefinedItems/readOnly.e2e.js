describe('ContextMenuReadOnly', () => {
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

  it('should trigger `afterSetCellMeta` callback after changing cell to read only by context menu', () => {
    const afterSetCellMetaCallback = jasmine.createSpy('afterSetCellMetaCallback');
    const rows = 5;
    const columns = 5;

    handsontable({
      data: Handsontable.helper.createSpreadsheetData(rows, columns),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      afterSetCellMeta: afterSetCellMetaCallback
    });

    selectCell(2, 3);
    contextMenu();

    const changeToReadOnlyButton = $('.htItemWrapper').filter(function() {
      return $(this).text() === 'Read only';
    })[0];

    $(changeToReadOnlyButton).simulate('mousedown').simulate('mouseup');
    expect(afterSetCellMetaCallback).toHaveBeenCalledWith(2, 3, 'readOnly', true, undefined, undefined);
  });

  it('should not change readOnly property to true after changing cell to read only by context menu, if `beforeSetCellMeta` returned false', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      contextMenu: true,
      beforeSetCellMeta: () => false
    });

    selectCell(2, 3);
    contextMenu();

    const changeToReadOnlyButton = $('.htItemWrapper').filter(function() {
      return $(this).text() === 'Read only';
    })[0];

    $(changeToReadOnlyButton).simulate('mousedown').simulate('mouseup');

    expect(getCellMeta(2, 3).readOnly).toBe(false);
  });
});
