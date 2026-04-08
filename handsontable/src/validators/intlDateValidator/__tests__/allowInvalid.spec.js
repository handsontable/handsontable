describe('IntlDateType - allowInvalid', () => {
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

  it('should pass-through non valid value when allowInvalid is true', async() => {
    handsontable({
      data: [['2026-01-28', '2026-01', 'test', '2026-01-29']],
      type: 'intl-date',
      dateFormat: { dateStyle: 'short' },
      allowInvalid: true,
    });

    expect(getData()).toEqual([['2026-01-28', '2026-01', 'test', '2026-01-29']]);
    expect(getSourceData()).toEqual([['2026-01-28', '2026-01', 'test', '2026-01-29']]);
    expect(getCell(0, 0).innerText).toBe('1/28/26');

    await setDataAtCell(0, 0, 'test');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['test', '2026-01', 'test', '2026-01-29']]);
    expect(getSourceData()).toEqual([['test', '2026-01', 'test', '2026-01-29']]);
    expect(getCell(0, 0).innerText).toBe('#bad-value#');

    await setSourceDataAtCell(0, 0, 'test2');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['test2', '2026-01', 'test', '2026-01-29']]);
    expect(getSourceData()).toEqual([['test2', '2026-01', 'test', '2026-01-29']]);
    expect(getCell(0, 0).innerText).toBe('#bad-value#');
  });

  it('should reject non valid value when allowInvalid is false', async() => {
    handsontable({
      data: [['2026-01-28', '2026-01', 'test', '2026-01-29']],
      type: 'intl-date',
      dateFormat: { dateStyle: 'short' },
      allowEmpty: true,
      allowInvalid: false,
    });

    expect(getData()).toEqual([['2026-01-28', null, null, '2026-01-29']]);
    expect(getSourceData()).toEqual([['2026-01-28', null, null, '2026-01-29']]);
    expect(getCell(0, 0).innerText).toBe('1/28/26');

    await setDataAtCell(0, 0, 'test');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['2026-01-28', null, null, '2026-01-29']]);
    expect(getSourceData()).toEqual([['2026-01-28', null, null, '2026-01-29']]);
    expect(getCell(0, 0).innerText).toBe('1/28/26');

    await setSourceDataAtCell(0, 0, 'test');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['2026-01-28', null, null, '2026-01-29']]);
    expect(getSourceData()).toEqual([['2026-01-28', null, null, '2026-01-29']]);
    expect(getCell(0, 0).innerText).toBe('1/28/26');
  });

  it('should not print warning message on `setSourceDataAtCell` when source data is empty and allowInvalid is true', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'intl-date',
      allowInvalid: true,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });

  it('should print warning message on `setSourceDataAtCell` when source data is empty and allowInvalid is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'intl-date',
      allowInvalid: false,
      allowEmpty: false,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-date" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: ""\n\n' +
      'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").'
    );

    warnSpy.calls.reset();

    await setSourceDataAtCell(0, 0, '2026-01');

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-date" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "2026-01"\n\n' +
      'Expected a value compatible with the ISO 8601 date format ("YYYY-MM-DD").'
    );
  });

  it('should not print warning message on `setDataAtCell` when source data is empty and allowInvalid is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['2026-01-28']],
      type: 'intl-date',
      allowInvalid: false,
      allowEmpty: false,
    });

    await setDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });
});
