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
      removedCellMetas: [
        [0, 1, jasmine.objectContaining({ visualRow: 0, visualCol: 1, row: 0, col: 1, prop: 1 })],
        [1, 1, jasmine.objectContaining({ visualRow: 1, visualCol: 1, row: 1, col: 1, prop: 1 })],
        [2, 1, jasmine.objectContaining({ visualRow: 2, visualCol: 1, row: 2, col: 1, prop: 1 })],
        [3, 1, jasmine.objectContaining({ visualRow: 3, visualCol: 1, row: 3, col: 1, prop: 1 })],
        [4, 1, jasmine.objectContaining({ visualRow: 4, visualCol: 1, row: 4, col: 1, prop: 1 })],
        [5, 1, jasmine.objectContaining({ visualRow: 5, visualCol: 1, row: 5, col: 1, prop: 1 })],
        [0, 2, jasmine.objectContaining({ visualRow: 0, visualCol: 2, row: 0, col: 2, prop: 2 })],
        [1, 2, jasmine.objectContaining({ visualRow: 1, visualCol: 2, row: 1, col: 2, prop: 2 })],
        [2, 2, jasmine.objectContaining({ visualRow: 2, visualCol: 2, row: 2, col: 2, prop: 2 })],
        [3, 2, jasmine.objectContaining({ visualRow: 3, visualCol: 2, row: 3, col: 2, prop: 2 })],
        [4, 2, jasmine.objectContaining({ visualRow: 4, visualCol: 2, row: 4, col: 2, prop: 2 })],
        [5, 2, jasmine.objectContaining({ visualRow: 5, visualCol: 2, row: 5, col: 2, prop: 2 })],
      ],
      removedMergedCells: [],
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
