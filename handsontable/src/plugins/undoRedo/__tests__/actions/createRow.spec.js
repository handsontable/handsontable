describe('UndoRedo -> CreateRow action', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      $('body').find(`#${id}`).remove();
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

    alter('insert_row_above', 1, 2);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'insert_row',
      index: 1,
      amount: 2,
    });

    afterUndo.calls.reset();
    alter('insert_row_below', 2, 3);
    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'insert_row',
      index: 3,
      amount: 3,
    });
  });
});
