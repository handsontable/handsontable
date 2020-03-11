describe('Core.getSourceData', () => {
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

  it('should return a copy of the dataset passed at init, instead of a reference', () => {
    const datasetAoA = [
      ['a1', 'a2', 'a3'],
      ['b1', 'b2', 'b3'],
      ['c1', 'c2', 'c3']
    ];

    const datasetAoO = [
      { a: 1, b: 2, c: 3, d: { e: 'nested1', f: 'nested2_1' } },
      { a: 4, b: 5, c: 6, d: { e: 'nested2', f: 'nested2_2' } },
      { a: 7, b: 8, c: 9, d: { e: 'nested3', f: 'nested2_3' } }
    ];

    handsontable({
      data: datasetAoA,
      columns: [
        {}
      ]
    });

    getSourceData()[0][0] = 'changed!';

    expect(getSourceData()).not.toBe(datasetAoA);
    expect(getSourceData()[0][0]).toEqual('a1');

    updateSettings({
      data: datasetAoO
    });

    getSourceData()[0].a = 'changed!';

    expect(getSourceData()).not.toBe(datasetAoO);
    expect(getSourceData()[0].a).toEqual(1);
  });

  it('should return the entire source dataset, when no arguments are provided (where the dataset is an array of arrays), regardless of the `columns` option', () => {
    const dataset = [
      ['a1', 'a2', 'a3'],
      ['b1', 'b2', 'b3'],
      ['c1', 'c2', 'c3']
    ];

    handsontable({
      data: dataset,
      columns: [
        {}
      ]
    });

    expect(getSourceData()).toEqual(dataset);
  });

  it('should return the entire source dataset, when no arguments are provided (where the dataset is an array of objects), regardless of the `columns` option', () => {
    const dataset = [
      { a: 1, b: 2, c: 3, d: { e: 'nested1', f: 'nested2_1' } },
      { a: 4, b: 5, c: 6, d: { e: 'nested2', f: 'nested2_2' } },
      { a: 7, b: 8, c: 9, d: { e: 'nested3', f: 'nested2_3' } }
    ];

    handsontable({
      data: dataset,
      columns: [
        { data: 'a' }
      ]
    });

    expect(getSourceData()).toEqual(dataset);

    updateSettings({
      data: null,
      startRows: 1,
      dataSchema: [{ a: null, b: null, c: null, d: { e: null, f: null } }],
    });

    expect(getSourceData()).toEqual([
      { a: null, b: null, c: null, d: { e: null, f: null } }
    ]);
  });

  it('should return only the "visual" part of the dataset (the parts declared using the `columns` option and/or the dataSchema), ' +
    'when row and column rage is provided (where the dataset is an array of arrays)', () => {
    const dataset = [
      ['a1', 'a2', 'a3'],
      ['b1', 'b2', 'b3'],
      ['c1', 'c2', 'c3']
    ];

    handsontable({
      data: dataset,
      columns: [
        {}, {}
      ]
    });

    expect(getSourceData(0, 0, countRows() - 1, countCols() - 1)).toEqual([
      ['a1', 'a2'],
      ['b1', 'b2'],
      ['c1', 'c2']
    ]);
  });

  it('should return only the "visual" part of the dataset (the parts declared using the `columns` option and/or the dataSchema), ' +
    'when row and column rage is provided (where the dataset is an array of objects)', () => {
    const dataset = [
      { a: 1, b: 2, c: 3, d: { e: 'nested1', f: 'nested2_1' } },
      { a: 4, b: 5, c: 6, d: { e: 'nested2', f: 'nested2_2' } },
      { a: 7, b: 8, c: 9, d: { e: 'nested3', f: 'nested2_3' } }
    ];

    handsontable({
      data: dataset,
      columns: [
        { data: 'a' }, { data: 'd.e' }
      ]
    });

    expect(getSourceData(0, 0, countRows() - 1, countCols() - 1)).toEqual([
      { a: 1, d: { e: 'nested1' } },
      { a: 4, d: { e: 'nested2' } },
      { a: 7, d: { e: 'nested3' } }
    ]);

    updateSettings({
      data: null,
      startRows: 1,
      dataSchema: [{ a: null, b: null, c: null, d: { e: null, f: null } }],
    });

    expect(getSourceData(0, 0, countRows() - 1, countCols() - 1)).toEqual([
      { a: null, d: { e: null } },
    ]);
  });
});
