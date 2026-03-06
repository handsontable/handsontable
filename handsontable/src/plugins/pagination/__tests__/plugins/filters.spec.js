describe('Pagination integration with Filters', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should render all values in filters component regardless of the currently selected page', async() => {
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
      filters: true,
      dropdownMenu: true,
      pagination: {
        pageSize: 3,
      },
    });

    await dropdownMenu(1);

    expect($(filterByValueBoxRootElement()).find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Brown',
      'Evans',
      'Jones',
      'Taylor',
      'Williams',
    ]);
  });

  it('should update the pagination state after filtering values', async() => {
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
      filters: true,
      dropdownMenu: true,
      pagination: {
        pageSize: 3,
      },
    });

    const pagination = getPlugin('pagination');
    const filters = getPlugin('filters');

    filters.addCondition(0, 'contains', ['a']);
    filters.addCondition(3, 'gt', [100]);
    filters.filter();

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Mary',
      'Ann',
      'David',
    ]);
    expect(countVisibleRows()).toBe(3);

    pagination.setPage(2);

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Mary',
    ]);
    expect(countVisibleRows()).toBe(1);
  });
});
