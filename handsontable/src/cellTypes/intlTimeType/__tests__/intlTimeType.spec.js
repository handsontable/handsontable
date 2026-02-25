describe('IntlTimeType', () => {
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
      type: 'intl-time',
    });

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (3 cells). ' +
      'Invalid value for "intl-time" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "0"\n' +
      '  - row 0, col 1, value: "test"\n' +
      '  - row 0, col 2, value: "true"\n\n' +
      'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").'
    );
  });

  it('should print warning message on `loadData` when source data is not a valid time format', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
    });

    await loadData([['12:000']]);

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-time" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "12:000"\n\n' +
      'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").'
    );
  });

  it('should print warning message on `updateData` when source data is not a valid time format', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
    });

    await updateData([['12:000']]);

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-time" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "12:000"\n\n' +
      'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").'
    );
  });
});
