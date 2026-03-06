describe('Pagination integration with ManualRowMove', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should update the pagination state after row move', async() => {
    handsontable({
      data: [
        ['Mary', 'Brown', '01/14/2017', 6999.95],
        ['Henry', 'Jones', '12/01/2018', 8330],
        ['John', 'Evans', '07/24/2021', 30500],
        ['Robert', 'Evans', '07/24/2019', 12464],
        ['Ann', 'Williams', '01/14/2017', 33.9],
        ['Mark', 'Evans', '07/24/2020', 30500],
      ],
      colHeaders: true,
      manualRowMove: true,
      pagination: {
        pageSize: 3,
      },
    });

    const pagination = getPlugin('pagination');
    const manualRowMove = getPlugin('manualRowMove');

    manualRowMove.moveRow(2, 0);
    manualRowMove.moveRow(5, 3);
    await render();

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'John',
      'Mary',
      'Henry',
    ]);
    expect(countVisibleRows()).toBe(3);

    pagination.setPage(2);

    expect(getMaster().find('td:first-child').map((_, td) => $(td).text().trim()).get()).toEqual([
      'Mark',
      'Robert',
      'Ann',
    ]);
    expect(countVisibleRows()).toBe(3);
  });
});
