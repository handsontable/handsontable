describe('UndoRedo -> CellAlignment action', () => {
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
      contextMenu: true,
      afterUndo,
    });

    selectCells([[1, 1, 2, 2]]);
    contextMenu();

    await selectContextSubmenuOption('Alignment', 'Right');

    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'cell_alignment',
      alignment: 'htRight',
      range: [{
        highlight: { row: 1, col: 1 },
        from: { row: 1, col: 1 },
        to: { row: 2, col: 2 },
      }],
      stateBefore: { 1: [ null, null, null ], 2: [ null, null, null ] },
      type: 'horizontal',
    });
  });
});
