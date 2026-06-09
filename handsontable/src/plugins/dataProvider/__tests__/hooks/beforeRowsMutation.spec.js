describe('DataProvider `beforeRowsMutation` hook', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be called with operation "update" and payload when cell change triggers onRowsUpdate', async() => {
    const beforeMutation = jasmine.createSpy('beforeRowsMutation').and.returnValue(undefined);

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
      beforeRowsMutation: beforeMutation,
    });

    await sleep(50);

    await setDataAtRowProp(0, 'name', 'Bob');

    await sleep(150);

    expect(beforeMutation).toHaveBeenCalledWith('update', jasmine.objectContaining({
      rows: jasmine.any(Array),
    }));
    expect(beforeMutation.calls.mostRecent().args[1].rows.length).toBe(1);
    expect(beforeMutation.calls.mostRecent().args[1].rows[0].id).toBe(1);
    expect(beforeMutation.calls.mostRecent().args[1].rows[0].changes).toEqual(
      jasmine.objectContaining({ name: 'Bob' })
    );
  });

  it('should cancel update and revert cells when hook returns false', async() => {
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
      beforeRowsMutation: () => false,
    });

    await sleep(50);

    expect(getDataAtCell(0, 1)).toBe('Alice');

    await setDataAtRowProp(0, 'name', 'Bob');

    await sleep(150);

    expect(getDataAtCell(0, 1)).toBe('Alice');
  });

  it('should be called with operation "create" when createRows is invoked', async() => {
    const beforeMutation = jasmine.createSpy('beforeRowsMutation').and.returnValue(undefined);

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
        onRowsCreate: () => Promise.resolve(),
      }),
      beforeRowsMutation: beforeMutation,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.createRows({ position: 'below', referenceRowId: 1, rowsAmount: 1 });

    expect(beforeMutation).toHaveBeenCalledWith('create', jasmine.objectContaining({
      rowsCreate: jasmine.objectContaining({
        position: 'below',
        referenceRowId: 1,
        rowsAmount: 1,
      }),
    }));
  });

  it('should be called with operation "remove" when removeRows is invoked', async() => {
    const beforeMutation = jasmine.createSpy('beforeRowsMutation').and.returnValue(undefined);

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
      beforeRowsMutation: beforeMutation,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    await plugin.removeRows(1);

    expect(beforeMutation).toHaveBeenCalledWith('remove', jasmine.objectContaining({
      rowsRemove: [1],
    }));
  });
});
