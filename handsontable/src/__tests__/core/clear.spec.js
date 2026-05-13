describe('Core.clear', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should clear all cell data', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await clear();

    expect(getData()).toEqual([
      [null, null, null],
      [null, null, null],
      [null, null, null],
    ]);
  });

  it('should not leave any cells selected after clearing', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await selectCell(0, 0);
    await clear();

    expect(getSelected()).toBeUndefined();
  });

  it('should not select any cells when no selection existed before clearing', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
    });

    await clear();

    expect(getSelected()).toBeUndefined();
  });

  it('should keep table settings intact after clearing', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      colHeaders: true,
      rowHeaders: true,
    });

    await clear();

    expect(hot().getSettings().colHeaders).toBe(true);
    expect(hot().getSettings().rowHeaders).toBe(true);
    expect(hot().countRows()).toBe(3);
    expect(hot().countCols()).toBe(3);
  });

  it('should not clear read-only cells', async() => {
    handsontable({
      data: createSpreadsheetData(3, 3),
      cells(row, col) {
        if (row === 0 && col === 0) {
          return { readOnly: true };
        }
      },
    });

    await clear();

    expect(getDataAtCell(0, 0)).toBe('A1');
    expect(getDataAtCell(0, 1)).toBeNull();
  });
});
