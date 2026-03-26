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

  it('should keep incompatible plugins disabled when dataProvider is enabled', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      trimRows: true,
      manualRowMove: true,
      manualColumnMove: true,
      multiColumnSorting: true,
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    expect(getPlugin('dataProvider').enabled).toBe(true);
    expect(getPlugin('trimRows').enabled).toBe(false);
    expect(getPlugin('manualRowMove').enabled).toBe(false);
    expect(getPlugin('manualColumnMove').enabled).toBe(false);
    expect(getPlugin('multiColumnSorting').enabled).toBe(false);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/trimRows.*not compatible.*dataProvider/i)
    );
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/manualRowMove.*not compatible.*dataProvider/i)
    );
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/manualColumnMove.*not compatible.*dataProvider/i)
    );
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/multiColumnSorting.*not compatible.*dataProvider/i)
    );
  });

  it('should keep incompatible plugins disabled when updateSettings turns them on with dataProvider', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    expect(getPlugin('dataProvider').enabled).toBe(true);
    expect(getPlugin('trimRows').enabled).toBe(false);
    expect(getPlugin('manualRowMove').enabled).toBe(false);

    await updateSettings({
      trimRows: true,
      manualRowMove: true,
    });

    await sleep(50);

    expect(getPlugin('trimRows').enabled).toBe(false);
    expect(getPlugin('manualRowMove').enabled).toBe(false);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/trimRows.*not compatible.*dataProvider/i)
    );
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/manualRowMove.*not compatible.*dataProvider/i)
    );
  });

  it('should disable an already-enabled conflicting plugin when updateSettings only enables dataProvider', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(3, 3),
      manualRowMove: true,
    });

    await sleep(50);

    expect(getPlugin('manualRowMove').enabled).toBe(true);
    expect(getPlugin('dataProvider').enabled).toBe(false);

    await updateSettings({
      data: [],
      dataProvider: createDataProviderConfig({
        fetchRows: () => Promise.resolve({ rows: [], totalRows: 0 }),
      }),
    });

    await sleep(50);

    expect(getPlugin('dataProvider').enabled).toBe(true);
    expect(getPlugin('manualRowMove').enabled).toBe(false);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      jasmine.stringMatching(/manualRowMove.*not compatible.*dataProvider/i)
    );
  });
});
