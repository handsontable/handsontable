describe('UndoRedo -> DataChange action', () => {
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

    await setDataAtCell(1, 2, 'test');

    getPlugin('undoRedo').undo();

    expect(afterUndo).toHaveBeenCalledWith({
      actionType: 'change',
      changes: [[1, 2, 'C2', 'test']],
      selected: [[1, 2]],
      countCols: 5,
      countRows: 5,
    });
  });

  it('should undo and redo the change when the async validator is used', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      validator: (value, callback) => {
        setTimeout(() => {
          callback(false);
        }, 5);
      }
    });

    await setDataAtCell([[4, 0, 'x'], [5, 0, 'y'], [6, 0, 'z']]);
    await sleep(50); // wait for async validation

    getPlugin('undoRedo').undo();

    await sleep(50); // wait for async validation

    expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'A5']);

    getPlugin('undoRedo').redo();

    await sleep(50); // wait for async validation

    expect(getDataAtCol(0)).toEqual(['A1', 'A2', 'A3', 'A4', 'x', 'y', 'z']);
  });
});
