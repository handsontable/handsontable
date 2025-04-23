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

    await alter('remove_col', 1, 2);
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

  it('should undo and redo the remove action after column moving (#dev-2071)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      manualColumnMove: true,
    });

    getPlugin('manualColumnMove').moveColumn(4, 0);
    await render();
    await alter('remove_col', 1, 1);
    getPlugin('undoRedo').undo();

    expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'B1', 'C1', 'D1']);

    getPlugin('undoRedo').undo();

    expect(getDataAtRow(0)).toEqual(['A1', 'B1', 'C1', 'D1', 'E1']);

    getPlugin('undoRedo').redo();

    expect(getDataAtRow(0)).toEqual(['E1', 'A1', 'B1', 'C1', 'D1']);

    getPlugin('undoRedo').redo();

    expect(getDataAtRow(0)).toEqual(['E1', 'B1', 'C1', 'D1']);
  });
});
