describe('Pagination integration with MergeCells', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should not be possible to enable the pagination', async() => {
    spyOn(console, 'warn');

    handsontable({
      data: createSpreadsheetData(7, 5),
      colHeaders: true,
      mergeCells: [
        { row: 0, col: 1, rowspan: 7, colspan: 2 },
      ],
      pagination: {
        pageSize: 4,
      },
    });

    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith('The `pagination` plugin cannot be used with ' +
      'the `mergeCells` option. This combination is not supported. The plugin will remain disabled.');
    expect(getSettings().pagination).toBe(false);
    expect(getPlugin('pagination').isEnabled()).toBe(false);
  });
});
