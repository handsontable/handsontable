describe('Pagination integration with MergeCells', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should update the pagination state after merging a cell', async() => {
    handsontable({
      data: createSpreadsheetData(7, 5),
      colHeaders: true,
      mergeCells: true,
      pagination: {
        pageSize: 4,
      },
    });

    const pagination = getPlugin('pagination');
    const mergeCells = getPlugin('mergeCells');

    mergeCells.merge(0, 1, 6, 2);

    expect(getMaster().find('tr:first-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A1', 'B1', 'B1', 'D1', 'E1',
    ]);
    expect(getMaster().find('tr:last-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A4', 'B1', 'B1', 'D4', 'E4',
    ]);
    expect(countVisibleRows()).toBe(4);

    pagination.setPage(2);

    expect(getMaster().find('tr:first-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A5', 'B1', 'B1', 'D5', 'E5',
    ]);
    expect(getMaster().find('tr:last-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A7', 'B1', 'B1', 'D7', 'E7',
    ]);
    expect(countVisibleRows()).toBe(3);
  });

  it('should update the pagination state after unmerging a cell', async() => {
    handsontable({
      data: createSpreadsheetData(7, 5),
      colHeaders: true,
      mergeCells: [
        { row: 0, col: 1, rowspan: 7, colspan: 2 },
      ],
      pagination: {
        pageSize: 4,
      },
    });

    const pagination = getPlugin('pagination');
    const mergeCells = getPlugin('mergeCells');

    mergeCells.unmerge(0, 1, 6, 2);

    expect(getMaster().find('tr:first-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A1', 'B1', '', 'D1', 'E1',
    ]);
    expect(getMaster().find('tr:last-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A4', '', '', 'D4', 'E4',
    ]);
    expect(countVisibleRows()).toBe(4);

    pagination.setPage(2);

    expect(getMaster().find('tr:first-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A5', '', '', 'D5', 'E5',
    ]);
    expect(getMaster().find('tr:last-child td').map((_, td) => $(td).text().trim()).get()).toEqual([
      'A7', '', '', 'D7', 'E7',
    ]);
    expect(countVisibleRows()).toBe(3);
  });
});
