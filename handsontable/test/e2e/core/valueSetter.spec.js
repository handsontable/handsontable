describe('valueSetter', () => {
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

  it('should allow modifying the values saved to the dataset using the `valueSetter` option', async() => {
    const data = createSpreadsheetData(2, 2);

    handsontable({
      data,
      valueSetter: (value, row, column) => `Value: ${value} at ${row}, ${column}`,
    });

    expect(getSourceData()).toEqual(data);
    expect(getData()).toEqual(data);

    await setDataAtCell(0, 0, 'test');

    expect(getSourceDataAtCell(0, 0)).toEqual('Value: test at 0, 0');
    expect(getDataAtCell(0, 0)).toEqual('Value: test at 0, 0');
  });
});
