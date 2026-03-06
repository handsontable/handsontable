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

  it('should be possible to select only visible columns (pageSize as a number)', async() => {
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

  it('should be possible to select only visible columns (pageSize as "auto")', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 500,
      height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight() + 10, // 10px gap/buffer
      rowHeaders: true,
      colHeaders: true,
      pagination: {
        pageSize: 'auto',
        initialPage: 2,
      },
    });

    await selectColumns(2, 2, -1);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 7,2']);
    expect(`
      |   ║   :   : - :   :   |
      |===:===:===:===:===:===|
      | - ║   :   : A :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should correctly select columns for different pages when pageSize is "auto"', async() => {
    handsontable({
      data: createSpreadsheetData(10, 5),
      width: 500,
      height: (getDefaultRowHeight() * 5) + getPaginationContainerHeight() + 10, // 10px gap/buffer
      rowHeaders: true,
      colHeaders: true,
      pagination: {
        pageSize: 'auto',
        initialPage: 1,
      },
    });

    await selectColumns(2);

    const plugin = getPlugin('pagination');

    expect(getSelectedRange()).toEqualCellRange(['highlight: 0,2 from: -1,2 to: 3,2']);
    expect(`
      |   ║   :   : - :   :   |
      |===:===:===:===:===:===|
      | - ║   :   : A :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();

    await plugin.nextPage();
    await selectColumns(2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 4,2 from: 4,2 to: 7,2']);
    expect(`
      |   ║   :   : - :   :   |
      |===:===:===:===:===:===|
      | - ║   :   : A :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();

    await plugin.nextPage();
    await selectColumns(2);

    expect(getSelectedRange()).toEqualCellRange(['highlight: 8,2 from: 8,2 to: 9,2']);
    expect(`
      |   ║   :   : - :   :   |
      |===:===:===:===:===:===|
      | - ║   :   : A :   :   |
      | - ║   :   : 0 :   :   |
    `).toBeMatchToSelectionPattern();
  });

  it('should be possible to select only visible columns (navigableHeaders: true)', async() => {
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

  it('should be possible to select only visible columns by extending a column selection', async() => {
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

  it('should be possible to select only visible columns by extending a column selection (navigableHeaders: true)', async() => {
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

  it('should be possible to select only visible columns by clicking a corner', async() => {
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

  it('should be possible to select only visible columns by clicking a corner (navigableHeaders: true)', async() => {
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
