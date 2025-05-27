describe('Pagination', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be possible to enable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(20, 10),
      pagination: true,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(true);
    expect(countVisibleRows()).toBe(10);
  });

  it('should be possible to disable the plugin', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    await updateSettings({
      pagination: false,
    });

    const plugin = getPlugin('pagination');

    expect(plugin.isEnabled()).toBe(false);
    expect(countVisibleRows()).toBe(10);
  });

  it('should recalculate the internal state correctly after inserting new rows (complex scenario)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().setIndexesSequence([9, 7, 4, 2, 1, 3, 5, 6, 8, 0]);

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(8, true);
    hidingMap.setValueAtIndex(9, true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('insert_row_above', 2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      [null, null, null, null, null, null, null, null, null, null],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('insert_row_below', 5);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      [null, null, null, null, null, null, null, null, null, null],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
    ]);
    expect(countVisibleRows()).toBe(3);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      [null, null, null, null, null, null, null, null, null, null],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
      ['A6', 'B6', 'C6', 'D6', 'E6', 'F6', 'G6', 'H6', 'I6', 'J6'],
    ]);
    expect(countVisibleRows()).toBe(3);
  });

  it('should recalculate the internal state correctly after removing rows (complex scenario)', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().setIndexesSequence([9, 7, 4, 2, 1, 3, 5, 6, 8, 0]);

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding');

    hidingMap.setValueAtIndex(0, true);
    hidingMap.setValueAtIndex(2, true);
    hidingMap.setValueAtIndex(4, true);
    hidingMap.setValueAtIndex(8, true);
    hidingMap.setValueAtIndex(9, true);

    await render();

    const plugin = getPlugin('pagination');

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A5', 'B5', 'C5', 'D5', 'E5', 'F5', 'G5', 'H5', 'I5', 'J5'], // hidden row
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('remove_row', 2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    await alter('remove_row', 5);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A8', 'B8', 'C8', 'D8', 'E8', 'F8', 'G8', 'H8', 'I8', 'J8'],
      ['A3', 'B3', 'C3', 'D3', 'E3', 'F3', 'G3', 'H3', 'I3', 'J3'], // hidden row
      ['A2', 'B2', 'C2', 'D2', 'E2', 'F2', 'G2', 'H2', 'I2', 'J2'],
      ['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4', 'H4', 'I4', 'J4'],
    ]);
    expect(countVisibleRows()).toBe(3);

    plugin.setPage(2);

    expect(plugin.getCurrentPageData()).toEqual([
      ['A7', 'B7', 'C7', 'D7', 'E7', 'F7', 'G7', 'H7', 'I7', 'J7'],
      ['A9', 'B9', 'C9', 'D9', 'E9', 'F9', 'G9', 'H9', 'I9', 'J9'], // hidden row
      ['A1', 'B1', 'C1', 'D1', 'E1', 'F1', 'G1', 'H1', 'I1', 'J1'], // hidden row
    ]);
    expect(countVisibleRows()).toBe(1);
  });

  it('should translate UI text when different language pack is used', async() => {
    handsontable({
      data: createSpreadsheetData(10, 10),
      language: 'pl-pl',
      pagination: {
        pageSize: 3,
      },
    });

    expect(visualizePageSections()).toEqual([
      'Liczba wierszy: [5, 10, 20, 50, 100]',
      '1 - 3 z 10',
      '|< < Strona 1 z 4 [>] [>|]',
    ]);
  });
});
