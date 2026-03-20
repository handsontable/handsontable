describe('DataProvider `afterRowsMutationError` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be called when onRowsUpdate rejects', async() => {
    const afterError = jasmine.createSpy('afterRowsMutationError');
    const err = new Error('Server error');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate: () => Promise.reject(err),
      }),
      afterRowsMutationError: afterError,
    });

    await sleep(50);

    await setDataAtRowProp(0, 'name', 'Bob');

    await sleep(150);

    expect(afterError).toHaveBeenCalledWith('update', err, jasmine.objectContaining({
      rows: jasmine.any(Array),
    }));
  });

  it('should be called when row has no id after a batched cell edit', async() => {
    const afterError = jasmine.createSpy('afterRowsMutationError');
    const onRowsUpdate = jasmine.createSpy('onRowsUpdate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ name: 'A' }],
          totalRows: 1,
        }),
        onRowsUpdate,
      }),
      afterRowsMutationError: afterError,
    });

    await sleep(50);

    await setDataAtRowProp(0, 'name', 'B');

    await sleep(150);

    expect(onRowsUpdate).not.toHaveBeenCalled();
    expect(afterError).toHaveBeenCalledWith(
      'update',
      jasmine.any(Error),
      jasmine.objectContaining({ rows: jasmine.any(Array) })
    );
  });

  it('should be called when validation fails for update', async() => {
    const afterError = jasmine.createSpy('afterRowsMutationError');

    handsontable({
      data: [],
      columns: [
        { data: 'id' },
        { data: 'name', validator: (val, cb) => cb(val !== 'Invalid'), allowInvalid: false },
      ],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
        onRowsUpdate: () => Promise.resolve(),
      }),
      afterRowsMutationError: afterError,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.updateRows([{ id: 1, changes: { name: 'Invalid' } }]);

    expect(afterError).toHaveBeenCalledWith(
      'update',
      jasmine.any(Error),
      jasmine.objectContaining({ rows: jasmine.any(Array) })
    );
  });

  it('should be called when onRowsCreate rejects', async() => {
    const afterError = jasmine.createSpy('afterRowsMutationError');
    const err = new Error('Create failed');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
        onRowsCreate: () => Promise.reject(err),
      }),
      afterRowsMutationError: afterError,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ rowsAmount: 1 });

    expect(afterError).toHaveBeenCalledWith('create', err, jasmine.objectContaining({
      rowsCreate: jasmine.any(Object),
    }));
  });

  it('should be called when onRowsRemove rejects', async() => {
    const afterError = jasmine.createSpy('afterRowsMutationError');
    const err = new Error('Remove failed');

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'A' }],
          totalRows: 1,
        }),
        onRowsRemove: () => Promise.reject(err),
      }),
      afterRowsMutationError: afterError,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expect(afterError).toHaveBeenCalledWith('remove', err, jasmine.objectContaining({
      rowsRemove: [1],
    }));
  });
});
