describe('Core.checkedTemplate', () => {
  const id = 'testContainer';

  beforeEach(function() {
    this.$container = $(`<div id="${id}"></div>`).appendTo('body');
  });

  afterEach(function() {
    if (this.$container) {
      destroy();
      this.$container.remove();
    }
  });

  it('should be set by default as boolean `true` value', async() => {
    handsontable({
      data: [[true]],
      type: 'checkbox'
    });

    expect(getCellMeta(0, 0).checkedTemplate).toBe(true);
  });

  it('should keep the boolean value in the cell after changing the data', async() => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: true,
    });

    await setDataAtCell(0, 0, true);

    expect(getDataAtCell(0, 0)).toBe(true);

    await setDataAtCell(0, 0, 'true');

    expect(getDataAtCell(0, 0)).toBe(true);
  });

  it('should keep the boolean value (as string) in the cell after changing the data', async() => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: 'true',
    });

    await setDataAtCell(0, 0, 'true');

    expect(getDataAtCell(0, 0)).toBe('true');

    await setDataAtCell(0, 0, true);

    expect(getDataAtCell(0, 0)).toBe('true');
  });

  it('should keep the numeric value in the cell after changing the data', async() => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: 1,
    });

    await setDataAtCell(0, 0, 1);

    expect(getDataAtCell(0, 0)).toBe(1);

    await setDataAtCell(0, 0, '1');

    expect(getDataAtCell(0, 0)).toBe(1);
  });

  it('should keep the numeric value (as string) in the cell after changing the data', async() => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: '1',
    });

    await setDataAtCell(0, 0, '1');

    expect(getDataAtCell(0, 0)).toBe('1');

    await setDataAtCell(0, 0, 1);

    expect(getDataAtCell(0, 0)).toBe('1');
  });

  it('should keep the string value in the cell after changing the data', async() => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: 'yes',
    });

    await setDataAtCell(0, 0, 'yes');

    expect(getDataAtCell(0, 0)).toBe('yes');
  });

  it('should be possible to set any value to the cell', async() => {
    handsontable({
      data: [[null]],
      type: 'checkbox',
      checkedTemplate: 'yes',
    });

    await setDataAtCell(0, 0, 'tak');

    expect(getDataAtCell(0, 0)).toBe('tak');
  });
});
