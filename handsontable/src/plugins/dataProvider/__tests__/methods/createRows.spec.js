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

  it('should not refetch after successful create when `refetchAfterCreate` is false', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(Promise.resolve({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    }));
    const afterMutation = jasmine.createSpy('afterRowsMutation');
    const afterMutationError = jasmine.createSpy('afterRowsMutationError');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows,
        onRowsCreate: () => Promise.resolve([{ id: 2, name: 'B' }]),
        refetchAfterCreate: false,
      }),
      afterRowsMutation: afterMutation,
      afterRowsMutationError: afterMutationError,
    });

    await waitUntil(() => fetchRows.calls.count() === 1);

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(countRows()).toBe(1);
    expect(afterMutation).toHaveBeenCalledWith('create', jasmine.objectContaining({
      rowsCreate: jasmine.objectContaining({ rowsAmount: 1 }),
    }));
    expect(afterMutationError).not.toHaveBeenCalled();
  });

  it('should let `onRowsCreate` apply the server response itself when `refetchAfterCreate` is false', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(Promise.resolve({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    }));

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows,
        onRowsCreate: async() => {
          const created = { id: 2, name: 'B' };
          const rows = getSourceData();

          rows.push(created);
          // `updateData()` is the documented pattern: `loadData()` would reset the column sort state.
          await updateData(rows);

          return [created];
        },
        refetchAfterCreate: false,
      }),
    });

    await waitUntil(() => fetchRows.calls.count() === 1);

    await getPlugin('dataProvider').createRows({ rowsAmount: 1 });

    expect(fetchRows).toHaveBeenCalledTimes(1);
    expect(countRows()).toBe(2);
    expect(getDataAtRowProp(1, 'name')).toBe('B');
  });

  it('should keep refetching after create when `refetchAfterCreate` is true', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(Promise.resolve({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    }));

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows,
        onRowsCreate: () => Promise.resolve(),
        refetchAfterCreate: true,
      }),
    });

    await waitUntil(() => fetchRows.calls.count() === 1);

    await getPlugin('dataProvider').createRows({ rowsAmount: 1 });

    expect(fetchRows).toHaveBeenCalledTimes(2);
  });

  it('should follow the current config after `updateSettings` toggles `refetchAfterCreate`', async() => {
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(Promise.resolve({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    }));
    const config = createDataProviderConfig({
      fetchRows,
      onRowsCreate: () => Promise.resolve(),
      refetchAfterCreate: false,
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await waitUntil(() => fetchRows.calls.count() === 1);

    await getPlugin('dataProvider').createRows({ rowsAmount: 1 });

    expect(fetchRows).toHaveBeenCalledTimes(1);

    // Omitting the key again must restore the default (refetch), not keep the previous `false`.
    const { refetchAfterCreate, ...configWithoutFlag } = config;

    void refetchAfterCreate;
    await updateSettings({ dataProvider: configWithoutFlag });
    // `updatePlugin()` refetches once on its own.
    await waitUntil(() => fetchRows.calls.count() === 2);

    await getPlugin('dataProvider').createRows({ rowsAmount: 1 });

    expect(fetchRows).toHaveBeenCalledTimes(3);
  });

  it('should warn and keep the default when `refetchAfterCreate` is not a boolean', async() => {
    const warnSpy = spyOn(console, 'warn');
    const fetchRows = jasmine.createSpy('fetchRows').and.returnValue(Promise.resolve({
      rows: [{ id: 1, name: 'A' }],
      totalRows: 1,
    }));

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows,
        onRowsCreate: () => Promise.resolve(),
        refetchAfterCreate: 'no',
      }),
    });

    await waitUntil(() => fetchRows.calls.count() === 1);

    await getPlugin('dataProvider').createRows({ rowsAmount: 1 });

    expect(warnSpy).toHaveBeenCalledWith(jasmine.stringMatching(/"refetchAfterCreate" option is not valid/));
    expect(fetchRows).toHaveBeenCalledTimes(2);
  });
});
