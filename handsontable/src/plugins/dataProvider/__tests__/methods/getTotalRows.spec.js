describe('DataProvider `getTotalRows` method', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should return 0 before first fetch', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => new Promise(() => {}),
      }),
    });

    const plugin = getPlugin('dataProvider');

    expect(plugin.getTotalRows()).toBe(0);
  });

  it('should return totalRows from last successful fetch', async() => {
    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [{ id: 1 }], totalRows: 42 }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getTotalRows()).toBe(42);
  });

  it('should update after fetchData returns new totalRows', async() => {
    let totalRows = 10;

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows }),
      }),
    });

    await sleep(50);

    const plugin = getPlugin('dataProvider');

    expect(plugin.getTotalRows()).toBe(10);

    totalRows = 99;
    await plugin.fetchData();

    expect(plugin.getTotalRows()).toBe(99);
  });
});
