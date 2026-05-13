describe('Core.getSelectedActive', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return `undefined` if there is no selection', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
    });

    expect(getSelectedActive()).toBeUndefined();
  });

  it('should return the range coordinates of the latest selection layer', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
    });

    await selectCells([[0, 0, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3]]);

    expect(getSelectedActive()).toEqual([2, 2, 3, 3]);
  });

  it('should return the range coordinates of the active selection layer', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
    });

    await selectCells([[0, 0, 1, 1], [1, 1, 2, 2], [2, 2, 3, 3]]);
    await keyDownUp(['shift', 'tab']); // select the previous selection layer

    expect(getSelectedActive()).toEqual([1, 1, 2, 2]);
  });
});
