describe('Pagination integration with HiddenRows', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should update the pagination state after hiding rows (pageSize as a number)', async() => {
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
      hiddenRows: true,
      pagination: {
        pageSize: 3,
      },
    });

    const pagination = getPlugin('pagination');
    const hiddenRows = getPlugin('hiddenRows');

    hiddenRows.hideRows([1, 3, 5, 7]);
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

  it('should update the pagination state after showing rows (pageSize as a number)', async() => {
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
      hiddenRows: {
        rows: [0, 1, 2, 3, 4, 5, 6, 7],
      },
      pagination: {
        pageSize: 3,
      },
    });

    const pagination = getPlugin('pagination');
    const hiddenRows = getPlugin('hiddenRows');

    hiddenRows.showRows([1, 3, 5, 7]);
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

  it('should update the pagination state after hiding rows (pageSize as `auto`)', async() => {
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
      hiddenRows: true,
      pagination: {
        pageSize: 'auto',
      },
      width: 500,
      // 5px gap/buffer
      height: (getDefaultRowHeight() * 3) + getPaginationContainerHeight() + getDefaultColumnHeaderHeight() + 5,
    });

    const pagination = getPlugin('pagination');
    const hiddenRows = getPlugin('hiddenRows');

    hiddenRows.hideRows([1, 3, 5, 7]);
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

  it('should update the pagination state after showing rows (pageSize as `auto`)', async() => {
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
      hiddenRows: {
        rows: [0, 1, 2, 3, 4, 5, 6, 7],
      },
      pagination: {
        pageSize: 3,
      },
      width: 500,
      // 5px gap/buffer
      height: (getDefaultRowHeight() * 3) + getPaginationContainerHeight() + getDefaultColumnHeaderHeight() + 5,
    });

    const pagination = getPlugin('pagination');
    const hiddenRows = getPlugin('hiddenRows');

    hiddenRows.showRows([1, 3, 5, 7]);
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

  it('should render the pagination state correctly when all rows are hidden', async() => {
    handsontable({
      data: createSpreadsheetData(6, 10),
      pagination: {
        pageSize: 3,
      },
    });

    rowIndexMapper().createAndRegisterIndexMap('my-hiding-map', 'hiding', true);

    await render();

    expect(visualizePageSections()).toEqual([
      'Page size: [[auto], 5, 10, 20, 50, 100]',
      '0 - 0 of 0',
      '|< < Page 1 of 1 > >|',
    ]);
  });
});
