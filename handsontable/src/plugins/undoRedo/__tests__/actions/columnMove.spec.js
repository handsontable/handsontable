describe('UndoRedo -> ColumnMove action', () => {
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
      manualColumnMove: true,
      afterUndo,
    });

    getPlugin('manualColumnMove').moveColumns([1, 2], 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'col_move',
      columns: [1, 2],
      finalColumnIndex: 2,
    });
  });
});
