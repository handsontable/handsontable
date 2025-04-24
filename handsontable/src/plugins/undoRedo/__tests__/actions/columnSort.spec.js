describe('UndoRedo -> ColumnSort action', () => {
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

  it('should have defined correct action properties', async() => {
    const afterUndo = jasmine.createSpy('afterUndo');

    handsontable({
      data: createSpreadsheetData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      columnSorting: true,
      afterUndo,
    });

    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'col_sort',
      previousSortState: [],
      nextSortState: [{ column: 1, sortOrder: 'asc' }],
    });
  });
});
