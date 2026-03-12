describe('ServerSideData', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call dataProvider on init and on refreshData()', async() => {
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async queryParameters => ({
      rows: [{ id: 1, name: `Row ${queryParameters.page}` }],
      totalRows: 1,
    }));

    handsontable({
      colHeaders: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ],
      pagination: true,
      dataProvider,
      dataProviderParams: {
        pageSize: 15,
      },
    });

    expect(getPlugin('serverSideData')).toBeDefined();
    expect(getPlugin('serverSideData').enabled).toBe(true);
    expect(getSettings().dataProvider).toBe(dataProvider);

    await sleep(150);

    expect(dataProvider.calls.count()).toBe(1);
    expect(dataProvider.calls.argsFor(0)[0]).toEqual({
      page: 1,
      pageSize: 15,
      sort: null,
      filters: null,
    });

    await hot().refreshData();

    expect(dataProvider.calls.count()).toBe(2);
  });

  it('should fetch data on server-side pagination change', async() => {
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: createSpreadsheetData(10, 2),
      totalRows: 35,
    }));

    handsontable({
      pagination: true,
      colHeaders: true,
      columns: [{ data: 0 }, { data: 1 }],
      dataProvider,
    });

    await sleep(150);
    getPlugin('pagination').setPage(2);
    await sleep(200);

    expect(dataProvider.calls.mostRecent().args[0].page).toBe(2);
    expect(getPlugin('pagination').getPaginationData().currentPage).toBe(2);
  });

  it('should fetch data on server-side sorting change', async() => {
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
      ],
      totalRows: 2,
    }));

    handsontable({
      colHeaders: true,
      columnSorting: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ],
      dataProvider,
      pagination: true,
    });

    await sleep(150);
    getPlugin('columnSorting').sort({ column: 1, sortOrder: 'asc' });
    await sleep(200);

    expect(dataProvider.calls.mostRecent().args[0].sort).toEqual({
      column: 'name',
      direction: 'asc',
    });
    expect(dataProvider.calls.mostRecent().args[0].page).toBe(1);
  });

  it('should fetch data on server-side filter change', async() => {
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
      totalRows: 2,
    }));

    handsontable({
      colHeaders: true,
      dropdownMenu: true,
      filters: true,
      columns: [
        { data: 'id' },
        { data: 'name' },
      ],
      dataProvider,
      pagination: true,
    });

    await sleep(150);
    getPlugin('filters').addCondition(1, 'contains', ['A']);
    getPlugin('filters').filter();
    await sleep(200);

    expect(dataProvider.calls.mostRecent().args[0].filters).toEqual({
      name: {
        operator: 'contains',
        value: 'a',
      },
    });
    expect(dataProvider.calls.mostRecent().args[0].page).toBe(1);
  });

  it('should call onRowUpdate and refresh after editing a cell', async() => {
    const onRowUpdate = jasmine.createSpy('onRowUpdate').and.callFake(async() => undefined);
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: [{ id: 1, name: 'Alice' }],
      totalRows: 1,
    }));

    handsontable({
      colHeaders: true,
      columns: [
        { data: 'id', readOnly: true },
        { data: 'name' },
      ],
      dataProvider,
      onRowUpdate,
      rowId: 'id',
    });

    await sleep(150);
    await setDataAtCell(0, 1, 'Alicia', 'edit');
    await sleep(250);

    expect(onRowUpdate.calls.count()).toBe(1);
    expect(onRowUpdate.calls.argsFor(0)[0]).toBe(1);
    expect(onRowUpdate.calls.argsFor(0)[1]).toEqual({ name: 'Alicia' });
    expect(dataProvider.calls.count()).toBe(2);
  });

  it('should revert edited value when onRowUpdate rejects', async() => {
    const onRowUpdate = jasmine.createSpy('onRowUpdate').and.callFake(async() => {
      return Promise.reject(new Error('Update failed'));
    });
    const dataProvider = jasmine.createSpy('dataProvider').and.callFake(async() => ({
      rows: [{ id: 1, name: 'Alice' }],
      totalRows: 1,
    }));

    handsontable({
      colHeaders: true,
      columns: [
        { data: 'id', readOnly: true },
        { data: 'name' },
      ],
      dataProvider,
      onRowUpdate,
      rowId: 'id',
    });

    await sleep(150);
    await setDataAtCell(0, 1, 'Alicia', 'edit');
    await sleep(250);

    expect(getDataAtCell(0, 1)).toBe('Alice');
  });
});
