describe('DataProvider with alter (insert row / remove row)', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call createRows when insert_row_above is triggered', async() => {
    const onRowsCreate = jasmine.createSpy('onRowsCreate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsCreate,
      }),
    });

    await sleep(50);

    await alter('insert_row_above', 0);

    await sleep(100);

    expect(onRowsCreate).toHaveBeenCalledWith(
      jasmine.objectContaining({
        position: 'above',
        referenceRowId: 1,
        rowsAmount: 1,
      })
    );
  });

  it('should call createRows when insert_row_below is triggered', async() => {
    const onRowsCreate = jasmine.createSpy('onRowsCreate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsCreate,
      }),
    });

    await sleep(50);

    await alter('insert_row_below', 0);

    await sleep(100);

    expect(onRowsCreate).toHaveBeenCalledWith(
      jasmine.objectContaining({
        position: 'below',
        referenceRowId: 1,
        rowsAmount: 1,
      })
    );
  });

  it('should call removeRows when remove_row is triggered', async() => {
    const onRowsRemove = jasmine.createSpy('onRowsRemove').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [
            { id: 1, name: 'A' },
            { id: 2, name: 'B' },
          ],
          totalRows: 2,
        }),
        onRowsRemove,
      }),
    });

    await sleep(50);

    await alter('remove_row', 0);

    await sleep(100);

    expect(onRowsRemove).toHaveBeenCalledWith([1]);
  });

  it('should not intercept insert_row when onRowsCreate is not provided', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
        onRowsCreate: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const config = spec().$container.handsontable('getInstance').getSettings().dataProvider;

    config.onRowsCreate = undefined;

    await alter('insert_row_above', 0);

    await sleep(50);

    expect(countRows()).toBe(2);
  });

  it('should not intercept remove_row when onRowsRemove is not provided', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
          totalRows: 2,
        }),
        onRowsRemove: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const config = spec().$container.handsontable('getInstance').getSettings().dataProvider;

    config.onRowsRemove = undefined;

    await alter('remove_row', 0);

    await sleep(50);

    expect(countRows()).toBe(1);
  });

  it('should not call createRows when insert_row and maxRows is reached', async() => {
    const onRowsCreate = jasmine.createSpy('onRowsCreate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      maxRows: 1,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
        onRowsCreate,
      }),
    });

    await sleep(50);

    await alter('insert_row_above', 0);

    await sleep(50);

    expect(onRowsCreate).not.toHaveBeenCalled();
  });
});
