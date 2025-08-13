describe('Core.getValue', () => {
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

  it('should return `null` if there is no selection', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
    });

    expect(getValue()).toBeNull();
  });

  it('should return `null` if the cell is a header', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
    });

    await selectCell(-1, 1);

    expect(getValue()).toBeNull();

    await selectCell(1, -1);

    expect(getValue()).toBeNull();

    await selectCell(-1, -1);

    expect(getValue()).toBeNull();
  });

  it('should return focused cell value', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
    });

    await selectCell(1, 1);

    expect(getValue()).toBe('B2');
  });

  it('should return focused cell value for active selection layer', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      rowHeaders: true,
      colHeaders: true,
    });

    await selectCells([[0, 0, 1, 1], [2, 2, 3, 3], [4, 4, 5, 5]]);
    await keyDownUp(['shift', 'tab']); // select the previous selection layer

    expect(getValue()).toBe('D4');

    await keyDownUp(['shift', 'tab']);
    await keyDownUp(['shift', 'tab']);
    await keyDownUp(['shift', 'tab']);
    await keyDownUp(['shift', 'tab']); // select the previous selection layer

    expect(getValue()).toBe('B2');
  });
});
