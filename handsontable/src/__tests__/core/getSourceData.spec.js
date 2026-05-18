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

  it('should return a copy of the dataset passed at init, instead of a reference', async() => {
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

    await updateSettings({
      data: datasetAoO
    });

    getSourceData()[0].a = 'changed!';

    expect(getSourceData()).not.toBe(datasetAoO);
    expect(getSourceData()[0].a).toEqual(1);
  });

  it('should return the entire source dataset, when no arguments are provided (where the dataset is an array of arrays), regardless of the `columns` option', async() => {
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

  it('should return the entire source dataset, when no arguments are provided (where the dataset is an array of objects), regardless of the `columns` option', async() => {
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

    await updateSettings({
      data: null,
      startRows: 1,
      dataSchema: [{ a: null, b: null, c: null, d: { e: null, f: null } }],
    });

    expect(getSourceData()).toEqual([
      { a: null, b: null, c: null, d: { e: null, f: null } }
    ]);
  });

  it('should return only the "visual" part of the dataset (the parts declared using the `columns` option and/or the dataSchema), ' +
    'when row and column rage is provided (where the dataset is an array of arrays)', async() => {
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
    'when row and column rage is provided (where the dataset is an array of objects)', async() => {
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

    await updateSettings({
      data: null,
      startRows: 1,
      dataSchema: [{ a: null, b: null, c: null, d: { e: null, f: null } }],
    });

    expect(getSourceData(0, 0, countRows() - 1, countCols() - 1)).toEqual([
      { a: null, d: { e: null } },
    ]);
  });

  describe('clone semantics', () => {
    it('returns a fresh outer array on consecutive calls', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const first = hot().getSourceData();
      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second).toEqual(first);
    });

    it('returns row clones so mutating the returned data does not leak across calls', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      first[0][0] = 'mutated';

      const second = hot().getSourceData();

      expect(second[0][0]).toBe('A1');
    });

    it('reflects values written through setDataAtCell', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      await setDataAtCell(0, 0, 'changed');

      expect(hot().getSourceData()[0][0]).toBe('changed');
    });

    it('reflects rows added by alter("insert_row_above")', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      await alter('insert_row_above', 0, 1);

      expect(hot().getSourceData().length).toBe(4);
    });

    it('reflects the data passed to loadData', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      await loadData(createSpreadsheetData(2, 2));

      expect(hot().getSourceData().length).toBe(2);
    });

    it('still routes through getByRange when modifySourceData is registered', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        modifySourceData(row, col, valueHolder) {
          valueHolder.value = `mod_${row}_${col}`;
        },
      });

      const result = hot().getSourceData();

      expect(result[0][0]).toBe('mod_0_0');
      expect(result[2][2]).toBe('mod_2_2');
    });
  });

  describe('performance', () => {
    it('the fast-clone path completes 1000 full-data fetches well under a second', async() => {
      handsontable({
        data: createSpreadsheetData(200, 10),
      });

      const ITERATIONS = 1000;
      const t0 = performance.now();

      for (let i = 0; i < ITERATIONS; i += 1) {
        hot().getSourceData();
      }

      const elapsed = performance.now() - t0;

      // Pre-fix on Chrome: ~340 ms / 1000 calls. Post-fix: ~50 ms.
      // Loose threshold to avoid CI noise; the assertion still demonstrates
      // a meaningful gap from the previous baseline.
      expect(elapsed).toBeLessThan(200);
    });
  });
});
