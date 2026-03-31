describe('DataProvider `createRows` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call onRowsCreate with position and referenceRowId', async() => {
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

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({
      position: 'below',
      referenceRowId: 1,
      rowsAmount: 2,
    });

    expect(onRowsCreate).toHaveBeenCalledWith(
      jasmine.objectContaining({
        position: 'below',
        referenceRowId: 1,
        rowsAmount: 2,
      })
    );
  });

  it('should refetch data after successful create', async() => {
    let fetchCount = 0;

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => {
          fetchCount += 1;

          return Promise.resolve({
            rows: fetchCount === 1 ? [{ id: 1, name: 'A' }] : [{ id: 1, name: 'A' }, { id: 2, name: 'B' }],
            totalRows: fetchCount,
          });
        },
        onRowsCreate: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    expect(fetchCount).toBe(1);
    expect(countRows()).toBe(1);

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expect(fetchCount).toBe(2);
  });

  it('should do nothing when onRowsCreate is not provided', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
        onRowsCreate: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const config = spec().$container.handsontable('getInstance').getSettings().dataProvider;

    config.onRowsCreate = undefined;

    const plugin = getPlugin('dataProvider');
    const out = await plugin.createRows({ rowsAmount: 1 });

    expect(out).toBeUndefined();
    expect(countRows()).toBe(1);
  });
});
