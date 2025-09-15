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

    expect(colWidth(spec().$container, 0)).toBe(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 1)).toBe(getDefaultColumnWidth());
    expect(colWidth(spec().$container, 2)).toBe(getDefaultColumnWidth());

    const pagination = getPlugin('pagination');

    pagination.setPage(2);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 1);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(222);
      main.toBe(268);
      horizon.toBe(276);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 2);
    });

    pagination.setPage(3);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 1);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(136);
      main.toBe(163);
      horizon.toBe(171);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 2);
    });

    pagination.setPage(4);

    expect(colWidth(spec().$container, 0)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 1);
    });
    expect(colWidth(spec().$container, 1)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 1);
    });
    expect(colWidth(spec().$container, 2)).forThemes(({ classic, main, horizon }) => {
      classic.toBe(getDefaultColumnWidth());
      main.toBe(getDefaultColumnWidth());
      horizon.toBe(getDefaultColumnWidth() + 2);
    });
  });
});
