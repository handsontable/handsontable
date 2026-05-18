describe('Core.valueFormatter', () => {
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

  it('should be called once for cell render', async() => {
    const valueFormatter = jasmine.createSpy('valueFormatter');

    handsontable({
      data: createSpreadsheetData(1, 1),
      valueFormatter,
      autoRowSize: false,
      autoColumnSize: false,
    });

    expect(valueFormatter).toHaveBeenCalledTimes(1);

    await render();

    expect(valueFormatter).toHaveBeenCalledTimes(2);
  });

  it('should be called once for each cell and affect the displayed value only', async() => {
    const valueFormatter = jasmine.createSpy('valueFormatter').and.callFake(value => `Value: ${value}`);

    handsontable({
      data: createSpreadsheetData(2, 2),
      valueFormatter,
      autoRowSize: false,
      autoColumnSize: false,
    });

    expect(valueFormatter).toHaveBeenCalledTimes(4);
    expect(valueFormatter).toHaveBeenCalledWith('A1', getCellMeta(0, 0));
    expect(valueFormatter).toHaveBeenCalledWith('B1', getCellMeta(0, 1));
    expect(valueFormatter).toHaveBeenCalledWith('A2', getCellMeta(1, 0));
    expect(valueFormatter).toHaveBeenCalledWith('B2', getCellMeta(1, 1));
    expect(getRenderedValue(0, 0)).toBe('Value: A1');
    expect(getRenderedValue(0, 1)).toBe('Value: B1');
    expect(getRenderedValue(1, 0)).toBe('Value: A2');
    expect(getRenderedValue(1, 1)).toBe('Value: B2');
    // no changes in the data source
    expect(getData()).toEqual([
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]);
    expect(getSourceData()).toEqual([
      ['A1', 'B1'],
      ['A2', 'B2'],
    ]);
  });

  it('should be possible to overwrite value formatter when cell type is used', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
        .map((row, rowIndex) => row
          .map((value, colIndex) => (rowIndex + 1) * (colIndex + 1))),
      type: 'numeric',
      valueFormatter(value) {
        return `formatted: ${value * 2}`;
      }
    });

    expect(getCell(0, 0).textContent).toBe('formatted: 2');
    expect(getCell(0, 1).textContent).toBe('formatted: 4');
    expect(getCell(1, 0).textContent).toBe('formatted: 4');
    expect(getCell(1, 1).textContent).toBe('formatted: 8');
    // no changes in the data source
    expect(getData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
    expect(getSourceData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
  });

  it('should be possible to overwrite value formatter when renderer is used (as string)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
        .map((row, rowIndex) => row
          .map((value, colIndex) => (rowIndex + 1) * (colIndex + 1))),
      renderer: 'numeric',
      valueFormatter(value) {
        return `formatted: ${value * 2}`;
      }
    });

    expect(getCell(0, 0).textContent).toBe('formatted: 2');
    expect(getCell(0, 1).textContent).toBe('formatted: 4');
    expect(getCell(1, 0).textContent).toBe('formatted: 4');
    expect(getCell(1, 1).textContent).toBe('formatted: 8');
    // no changes in the data source
    expect(getData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
    expect(getSourceData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
  });

  it('should be possible to overwrite value formatter when renderer is used (as function)', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
        .map((row, rowIndex) => row
          .map((value, colIndex) => (rowIndex + 1) * (colIndex + 1))),
      renderer(hotInstance, td, row, column, prop, value) {
        td.innerHTML = value;
      },
      valueFormatter(value) {
        return `formatted: ${value * 2}`;
      }
    });

    expect(getCell(0, 0).textContent).toBe('formatted: 2');
    expect(getCell(0, 1).textContent).toBe('formatted: 4');
    expect(getCell(1, 0).textContent).toBe('formatted: 4');
    expect(getCell(1, 1).textContent).toBe('formatted: 8');
    // no changes in the data source
    expect(getData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
    expect(getSourceData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
  });

  it('should be possible to overwrite value formatter via static method of the renderer function', async() => {
    const myRenderer = function(hotInstance, td, row, column, prop, value) {
      td.innerHTML = value;
    };

    myRenderer.valueFormatter = function(value) {
      return `formatted: ${value * 2}`;
    };

    handsontable({
      data: createSpreadsheetData(2, 2)
        .map((row, rowIndex) => row
          .map((value, colIndex) => (rowIndex + 1) * (colIndex + 1))),
      renderer: myRenderer,
    });

    expect(getCell(0, 0).textContent).toBe('formatted: 2');
    expect(getCell(0, 1).textContent).toBe('formatted: 4');
    expect(getCell(1, 0).textContent).toBe('formatted: 4');
    expect(getCell(1, 1).textContent).toBe('formatted: 8');
    // no changes in the data source
    expect(getData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
    expect(getSourceData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
  });

  it('should be possible to overwrite value formatter for each cell separately', async() => {
    handsontable({
      data: createSpreadsheetData(2, 2)
        .map((row, rowIndex) => row
          .map((value, colIndex) => (rowIndex + 1) * (colIndex + 1))),
      cells(row, column) {
        if (row === 0 && column === 0) {
          return {
            valueFormatter: value => `A1: ${value * 2}`,
          };
        }
        if (row === 1 && column === 1) {
          return {
            valueFormatter: value => `B2: ${value * 4}`,
          };
        }
      },
    });

    expect(getCell(0, 0).textContent).toBe('A1: 2');
    expect(getCell(0, 1).textContent).toBe('2');
    expect(getCell(1, 0).textContent).toBe('2');
    expect(getCell(1, 1).textContent).toBe('B2: 16');
    // no changes in the data source
    expect(getData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
    expect(getSourceData()).toEqual([
      [1, 2],
      [2, 4],
    ]);
  });
});
