describe('TimeType - allowInvalid', () => {
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
      data: [['12:00', '12:00:00', '12:00:00.000', 'test']],
      type: 'intl-time',
      timeFormat: { timeStyle: 'short' },
      allowInvalid: true,
    });

    expect(getData()).toEqual([['12:00', '12:00:00', '12:00:00.000', 'test']]);
    expect(getSourceData()).toEqual([['12:00', '12:00:00', '12:00:00.000', 'test']]);
    expect(getCell(0, 0).innerText).toBe('12:00 PM');

    await setDataAtCell(0, 0, 'test');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['test', '12:00:00', '12:00:00.000', 'test']]);
    expect(getSourceData()).toEqual([['test', '12:00:00', '12:00:00.000', 'test']]);
    expect(getCell(0, 0).innerText).toBe('#bad-value#');

    await setSourceDataAtCell(0, 0, 'test2');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['test2', '12:00:00', '12:00:00.000', 'test']]);
    expect(getSourceData()).toEqual([['test2', '12:00:00', '12:00:00.000', 'test']]);
    expect(getCell(0, 0).innerText).toBe('#bad-value#');
  });

  it('should reject non valid value when allowInvalid is false', async() => {
    handsontable({
      data: [['12:00', '56:00', '11:11', 'test']],
      type: 'intl-time',
      timeFormat: { timeStyle: 'short' },
      allowEmpty: true,
      allowInvalid: false,
    });

    expect(getData()).toEqual([['12:00', null, '11:11', null]]);
    expect(getSourceData()).toEqual([['12:00', null, '11:11', null]]);
    expect(getCell(0, 0).innerText).toBe('12:00 PM');

    await setDataAtCell(0, 0, 'test');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['12:00', null, '11:11', null]]);
    expect(getSourceData()).toEqual([['12:00', null, '11:11', null]]);
    expect(getCell(0, 0).innerText).toBe('12:00 PM');

    await setSourceDataAtCell(0, 0, 'test');
    await waitForNextAnimationFrames(1);

    expect(getData()).toEqual([['12:00', null, '11:11', null]]);
    expect(getSourceData()).toEqual([['12:00', null, '11:11', null]]);
    expect(getCell(0, 0).innerText).toBe('12:00 PM');
  });

  it('should not print warning message on `setSourceDataAtCell` when source data is empty and allowInvalid is true', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
      allowInvalid: true,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });

  it('should print warning message on `setSourceDataAtCell` when source data is empty and allowInvalid is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
      allowInvalid: false,
      allowEmpty: false,
    });

    await setSourceDataAtCell(0, 0, '');

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-time" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: ""\n\n' +
      'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").'
    );

    warnSpy.calls.reset();

    await setSourceDataAtCell(0, 0, '12:000');

    expect(warnSpy).toHaveBeenCalledWith('Source data warning (1 cell). ' +
      'Invalid value for "intl-time" cell type.\n\n' +
      'Affected cells:\n' +
      '  - row 0, col 0, value: "12:000"\n\n' +
      'Expected a value compatible with the 24-hour time format ("HH:mm", "HH:mm:ss" or "HH:mm:ss.SSS").'
    );
  });

  it('should not print warning message on `setDataAtCell` when source data is empty and allowInvalid is false', async() => {
    const warnSpy = spyOnConsoleWarn();

    handsontable({
      data: [['12:00']],
      type: 'intl-time',
      allowInvalid: false,
      allowEmpty: false,
    });

    await setDataAtCell(0, 0, '');

    expect(warnSpy).not.toHaveBeenCalledWith();
  });
});
