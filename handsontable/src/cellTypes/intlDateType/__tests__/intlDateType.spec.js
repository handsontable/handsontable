describe('IntlDateType', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}" style="width: 300px; height: 200px;"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should print warning message on init when source data is not a valid ISO date', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [[0, 'test', true]],
      type: 'intl-date',
    });

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (3 cells). ' +
      'Invalid value for "intlDate" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "0"\n' +
      '  - row 0, col 1, value: "test"\n' +
      '  - row 0, col 2, value: "true"\n\n' +
      'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").'
    );
  });

  it('should print warning message on `loadData` when source data is not a valid ISO date', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'intl-date',
    });

    await loadData([['2026-01']]);

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intlDate" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "2026-01"\n\n' +
      'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").'
    );
  });

  it('should print warning message on `updateData` when source data is not a valid ISO date', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'intl-date',
    });

    await updateData([['2026-01']]);

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intlDate" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "2026-01"\n\n' +
      'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").'
    );
  });
});
