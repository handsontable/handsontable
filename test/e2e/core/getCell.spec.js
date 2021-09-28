describe('Core.getCell', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return corner TH element from the correct overlay when all rows are hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      hiddenRows: {
        rows: [0, 1, 2, 3, 4],
        indicators: true,
      },
    });

    expect(getCell(-1, -1)).toBe(getMaster().find('thead tr:eq(0) th:eq(0)')[0]);
    expect(getCell(-1, -1, true)).toBe(getTopLeftClone().find('thead tr:eq(0) th:eq(0)')[0]);
  });

  it('should return corner TH element from the correct overlay when all columns are hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      hiddenColumns: {
        columns: [0, 1, 2, 3, 4],
        indicators: true,
      },
    });

    expect(getCell(-1, -1)).toBe(getMaster().find('thead tr:eq(0) th:eq(0)')[0]);
    expect(getCell(-1, -1, true)).toBe(getTopLeftClone().find('thead tr:eq(0) th:eq(0)')[0]);
  });

  it('should return corner TH element from the correct overlay when all indexes are hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      hiddenColumns: {
        columns: [0, 1, 2, 3, 4],
        indicators: true,
      },
      hiddenRows: {
        rows: [0, 1, 2, 3, 4],
        indicators: true,
      },
    });

    expect(getCell(-1, -1)).toBe(getMaster().find('thead tr:eq(0) th:eq(0)')[0]);
    expect(getCell(-1, -1, true)).toBe(getTopLeftClone().find('thead tr:eq(0) th:eq(0)')[0]);
  });

  it('should return row header TH element when all columns are hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      hiddenColumns: {
        columns: [0, 1, 2, 3, 4],
        indicators: true,
      },
    });

    expect(getCell(2, -1)).toBe(getMaster().find('tbody tr:eq(2) th:eq(0)')[0]);
    expect(getCell(2, -1, true)).toBe(getLeftClone().find('tbody tr:eq(2) th:eq(0)')[0]);
  });

  it('should return row header TH element when all rows are hidden', () => {
    handsontable({
      data: Handsontable.helper.createSpreadsheetObjectData(5, 5),
      rowHeaders: true,
      colHeaders: true,
      hiddenRows: {
        rows: [0, 1, 2, 3, 4],
        indicators: true,
      },
    });

    expect(getCell(-1, 2)).toBe(getMaster().find('thead tr:eq(0) th:eq(3)')[0]);
    expect(getCell(-1, 2, true)).toBe(getTopClone().find('thead tr:eq(0) th:eq(3)')[0]);
  });
});
