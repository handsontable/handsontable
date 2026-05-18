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

    await alter('remove_row', 1, 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'remove_row',
      index: 1,
      data: [
        ['A2', 'B2', 'C2', 'D2', 'E2'],
        ['A3', 'B3', 'C3', 'D3', 'E3']
      ],
      rowIndexesSequence: [0, 1, 2, 3, 4],
      fixedRowsTop: 0,
      fixedRowsBottom: 0,
      removedCellMetas: [
        [1, 0, jasmine.objectContaining({ visualRow: 1, visualCol: 0, row: 1, col: 0, prop: 0 })],
        [2, 0, jasmine.objectContaining({ visualRow: 2, visualCol: 0, row: 2, col: 0, prop: 0 })],
        [1, 1, jasmine.objectContaining({ visualRow: 1, visualCol: 1, row: 1, col: 1, prop: 1 })],
        [2, 1, jasmine.objectContaining({ visualRow: 2, visualCol: 1, row: 2, col: 1, prop: 1 })],
        [1, 2, jasmine.objectContaining({ visualRow: 1, visualCol: 2, row: 1, col: 2, prop: 2 })],
        [2, 2, jasmine.objectContaining({ visualRow: 2, visualCol: 2, row: 2, col: 2, prop: 2 })],
        [1, 3, jasmine.objectContaining({ visualRow: 1, visualCol: 3, row: 1, col: 3, prop: 3 })],
        [2, 3, jasmine.objectContaining({ visualRow: 2, visualCol: 3, row: 2, col: 3, prop: 3 })],
        [1, 4, jasmine.objectContaining({ visualRow: 1, visualCol: 4, row: 1, col: 4, prop: 4 })],
        [2, 4, jasmine.objectContaining({ visualRow: 2, visualCol: 4, row: 2, col: 4, prop: 4 })],
      ],
      removedMergedCells: [],
    });
  });

  it('should undo and redo the remove action after row moving (#dev-2071)', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      manualRowMove: true,
    });

    getPlugin('manualRowMove').moveRow(4, 0);
    await render();
    await alter('remove_row', 1, 1);
    getPlugin('undoRedo').undo();

    expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A2', 'A3', 'A4']);

    getPlugin('undoRedo').undo();

    expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);

    getPlugin('undoRedo').redo();

    expect(getDataAtCol(0)).toEqual(['A5', 'A1', 'A2', 'A3', 'A4']);

    getPlugin('undoRedo').redo();

    expect(getDataAtCol(0)).toEqual(['A5', 'A2', 'A3', 'A4']);
  });
});
