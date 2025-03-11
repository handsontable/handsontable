describe('UndoRedo -> RemoveRow action', () => {
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
      afterUndo,
    });

    alter('remove_row', 1, 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith(jasmine.objectContaining({
      actionType: 'remove_row',
      index: 1,
      data: [
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3']
      ],
      rowIndexesSequence: [0, 1, 2, 3, 4],
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
      removedCellMetas: [],
    }));
  });
});
