describe('UndoRedo -> MergeCells action', () => {
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
      mergeCells: true,
      afterUndo,
    });

    getPlugin('mergeCells').merge(1, 1, 3, 3);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'merge_cells',
      cellRange: {
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 3, col: 3 },
      },
      data: [
        ['B2', 'C2', 'D2'],
        ['B3', 'C3', 'D3'],
        ['B4', 'C4', 'D4'],
      ],
    });
  });

  it('should not throw an error after undoing cell merging triggered when the row header was selected', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
      mergeCells: true,
    });

    await selectRows(1);
    getPlugin('contextMenu').executeCommand('mergeCells');

    expect(() => {
      getPlugin('undoRedo').undo();
    }).not.toThrowError();
  });

  it('should not throw an error after undoing cell merging triggered when the column header was selected', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
      mergeCells: true,
    });

    await selectColumns(1);
    getPlugin('contextMenu').executeCommand('mergeCells');

    expect(() => {
      getPlugin('undoRedo').undo();
    }).not.toThrowError();
  });

  it('should not throw an error after redoing cell merging triggered when the row header was selected', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
      mergeCells: true,
    });

    await selectRows(1);
    getPlugin('contextMenu').executeCommand('mergeCells');
    getPlugin('undoRedo').undo();

    expect(() => {
      getPlugin('undoRedo').redo();
    }).not.toThrowError();
  });

  it('should not throw an error after redoing cell merging triggered when the column header was selected', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      contextMenu: true,
      mergeCells: true,
    });

    await selectColumns(1);
    getPlugin('contextMenu').executeCommand('mergeCells');
    getPlugin('undoRedo').undo();

    expect(() => {
      getPlugin('undoRedo').redo();
    }).not.toThrowError();
  });
});
