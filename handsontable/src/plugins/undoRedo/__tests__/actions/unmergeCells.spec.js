describe('UndoRedo -> UnmergeCells action', () => {
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
      mergeCells: [{ row: 1, col: 1, rowspan: 3, colspan: 3 }],
      afterUndo,
    });

    getPlugin('mergeCells').unmerge(1, 1, 3, 3);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'unmerge_cells',
      cellRange: {
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 3, col: 3 },
      },
    });
  });
});
