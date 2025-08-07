describe('Pagination `getCurrentPageData` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return correct data for the current page (array of arrays)', async() => {
    handsontable({
      data: createSpreadsheetData(45, 5),
      pagination: {
        pageSize: 5,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1'],
      ['A2', 'B2', 'C2', 'D2', 'E2'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
    ]);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A6', 'B6', 'C6', 'D6', 'E6'],
      ['A7', 'B7', 'C7', 'D7', 'E7'],
      ['A8', 'B8', 'C8', 'D8', 'E8'],
      ['A9', 'B9', 'C9', 'D9', 'E9'],
      ['A10', 'B10', 'C10', 'D10', 'E10'],
    ]);
  });

  it('should return correct data for the current page (array of objects)', async() => {
    handsontable({
      data: createSpreadsheetObjectData(45, 5),
      pagination: {
        pageSize: 5,
      },
    });

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A1', 'B1', 'C1', 'D1', 'E1'],
      ['A2', 'B2', 'C2', 'D2', 'E2'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
    ]);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A6', 'B6', 'C6', 'D6', 'E6'],
      ['A7', 'B7', 'C7', 'D7', 'E7'],
      ['A8', 'B8', 'C8', 'D8', 'E8'],
      ['A9', 'B9', 'C9', 'D9', 'E9'],
      ['A10', 'B10', 'C10', 'D10', 'E10'],
    ]);
  });

  it('should return correct data for the current page after sorting', async() => {
    handsontable({
      data: createSpreadsheetData(15, 5),
      pagination: {
        pageSize: 5,
      },
    });

    rowIndexMapper().setIndexesSequence([9, 7, 4, 2, 1, 3, 5, 6, 8, 0, 10, 11, 12, 13, 14]);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A10', 'B10', 'C10', 'D10', 'E10'],
      ['A8', 'B8', 'C8', 'D8', 'E8'],
      ['A5', 'B5', 'C5', 'D5', 'E5'],
      ['A3', 'B3', 'C3', 'D3', 'E3'],
      ['A2', 'B2', 'C2', 'D2', 'E2'],
    ]);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A6', 'B6', 'C6', 'D6', 'E6'],
      ['A7', 'B7', 'C7', 'D7', 'E7'],
      ['A9', 'B9', 'C9', 'D9', 'E9'],
      ['A1', 'B1', 'C1', 'D1', 'E1'],
    ]);
  });

  it('should return correct data for the current page for hidden rows', async() => {
    handsontable({
      data: createSpreadsheetData(20, 5),
      pagination: {
        pageSize: 5,
      },
    });

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(8, true);
    hidingMap.setValueAtIndex(9, true);
    hidingMap.setValueAtIndex(12, true);
    hidingMap.setValueAtIndex(13, true);
    hidingMap.setValueAtIndex(14, true);
    hidingMap.setValueAtIndex(17, true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A2', 'B2', 'C2', 'D2', 'E2'],
      ['A3', 'B3', 'C3', 'D3', 'E3'], // hidden row
      ['A4', 'B4', 'C4', 'D4', 'E4'],
      ['A5', 'B5', 'C5', 'D5', 'E5'], // hidden row
      ['A6', 'B6', 'C6', 'D6', 'E6'],
      ['A7', 'B7', 'C7', 'D7', 'E7'],
      ['A8', 'B8', 'C8', 'D8', 'E8'],
    ]);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A11', 'B11', 'C11', 'D11', 'E11'],
      ['A12', 'B12', 'C12', 'D12', 'E12'],
      ['A13', 'B13', 'C13', 'D13', 'E13'], // hidden row
      ['A14', 'B14', 'C14', 'D14', 'E14'], // hidden row
      ['A15', 'B15', 'C15', 'D15', 'E15'], // hidden row
      ['A16', 'B16', 'C16', 'D16', 'E16'],
      ['A17', 'B17', 'C17', 'D17', 'E17'],
      ['A18', 'B18', 'C18', 'D18', 'E18'], // hidden row
      ['A19', 'B19', 'C19', 'D19', 'E19'],
    ]);
  });

  it('should return empty array when all rows are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(6, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

    await render();

    expect(getPlugin('pagination').getCurrentPageData()).toEqual([]);
  });
});
