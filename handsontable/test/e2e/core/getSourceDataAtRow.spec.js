describe('Core.getSourceDataAtRow', () => {
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

  it('should return a copy of the dataset row passed at init, instead of a reference', () => {
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

    getSourceDataAtRow(0)[0] = 'changed!';

    expect(getSourceDataAtRow(0)).not.toBe(datasetAoA[0]);
    expect(getSourceDataAtRow(0)[0]).toEqual('a1');

    updateSettings({
      data: datasetAoO
    });

    getSourceDataAtRow(0).a = 'changed!';

    expect(getSourceDataAtRow(0)).not.toBe(datasetAoO[0]);
    expect(getSourceDataAtRow(0).a).toEqual(1);
  });

  it('should return the entire source dataset row (where the dataset is an array of arrays), regardless of the `columns` setting', () => {
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

    expect(getSourceDataAtRow(1)).toEqual(dataset[1]);
  });

  it('should return the entire source dataset, when no arguments are provided (where the dataset is an array of objects), regardless of the `columns` setting', () => {
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

    expect(getSourceDataAtRow(1)).toEqual(dataset[1]);

    updateSettings({
      data: null,
      startRows: 1,
      dataSchema: [{ a: null, b: null, c: null, d: { e: null, f: null } }],
    });

    expect(getSourceDataAtRow(0)).toEqual({ a: null, b: null, c: null, d: { e: null, f: null } });
  });
});
