describe('DataProvider `updateRows` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should call onRowsUpdate with row payloads and refetch on success', async() => {
    const onRowsUpdate = jasmine.createSpy('onRowsUpdate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate,
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([
      { id: 1, changes: { name: 'Bob' } },
    ]);

    expect(onRowsUpdate).toHaveBeenCalledWith(
      jasmine.arrayContaining([
        jasmine.objectContaining({
          id: 1,
          changes: jasmine.objectContaining({ name: 'Bob' }),
        }),
      ])
    );
  });

  it('should do nothing when onRowsUpdate is not provided', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
        onRowsUpdate: () => Promise.resolve(),
      }),
    });

    await sleep(50);

    const config = spec().$container.handsontable('getInstance').getSettings().dataProvider;

    config.onRowsUpdate = undefined;

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([{ id: 1, changes: {} }]);

    expect(getDataAtCell(0, 0)).toBe(1);
  });

  it('should use rowData from payload when row id is not in table', async() => {
    const onRowsUpdate = jasmine.createSpy('onRowsUpdate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate,
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([
      { id: 99, changes: { name: 'New' }, rowData: { id: 99, name: 'New' } },
    ]);

    expect(onRowsUpdate).toHaveBeenCalledWith(
      jasmine.arrayContaining([
        jasmine.objectContaining({
          id: 99,
          changes: { name: 'New' },
          rowData: { id: 99, name: 'New' },
        }),
      ])
    );
  });

  it('should do nothing when rows array is empty', async() => {
    const onRowsUpdate = jasmine.createSpy('onRowsUpdate');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
        onRowsUpdate,
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([]);

    expect(onRowsUpdate).not.toHaveBeenCalled();
  });

  it('should throw when id is null or undefined', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');
    let caught;

    try {
      await plugin.updateRows([{ id: null, changes: { x: 1 } }]);
    } catch (e) {
      caught = e;
    }

    expect(caught).toBeDefined();
    expect(caught.message).toContain('updateRows');
  });
});
