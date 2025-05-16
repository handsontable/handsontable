describe('Pagination with selection', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to select only visible rows', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await selectColumns(2, 2, -1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 5,2']);
    expect(`
      |   ║   :   : - :   :   |
      |===:===:===:===:===:===|
      | - ║   :   : A :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select only visible rows (navigableHeaders: true)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await selectColumns(2, 2, -1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 5,2']);
    expect(`
      |   ║   :   : - :   :   |
      |===:===:===:===:===:===|
      | - ║   :   : A :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select only visible rows by extending a column selection', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await mouseDown(getCell(-1, 2));
    await mouseOver(getCell(-1, 3));
    await mouseUp(getCell(-1, 3));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 5,3']);
    expect(`
      |   ║   :   : - : - :   |
      |===:===:===:===:===:===|
      | - ║   :   : A : 0 :   |
      | - ║   :   : 0 : 0 :   |
      | - ║   :   : 0 : 0 :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select only visible rows by extending a column selection (navigableHeaders: true)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await mouseDown(getCell(-1, 2));
    await mouseOver(getCell(-1, 3));
    await mouseUp(getCell(-1, 3));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,2 from: 3,2 to: 5,3']);
    expect(`
      |   ║   :   : - : - :   |
      |===:===:===:===:===:===|
      | - ║   :   : A : 0 :   |
      | - ║   :   : 0 : 0 :   |
      | - ║   :   : 0 : 0 :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select only visible rows by clicking a corner', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await simulateClick(getCell(-1, -1));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 5,4']);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | - ║ A : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select only visible rows by clicking a corner (navigableHeaders: true)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await simulateClick(getCell(-1, -1));

    expect(getSelectedRange()).toEqualCellRange(['highlight: 3,0 from: 3,-1 to: 5,4']);
    expect(`
      |   ║ - : - : - : - : - |
      |===:===:===:===:===:===|
      | - ║ A : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
      | - ║ 0 : 0 : 0 : 0 : 0 |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select column header', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      rowHeaders: true,
      colHeaders: true,
      navigableHeaders: true,
      pagination: {
        pageSize: 3,
        initialPage: 2,
      },
    });

    await selectCell(-1, 1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: -1,1 from: -1,1 to: -1,1']);
    expect(`
      |   ║   : # :   :   :   |
      |===:===:===:===:===:===|
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
      |   ║   :   :   :   :   |
    `).toBeMatchToSelectionPattern();
  });
});
