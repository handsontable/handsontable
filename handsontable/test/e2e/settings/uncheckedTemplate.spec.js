describe('Core.uncheckedTemplate', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('#rootWrapper');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be set by default as boolean `true` value', () => {
    handsontable({
      data: [[false]],
      type: 'checkbox'
    });

    expect(getCellMeta(0, 0).uncheckedTemplate).toBe(false);
  });

  it('should keep the boolean value in the cell after changing the data', () => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      uncheckedTemplate: false,
    });

    setDataAtCell(0, 0, false);

    expect(getDataAtCell(0, 0)).toBe(false);

    setDataAtCell(0, 0, 'false');

    expect(getDataAtCell(0, 0)).toBe(false);
  });

  it('should keep the boolean value (as string) in the cell after changing the data', () => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      uncheckedTemplate: 'false',
    });

    setDataAtCell(0, 0, 'false');

    expect(getDataAtCell(0, 0)).toBe('false');

    setDataAtCell(0, 0, false);

    expect(getDataAtCell(0, 0)).toBe('false');
  });

  it('should keep the numeric value in the cell after changing the data', () => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      uncheckedTemplate: 0,
    });

    setDataAtCell(0, 0, 0);

    expect(getDataAtCell(0, 0)).toBe(0);

    setDataAtCell(0, 0, '0');

    expect(getDataAtCell(0, 0)).toBe(0);
  });

  it('should keep the numeric value (as string) in the cell after changing the data', () => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      uncheckedTemplate: '0',
    });

    setDataAtCell(0, 0, '0');

    expect(getDataAtCell(0, 0)).toBe('0');

    setDataAtCell(0, 0, 0);

    expect(getDataAtCell(0, 0)).toBe('0');
  });

  it('should keep the string value in the cell after changing the data', () => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      uncheckedTemplate: 'no',
    });

    setDataAtCell(0, 0, 'no');

    expect(getDataAtCell(0, 0)).toBe('no');
  });

  it('should be possible to set any value to the cell', () => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: 'no',
    });

    setDataAtCell(0, 0, 'nie');

    expect(getDataAtCell(0, 0)).toBe('nie');
  });
});
