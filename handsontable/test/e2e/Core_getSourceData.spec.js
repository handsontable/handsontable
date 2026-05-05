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

  describe('memoization', () => {
    it('should return the same array reference on consecutive calls when no mutation occurs', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const first = hot().getSourceData();
      const second = hot().getSourceData();

      expect(second).toBe(first);
    });

    it('should return the same array reference for getSourceDataArray on consecutive calls', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const first = hot().getSourceDataArray();
      const second = hot().getSourceDataArray();

      expect(second).toBe(first);
    });

    it('should return a new array reference after setDataAtCell()', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const first = hot().getSourceData();

      await setDataAtCell(0, 0, 'changed');

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second[0][0]).toBe('changed');
    });

    it('should return a new array reference after setSourceDataAtCell()', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const first = hot().getSourceData();

      hot().setSourceDataAtCell(0, 0, 'srcChanged');

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second[0][0]).toBe('srcChanged');
    });

    it('should return a new array reference after alter("insert_row_above")', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      await alter('insert_row_above', 0, 1);

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second.length).toBe(4);
    });

    it('should return a new array reference after alter("remove_row")', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      await alter('remove_row', 0, 1);

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second.length).toBe(2);
    });

    it('should return a new array reference after alter("insert_col_start")', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      await alter('insert_col_start', 0, 1);

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
    });

    it('should return a new array reference after alter("remove_col")', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      await alter('remove_col', 0, 1);

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
    });

    it('should return a new array reference after loadData()', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      await loadData(createSpreadsheetData(2, 2));

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second.length).toBe(2);
    });

    it('should return a new array reference after updateData()', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const first = hot().getSourceData();

      await updateData(createSpreadsheetData(2, 2));

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second.length).toBe(2);
    });

    it('should return a new array reference after populateFromArray()', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const first = hot().getSourceData();

      await populateFromArray(0, 0, [['a', 'b'], ['c', 'd']]);

      const second = hot().getSourceData();

      expect(second).not.toBe(first);
      expect(second[0][0]).toBe('a');
    });

    it('should bypass the cache when modifySourceData hook is registered', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
        modifySourceData(row, col, valueHolder) {
          valueHolder.value = `modified_${row}_${col}`;
        },
      });

      const first = hot().getSourceData();
      const second = hot().getSourceData();

      expect(second).not.toBe(first);
    });

    it('should bypass the cache when modifyRowData hook is registered', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      hot().addHook('modifyRowData', () => undefined);

      const first = hot().getSourceData();
      const second = hot().getSourceData();

      expect(second).not.toBe(first);
    });

    it('should still expose mutated values when consumers go through Handsontable APIs', async() => {
      handsontable({
        data: createSpreadsheetData(3, 3),
      });

      const cached = hot().getSourceData();

      await setDataAtCell(1, 1, 'X');

      const fresh = hot().getSourceData();

      expect(fresh).not.toBe(cached);
      expect(fresh[1][1]).toBe('X');
    });

    it('should keep range queries working independently of the full-data cache', async() => {
      handsontable({
        data: createSpreadsheetData(5, 5),
      });

      const fullA = hot().getSourceData();
      const range = hot().getSourceData(1, 1, 2, 2);
      const fullB = hot().getSourceData();

      expect(fullB).toBe(fullA);
      expect(range.length).toBe(2);
      expect(range[0].length).toBe(2);
    });

    it('should be much faster than re-cloning when called repeatedly without mutation', async() => {
      handsontable({
        data: createSpreadsheetData(200, 10),
      });

      const ITERATIONS = 1000;

      const t0 = performance.now();

      for (let i = 0; i < ITERATIONS; i += 1) {
        hot().getSourceData();
      }

      const cachedDuration = performance.now() - t0;

      const t1 = performance.now();

      for (let i = 0; i < ITERATIONS; i += 1) {
        await setDataAtCell(0, 0, i);
        hot().getSourceData();
      }

      const uncachedDuration = performance.now() - t1;

      // Cached path should be at least 5x faster than per-call rebuilds; tolerant for CI noise.
      expect(cachedDuration * 5).toBeLessThan(uncachedDuration);
    });
  });
});
