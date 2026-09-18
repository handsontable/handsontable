describe('Filters - getDataMapAtColumn method', () => {
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

  it('should return the full dataset for a column with cell meta for each row', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
    });

    const data = getPlugin('filters').getDataMapAtColumn(1);

    expect(data.length).toBe(5);
    expect(data).toEqual([
      {
        row: 0,
        value: 'B1',
        meta: jasmine.objectContaining({
          row: 0,
          col: 1,
          visualRow: 0,
          visualCol: 1,
        })
      },
      {
        row: 1,
        value: 'B2',
        meta: jasmine.objectContaining({
          row: 1,
          col: 1,
          visualRow: 1,
          visualCol: 1,
        })
      },
      {
        row: 2,
        value: 'B3',
        meta: jasmine.objectContaining({
          row: 2,
          col: 1,
          visualRow: 2,
          visualCol: 1,
        })
      },
      {
        row: 3,
        value: 'B4',
        meta: jasmine.objectContaining({
          row: 3,
          col: 1,
          visualRow: 3,
          visualCol: 1,
        })
      },
      {
        row: 4,
        value: 'B5',
        meta: jasmine.objectContaining({
          row: 4,
          col: 1,
          visualRow: 4,
          visualCol: 1,
        })
      },
    ]);
  });

  it('should return a plain array of `{row, meta, value}` objects, one per row', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
    });

    const data = getPlugin('filters').getDataMapAtColumn(1);

    // The read is columnar internally. This is the shape the public method publishes, and the two
    // must not drift: a consumer indexes the array, reads `entry.value`, and keeps `entry.meta`.
    expect(Array.isArray(data)).toBe(true);
    expect(data.map(entry => Object.keys(entry)))
      .toEqual([
        ['row', 'meta', 'value'],
        ['row', 'meta', 'value'],
        ['row', 'meta', 'value'],
        ['row', 'meta', 'value'],
        ['row', 'meta', 'value'],
      ]);
  });

  it('should give every entry its own cell meta object', async() => {
    handsontable({
      data: createSpreadsheetData(500, 5),
      filters: true,
      width: 300,
      height: 100,
      colWidths: 50,
      rowHeights: 23,
      autoColumnSize: false,
      autoRowSize: false,
    });

    // Rows this far below the render band store no cell meta of their own, so this is where a
    // shared object would surface. Painted rows always have one.
    const data = getPlugin('filters').getDataMapAtColumn(1);

    expect(data.length).toBe(500);
    expect(new Set(data.map(entry => entry.meta)).size).toBe(500);
    expect(data[400].meta.row).toBe(400);
    expect(data[400].meta.visualRow).toBe(400);
    expect(data[450].meta.row).toBe(450);
    // Reading a later entry must not re-point an earlier one.
    expect(data[400].meta.row).toBe(400);
  });

  it('should read only the given physical rows, in the given order', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
    });

    const data = getPlugin('filters').getDataMapAtColumn(1, [4, 1]);

    expect(data.length).toBe(2);
    expect(data.map(entry => entry.row)).toEqual([4, 1]);
    expect(data.map(entry => entry.value)).toEqual(['B5', 'B2']);
    expect(data[0].meta.row).toBe(4);
    expect(data[1].meta.row).toBe(1);
  });

  it('should return the full dataset for a column when the data is already filtered', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
    });

    getPlugin('filters').addCondition(1, 'eq', ['B3']);
    getPlugin('filters').filter();

    const data = getPlugin('filters').getDataMapAtColumn(1);

    expect(data.length).toBe(5);
    expect(data).toEqual([
      {
        row: 0,
        value: 'B1',
        meta: jasmine.objectContaining({
          row: 0,
          col: 1,
          visualRow: 0,
          visualCol: 1,
        })
      },
      {
        row: 1,
        value: 'B2',
        meta: jasmine.objectContaining({
          row: 1,
          col: 1,
          visualRow: 1,
          visualCol: 1,
        })
      },
      {
        row: 2,
        value: 'B3',
        meta: jasmine.objectContaining({
          row: 2,
          col: 1,
          visualRow: 2,
          visualCol: 1,
        })
      },
      {
        row: 3,
        value: 'B4',
        meta: jasmine.objectContaining({
          row: 3,
          col: 1,
          visualRow: 3,
          visualCol: 1,
        })
      },
      {
        row: 4,
        value: 'B5',
        meta: jasmine.objectContaining({
          row: 4,
          col: 1,
          visualRow: 4,
          visualCol: 1,
        })
      },
    ]);
  });

  it('should return the full dataset for a column when the data is hidden and the sequence is changed', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
    });

    rowIndexMapper().setIndexesSequence([2, 3, 4, 1, 0]);

    const hidingMap = rowIndexMapper().createAndRegisterIndexMap('map', 'hiding', false);

    hidingMap.setValueAtIndex(2, true);

    await render();

    const data = getPlugin('filters').getDataMapAtColumn(1);

    expect(data.length).toBe(5);
    expect(data).toEqual([
      {
        row: 0,
        value: 'B1',
        meta: jasmine.objectContaining({
          row: 0,
          col: 1,
          visualRow: 0,
          visualCol: 1,
        })
      },
      {
        row: 1,
        value: 'B2',
        meta: jasmine.objectContaining({
          row: 1,
          col: 1,
          visualRow: 1,
          visualCol: 1,
        })
      },
      {
        row: 2,
        value: 'B3',
        meta: jasmine.objectContaining({
          row: 2,
          col: 1,
          visualRow: 2,
          visualCol: 1,
        })
      },
      {
        row: 3,
        value: 'B4',
        meta: jasmine.objectContaining({
          row: 3,
          col: 1,
          visualRow: 3,
          visualCol: 1,
        })
      },
      {
        row: 4,
        value: 'B5',
        meta: jasmine.objectContaining({
          row: 4,
          col: 1,
          visualRow: 4,
          visualCol: 1,
        })
      },
    ]);
  });

  it('should return the dataset transformed by the `modifyData` hook', async() => {
    const modifyData = jasmine.createSpy('modifyData');

    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
      modifyData,
    });

    modifyData.calls.reset();

    getPlugin('filters').getDataMapAtColumn(1);

    expect(modifyData).toHaveBeenCalledTimes(5);
    expect(modifyData).toHaveBeenCalledWith(0, 1, jasmine.objectContaining({ value: 'B1' }), 'get');
    expect(modifyData).toHaveBeenCalledWith(1, 1, jasmine.objectContaining({ value: 'B2' }), 'get');
    expect(modifyData).toHaveBeenCalledWith(2, 1, jasmine.objectContaining({ value: 'B3' }), 'get');
    expect(modifyData).toHaveBeenCalledWith(3, 1, jasmine.objectContaining({ value: 'B4' }), 'get');
    expect(modifyData).toHaveBeenCalledWith(4, 1, jasmine.objectContaining({ value: 'B5' }), 'get');
  });

  it('should return the dataset transformed by the `valueGetter` function', async() => {
    handsontable({
      data: createSpreadsheetData(5, 5),
      filters: true,
      valueGetter: value => `Value: ${value}`,
    });

    const data = getPlugin('filters').getDataMapAtColumn(1).map(item => item.value);

    expect(data).toEqual(['Value: B1', 'Value: B2', 'Value: B3', 'Value: B4', 'Value: B5']);
  });
});
