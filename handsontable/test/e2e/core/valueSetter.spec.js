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

  it('should call valueSetter only when necessary when using the data-setting/getting API methods', async() => {
    const data = createSpreadsheetData(2, 3);
    const valueSetterSpy = jasmine.createSpy('valueSetter').and.callFake(value => `Value: ${value}`);

    handsontable({
      data,
      valueSetter: valueSetterSpy,
      autoRowSize: false,
      autoColumnSize: false,
    });

    valueSetterSpy.calls.reset();

    // `get*` methods -> no calls
    getDataAtCell(0, 0);
    expect(valueSetterSpy.calls.count()).toBe(0);

    valueSetterSpy.calls.reset();

    getSourceDataAtCell(0, 0);
    expect(valueSetterSpy.calls.count()).toBe(0);

    valueSetterSpy.calls.reset();

    getDataAtRow(0);
    expect(valueSetterSpy.calls.count()).toBe(0);

    valueSetterSpy.calls.reset();

    getSourceDataAtRow(0);
    expect(valueSetterSpy.calls.count()).toBe(0);

    valueSetterSpy.calls.reset();

    getDataAtCol(0);
    expect(valueSetterSpy.calls.count()).toBe(0);

    valueSetterSpy.calls.reset();

    getSourceDataAtCol(0);
    expect(valueSetterSpy.calls.count()).toBe(0);

    valueSetterSpy.calls.reset();

    getData();
    expect(valueSetterSpy.calls.count()).toBe(0);

    // `set*` methods -> 1 call each cell
    await setDataAtCell(0, 0, 'New Value');
    expect(valueSetterSpy.calls.count()).toBe(1);

    valueSetterSpy.calls.reset();

    await setDataAtRowProp(0, 0, 'New Value');
    expect(valueSetterSpy.calls.count()).toBe(1);

    valueSetterSpy.calls.reset();

    await setSourceDataAtCell(0, 0, 'New Value');
    expect(valueSetterSpy.calls.count()).toBe(1);

    valueSetterSpy.calls.reset();

    // loadData should NOT call the `valueSetter`
    await loadData([['A1', 'B1', 'C1'], ['A2', 'B2', 'C2']]);
    expect(valueSetterSpy.calls.count()).toBe(0);
  });
});
