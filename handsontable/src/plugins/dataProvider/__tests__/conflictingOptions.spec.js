const DATA_PROVIDER_CONFLICT_WITH_MANUAL_ROW_MOVE =
  'The `dataProvider` plugin cannot be used with the `manualRowMove` option. ' +
  'This combination is not supported. The plugin will remain disabled.';

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

  it('should keep dataProvider disabled when incompatible plugins are enabled', async() => {
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

    expect(getPlugin('dataProvider').enabled).toBe(false);
    expect(getPlugin('trimRows').enabled).toBe(true);
    expect(getPlugin('manualRowMove').enabled).toBe(true);
    expect(getPlugin('manualColumnMove').enabled).toBe(true);
    expect(getPlugin('multiColumnSorting').enabled).toBe(true);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(DATA_PROVIDER_CONFLICT_WITH_MANUAL_ROW_MOVE);
  });

  it('should disable dataProvider when updateSettings turns conflicting plugins on', async() => {
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

    expect(getPlugin('dataProvider').enabled).toBe(false);
    expect(getPlugin('trimRows').enabled).toBe(true);
    expect(getPlugin('manualRowMove').enabled).toBe(true);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(DATA_PROVIDER_CONFLICT_WITH_MANUAL_ROW_MOVE);
  });

  it('should not enable dataProvider when updateSettings adds it alongside a conflicting plugin', async() => {
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

    expect(getPlugin('dataProvider').enabled).toBe(false);
    expect(getPlugin('manualRowMove').enabled).toBe(true);

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(DATA_PROVIDER_CONFLICT_WITH_MANUAL_ROW_MOVE);
  });
});
