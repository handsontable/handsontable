describe('UndoRedo -> CreateColumn action', () => {
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

    await alter('insert_col_start', 1, 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'insert_col',
      index: 1,
      amount: 2,
    });

    afterUndo.calls.reset();
    await alter('insert_col_end', 2, 3);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'insert_col',
      index: 3,
      amount: 3,
    });
  });
});
