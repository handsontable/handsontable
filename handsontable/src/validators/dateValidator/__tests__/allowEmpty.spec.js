describe('DateType - allowEmpty', () => {
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

  it('should not print warning message on `setSourceDataAtCell` when source data is empty and allowEmpty is true', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'date',
      allowEmpty: true,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });

  it('should print warning message on `setSourceDataAtCell` when source data is empty and allowEmpty is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'date',
      allowEmpty: false,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "date" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: ""\n\n' +
      'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").'
    );
  });

  it('should not print warning message on `setDataAtCell` when source data is empty and allowEmpty is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'date',
      allowEmpty: false,
    });

    await setDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });
});
