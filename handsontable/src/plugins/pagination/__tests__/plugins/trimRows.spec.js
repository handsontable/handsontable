describe('Pagination integration with TrimRows', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should update the pagination state after hiding rows', async() => {
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
        ['Robert', 'Evans', '07/24/2020', 30500],
      ],
      colHeaders: true,
      trimRows: true,
      pagination: {
        pageSize: 3,
      },
    });

    const pagination = getPlugin('pagination');
    const trimRows = getPlugin('trimRows');

    trimRows.trimRows([1, 3, 5, 7]);
    await render();

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Mary',
      'Ann',
      'Ann',
    ]);
    expect(countVisibleRows()).toBe(3);

    pagination.setPage(2);

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'John',
      'Robert',
    ]);
    expect(countVisibleRows()).toBe(2);
  });

  it('should update the pagination state after showing rows', async() => {
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
      trimRows: [0, 1, 2, 3, 4, 5, 6, 7],
      pagination: {
        pageSize: 3,
      },
    });

    const pagination = getPlugin('pagination');
    const trimRows = getPlugin('trimRows');

    trimRows.untrimRows([1, 3, 5, 7]);
    await render();

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Henry',
      'Robert',
      'David',
    ]);
    expect(countVisibleRows()).toBe(3);

    pagination.setPage(2);

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Mary',
      'Robert',
    ]);
    expect(countVisibleRows()).toBe(2);
  });
});
