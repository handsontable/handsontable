describe('TimeType - allowEmpty', () => {
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
      data: [['12:00']],
      type: 'intl-time',
      allowEmpty: true,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });

  it('should print warning message on `setSourceDataAtCell` when source data is empty and allowEmpty is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
      allowEmpty: false,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-time" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: ""\n\n' +
      'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").'
    );
  });

  it('should not print warning message on `setDataAtCell` when source data is empty and allowEmpty is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
      allowEmpty: false,
    });

    await setDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });
});
