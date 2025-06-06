describe('Pagination with conflicting options', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not be possible to enable the pagination with `fixedRowsTop` option', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: true,
      fixedRowsTop: 1,
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith('The `pagination` plugin cannot be used with ' +
      'the `fixedRowsTop` option. This combination is not supported. The plugin will remain disabled.');
    expect(getSettings().pagination).toBe(false);
    expect(getPlugin('pagination').isEnabled()).toBe(false);
  });

  it('should not be possible to enable the pagination with `fixedRowsBottom` option', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(10, 10),
      pagination: true,
      fixedRowsBottom: 1,
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith('The `pagination` plugin cannot be used with ' +
      'the `fixedRowsBottom` option. This combination is not supported. The plugin will remain disabled.');
    expect(getSettings().pagination).toBe(false);
    expect(getPlugin('pagination').isEnabled()).toBe(false);
  });
});
