describe('Pagination integration with AutoColumnSize', () => {
  beforeEach(function() {
    this.$container = $('<div id="testContainer"></div>').appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should correctly calculate the column widths based on the currently selected page', async() => {
    const data = createSpreadsheetData(40, 3);

    data[11][1] = 'A very long text that should be truncated';
    data[21][1] = 'Not as long text but still';

    handsontable({
      data,
      pagination: {
        pageSize: 9,
      },
      autoColumnSize: true,
    });

    // Page 1 has no long text -- capture the DOM-measured default column width
    const defaultColWidth = colWidth(spec().$container, 0);

    expect(colWidth(spec().$container, 0)).toBe(defaultColWidth);
    expect(colWidth(spec().$container, 1)).toBe(defaultColWidth);
    expect(colWidth(spec().$container, 2)).toBe(defaultColWidth);

    const pagination = getPlugin('pagination');

    pagination.setPage(2);

    // Page 2 contains the long text in column 1 (2px tolerance absorbs both border rounding across
    // pages and theme-specific content width jitter as AutoColumnSize re-measures per page).
    expect(colWidth(spec().$container, 0)).toBeAroundValue(defaultColWidth, 2);
    expect(colWidth(spec().$container, 1)).toBeGreaterThan(defaultColWidth);
    expect(colWidth(spec().$container, 2)).toBeAroundValue(defaultColWidth, 2);

    const page2Col1Width = colWidth(spec().$container, 1);

    pagination.setPage(3);

    // Page 3 contains a shorter long text -- still wider than default but narrower than page 2
    expect(colWidth(spec().$container, 0)).toBeAroundValue(defaultColWidth, 2);
    expect(colWidth(spec().$container, 1)).toBeGreaterThan(defaultColWidth);
    expect(colWidth(spec().$container, 1)).toBeLessThan(page2Col1Width);
    expect(colWidth(spec().$container, 2)).toBeAroundValue(defaultColWidth, 2);

    pagination.setPage(4);

    // Page 4 has no long text -- all columns return to default width (2px tolerance for border
    // rounding and theme-specific content width jitter).
    expect(colWidth(spec().$container, 0)).toBeAroundValue(defaultColWidth, 2);
    expect(colWidth(spec().$container, 1)).toBeAroundValue(defaultColWidth, 2);
    expect(colWidth(spec().$container, 2)).toBeAroundValue(defaultColWidth, 2);
  });
});
