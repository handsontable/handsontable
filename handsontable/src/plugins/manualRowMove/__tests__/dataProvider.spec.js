describe('ManualRowMove integration with dataProvider', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should disable the plugin when dataProvider is enabled', async() => {
    spyOn(console, 'info');

    handsontable({
      dataProvider: async() => ({
        rows: createSpreadsheetData(3, 3),
        totalRows: 3,
      }),
      manualRowMove: true,
      rowHeaders: true,
    });

    await sleep(0);

    // eslint-disable-next-line no-console
    expect(console.info).toHaveBeenCalledWith(
      'The `manualRowMove` plugin cannot be used with the `dataProvider` option. ' +
      'This plugin is disabled when server-side data fetching is active.'
    );
    expect(getPlugin('manualRowMove').isEnabled()).toBe(false);
  });

  it('should enable the plugin after turning dataProvider off', async() => {
    handsontable({
      dataProvider: async() => ({
        rows: createSpreadsheetData(3, 3),
        totalRows: 3,
      }),
      manualRowMove: true,
      rowHeaders: true,
    });

    await sleep(0);
    await updateSettings({
      dataProvider: undefined,
    });

    expect(getPlugin('manualRowMove').isEnabled()).toBe(true);
  });
});
