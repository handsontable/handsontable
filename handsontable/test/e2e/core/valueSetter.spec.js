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

  it('should allow modifying the values saved to the dataset for a single column or cell using the `valueSetter` option', async() => {
    const data = createSpreadsheetData(2, 2);

    handsontable({
      data,
      columns: [
        {
          valueSetter: value => `Value: ${value} first column`,
        },
        {}
      ],
      cells: (row, column) => {
        if (row === 0 && column === 1) {
          return {
            valueSetter: value => `Value: ${value} at a cell`,
          };
        }
      },
    });

    expect(getSourceData()).toEqual(data);
    expect(getData()).toEqual(data);

    await populateFromArray(0, 0, data);

    expect(getData()).toEqual([
      ['Value: A1 first column', 'Value: B1 at a cell'],
      ['Value: A2 first column', 'B2'],
    ]);
    expect(getSourceData()).toEqual([
      ['Value: A1 first column', 'Value: B1 at a cell'],
      ['Value: A2 first column', 'B2'],
    ]);
  });
});
