describe('DataProvider', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be disabled when dataProvider is not set', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
    });

    const plugin = getPlugin('dataProvider');

    expect(plugin.isEnabled()).toBe(false);
  });

  it('should be disabled when dataProvider is not a complete config', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      dataProvider: { rowId: 'id' },
    });

    const plugin = getPlugin('dataProvider');

    expect(plugin.isEnabled()).toBe(false);
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/dataProvider.*missing or invalid required options/i)
    );
  });

  it('should warn when dataProvider is not a plain object', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      dataProvider: true,
    });

    expect(getPlugin('dataProvider').isEnabled()).toBe(false);
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/dataProvider.*plain object/i)
    );
  });

  it('should warn again after updateSettings fixes then breaks dataProvider', async() => {
    spyOn(console, 'warn');

    const good = createDataProviderConfig({
      fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
    });

    handsontable({
      data: [],
      dataProvider: { rowId: 'id' },
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledTimes(1);

    await updateSettings({ dataProvider: good });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledTimes(1);

    await updateSettings({ dataProvider: { rowId: 'id' } });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledTimes(2);
  });

  it('should be enabled when dataProvider has all required keys', async() => {
    const config = createDataProviderConfig({
      fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'A' }], totalRows: 1 }),
    });

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.isEnabled()).toBe(true);
    expect(countRows()).toBe(1);
    expect(getDataAtCell(0, 0)).toBe(1);
    expect(getDataAtCell(0, 1)).toBe('A');
  });

  it('should be possible to disable the plugin via updateSettings', async() => {
    const config = createDataProviderConfig({
      fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 1 }),
    });

    handsontable({
      data: [],
      dataProvider: config,
    });

    await sleep(50);

    expect(getPlugin('dataProvider').isEnabled()).toBe(true);

    await updateSettings({ dataProvider: false });

    expect(getPlugin('dataProvider').isEnabled()).toBe(false);
    expect(countRows()).toBe(1);
    expect(getDataAtCell(0, 0)).toBe(1);
  });

  it('should apply static data when disabling DataProvider and passing data in the same updateSettings', async() => {
    const config = createDataProviderConfig({
      fetchRows: () => Promise.resolve({ rows: [{ id: 1, name: 'Server' }], totalRows: 1 }),
    });
    // Rows must match `columns[].data` keys; array-of-arrays rows do not expose `id` / `name` to DataMap.get().
    const localData = [{ id: 2, name: 'Local' }];

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: config,
    });

    await sleep(50);

    await updateSettings({
      dataProvider: false,
      data: localData,
    });

    expect(getPlugin('dataProvider').isEnabled()).toBe(false);
    expect(countRows()).toBe(1);
    expect(getDataAtCell(0, 0)).toBe(2);
    expect(getDataAtCell(0, 1)).toBe('Local');
  });

  it('should not clear data when updateSettings sets an incomplete dataProvider object', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2),
    });

    await updateSettings({ dataProvider: { rowId: 'id' } });

    expect(getPlugin('dataProvider').isEnabled()).toBe(false);
    expect(countRows()).toBe(2);
    expect(getDataAtCell(0, 0)).toBe('A1');
  });

  it('should not queue onRowsUpdate for change source outside DATA_PROVIDER_BATCH_UPDATE_SOURCES', async() => {
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

    await setDataAtRowProp(0, 'name', 'Other', 'customSource');

    await sleep(150);

    expect(onRowsUpdate).not.toHaveBeenCalled();
  });

  it('should not push batched server edit sources onto the undo stack when onRowsUpdate is set', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
      }),
    });

    await sleep(50);

    await setDataAtCell(0, 1, 'Bob', 'edit');

    expect(getPlugin('undoRedo').isUndoAvailable()).toBe(false);
  });

  it('should still push non-batched change sources onto the undo stack when onRowsUpdate is set', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ id: 1, name: 'Alice' }],
          totalRows: 1,
        }),
      }),
    });

    await sleep(50);

    await setDataAtCell(0, 1, 'Bob', 'customSource');

    expect(getPlugin('undoRedo').isUndoAvailable()).toBe(true);
  });

  it('should queue onRowsUpdate when Clear column is used from the column dropdown menu', async() => {
    const onRowsUpdate = jasmine.createSpy('onRowsUpdate').and.returnValue(Promise.resolve());

    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      colHeaders: true,
      dropdownMenu: true,
      height: 200,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [
            { id: 1, name: 'Alice' },
            { id: 2, name: 'Bob' },
          ],
          totalRows: 2,
        }),
        onRowsUpdate,
      }),
    });

    await sleep(50);

    await dropdownMenu(1);
    await selectDropdownMenuOption('Clear column');

    await sleep(200);

    expect(onRowsUpdate).toHaveBeenCalled();
    const rowsArg = onRowsUpdate.calls.mostRecent().args[0];

    expect(rowsArg.length).toBe(2);
    expect(rowsArg[0].id).toBe(1);
    expect(rowsArg[0].changes).toEqual(jasmine.objectContaining({ name: null }));
    expect(rowsArg[1].id).toBe(2);
    expect(rowsArg[1].changes).toEqual(jasmine.objectContaining({ name: null }));
  });

  it('should support rowId as function', async() => {
    const config = createDataProviderConfig({
      rowId: row => row?.uid,
      fetchRows: () => Promise.resolve({
        rows: [{ uid: 'x-1', name: 'First' }],
        totalRows: 1,
      }),
    });

    handsontable({
      data: [],
      columns: [{ data: 'uid' }, { data: 'name' }],
      dataProvider: config,
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getRowId(0)).toBe('x-1');
    expect(getDataAtCell(0, 1)).toBe('First');
  });
});
