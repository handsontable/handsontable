describe('DataProvider with conflicting options', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should warn and disable trimRows when dataProvider is enabled', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      trimRows: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/trimRows.*incompatible with.*dataProvider/i)
    );
    expect(getPlugin('trimRows').enabled).toBe(false);
  });

  it('should warn and disable manualRowMove when dataProvider is enabled', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      manualRowMove: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/manualRowMove.*incompatible with.*dataProvider/i)
    );
    expect(getPlugin('manualRowMove').enabled).toBe(false);
  });

  it('should warn and disable multiColumnSorting when dataProvider is enabled', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      multiColumnSorting: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/multiColumnSorting.*incompatible with.*dataProvider/i)
    );
    expect(getPlugin('multiColumnSorting').enabled).toBe(false);
  });

  it('should re-disable incompatible plugins after updateSettings enables them', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    getPlugin('trimRows').enablePlugin();
    await render();

    expect(getPlugin('trimRows').enabled).toBe(true);

    await updateSettings({ trimRows: true });

    await sleep(50);

    expect(getPlugin('trimRows').enabled).toBe(false);
  });
});
