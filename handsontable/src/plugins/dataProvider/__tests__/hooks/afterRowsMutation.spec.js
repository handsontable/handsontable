describe('DataProvider `afterRowsMutation` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be called after successful onRowsUpdate', async() => {
    const afterMutation = jasmine.createSpy('afterRowsMutation');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate: () => Promise.resolve(),
      }),
      afterRowsMutation: afterMutation,
    });

    await sleep(50);

    await setDataAtRowProp(0, 'name', 'Bob');

    await sleep(150);

    expect(afterMutation).toHaveBeenCalledWith('update', jasmine.objectContaining({
      rows: jasmine.any(Array),
    }));
  });

  it('should be called after successful createRows', async() => {
    const afterMutation = jasmine.createSpy('afterRowsMutation');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
        onRowsCreate: () => Promise.resolve(),
      }),
      afterRowsMutation: afterMutation,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expect(afterMutation).toHaveBeenCalledWith('create', jasmine.objectContaining({
      rowsCreate: jasmine.any(Object),
    }));
  });

  it('should be called after successful removeRows', async() => {
    const afterMutation = jasmine.createSpy('afterRowsMutation');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsRemove: () => Promise.resolve(),
      }),
      afterRowsMutation: afterMutation,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expect(afterMutation).toHaveBeenCalledWith('remove', jasmine.objectContaining({
      rowsRemove: [1],
    }));
  });
});
