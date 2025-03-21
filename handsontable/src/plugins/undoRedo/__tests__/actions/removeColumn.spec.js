describe('UndoRedo -> RemoveColumn action', () => {
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

    alter('remove_col', 1, 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'remove_col',
      index: 1,
      indexes: [1, 2],
      data: [
        ['B1', 'C1'],
        ['B2', 'C2'],
        ['B3', 'C3'],
        ['B4', 'C4'],
        ['B5', 'C5'],
      ],
      amount: 2,
      headers: [],
      columnPositions: [0, 1, 2, 3, 4],
      rowPositions: [0, 1, 2, 3, 4],
      fixedColumnsStart: 0,
      removedCellMetas: [],
    });
  });
});
