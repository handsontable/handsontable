describe('valueGetter', () => {
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

  it('should allow modifying the values of `getData*` (without modifying `getSourceData*`) using the `valueGetter` option', async() => {
    const data = createSpreadsheetData(2, 2);

    handsontable({
      data,
      valueGetter: value => `Value: ${value}`,
    });

    expect(getSourceData()).toEqual(data);
    expect(getData()).toEqual(data.map((row) => {
      return row.map(value => `Value: ${value}`);
    }));

    expect(getSourceDataAtCell(0, 0)).toEqual(data[0][0]);
    expect(getDataAtCell(0, 0)).toEqual(`Value: ${data[0][0]}`);

    expect(getSourceDataAtRow(0)).toEqual(data[0]);
    expect(getDataAtRow(0)).toEqual(data[0].map(value => `Value: ${value}`));

    expect(getSourceDataAtCol(0)).toEqual(data.map(row => row[0]));
    expect(getDataAtCol(0)).toEqual(data.map(row => `Value: ${row[0]}`));
  });

  it('should allow modifying the displayed cell values using the `valueGetter` option', async() => {
    const data = createSpreadsheetData(2, 2);

    handsontable({
      data,
      valueGetter: value => `Value: ${value}`,
    });

    expect(getCell(0, 0, true).textContent).toEqual(`Value: ${data[0][0]}`);
    expect(getCell(0, 1, true).textContent).toEqual(`Value: ${data[0][1]}`);
    expect(getCell(1, 0, true).textContent).toEqual(`Value: ${data[1][0]}`);
    expect(getCell(1, 1, true).textContent).toEqual(`Value: ${data[1][1]}`);
  });

  it('should allow modifying the values received from the dataset for a single column or cell using the `valueGetter` option', async() => {
    const data = createSpreadsheetData(2, 2);

    handsontable({
      data,
      columns: [
        {
          valueGetter: value => `Value: ${value} first column`,
        },
        {}
      ],
      cells: (row, column) => {
        if (row === 0 && column === 1) {
          return {
            valueGetter: value => `Value: ${value} at a cell`,
          };
        }
      },
    });

    expect(getSourceData()).toEqual(data);
    expect(getData()).toEqual([
      ['Value: A1 first column', 'Value: B1 at a cell'],
      ['Value: A2 first column', 'B2'],
    ]);
  });
});
