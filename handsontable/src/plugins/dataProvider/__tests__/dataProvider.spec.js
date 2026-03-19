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
    handsontable({
      data: [],
      dataProvider: { rowId: 'id' },
    });

    const plugin = getPlugin('dataProvider');

    expect(plugin.isEnabled()).toBe(false);
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
