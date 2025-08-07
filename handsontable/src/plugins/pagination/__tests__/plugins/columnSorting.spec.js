describe('Pagination integration with ColumnSorting', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should correctly sort all rows regardless of the currently selected page', async() => {
    handsontable({
      data: [
        ['Mary', 'Brown', '01/14/2017', 6999.95],
        ['Henry', 'Jones', '12/01/2018', 8330],
        ['Ann', 'Evans', '07/24/2021', 30500],
        ['Robert', 'Evans', '07/24/2019', 12464],
        ['Ann', 'Williams', '01/14/2017', 33.9],
        ['David', 'Taylor', '02/02/2020', 7000],
        ['John', 'Brown', '07/24/2020', 2984],
        ['Mary', 'Brown', '01/14/2017', 4000],
        ['Robert', 'Evans', '07/24/2020', 30500]
      ],
      colHeaders: true,
      columnSorting: true,
      pagination: {
        pageSize: 4,
      },
    });

    const pagination = getPlugin('pagination');
    const sorting = getPlugin('columnSorting');

    sorting.sort({
      column: 0,
      sortOrder: 'desc',
    });

    expect(getDataAtCol(0)).toEqual([
      'Robert',
      'Robert',
      'Mary',
      'Mary',
      'John',
      'Henry',
      'David',
      'Ann',
      'Ann',
    ]);
    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Robert',
      'Robert',
      'Mary',
      'Mary',
    ]);
    expect(countVisibleRows()).toBe(4);

    pagination.setPage(2);

    expect(getDataAtCol(0)).toEqual([
      'Robert',
      'Robert',
      'Mary',
      'Mary',
      'John',
      'Henry',
      'David',
      'Ann',
      'Ann',
    ]);
    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'John',
      'Henry',
      'David',
      'Ann',
    ]);
    expect(countVisibleRows()).toBe(4);

    pagination.setPage(3);

    expect(getDataAtCol(0)).toEqual([
      'Robert',
      'Robert',
      'Mary',
      'Mary',
      'John',
      'Henry',
      'David',
      'Ann',
      'Ann',
    ]);
    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Ann',
    ]);
    expect(countVisibleRows()).toBe(1);
  });
});
