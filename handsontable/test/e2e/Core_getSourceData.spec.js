describe('Core_getSourceData', () => {
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
