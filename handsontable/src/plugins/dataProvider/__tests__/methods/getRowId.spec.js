describe('DataProvider `getRowId` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return row id from rowId string path', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [
            { id: 101, name: 'First' },
            { id: 102, name: 'Second' },
          ],
          totalRows: 2,
        }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getRowId(0)).toBe(101);
    expect(plugin.getRowId(1)).toBe(102);
  });

  it('should return row id from rowId function', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'uid' }, { data: 'label' }],
      dataProvider: createDataProviderConfig({
        rowId: row => row?.uid,
        fetchRows: () => Promise.resolve({
          rows: [
            { uid: 'a-1', label: 'A' },
            { uid: 'b-2', label: 'B' },
          ],
          totalRows: 2,
        }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getRowId(0)).toBe('a-1');
    expect(plugin.getRowId(1)).toBe('b-2');
  });

  it('should return undefined for row without id when rowId is set', async() => {
    handsontable({
      data: [],
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({
          rows: [{ name: 'NoId' }],
          totalRows: 1,
        }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getRowId(0)).toBeUndefined();
  });
});
