import { registerAllModules } from 'handsontable/registry';
import { createGrid, deferred, products, settle } from './helpers/grid';

registerAllModules();

describe('AsyncValues: rows by physical index and by id', () => {
  it('should start a request for a filtered-out row by its id and write its source data', async() => {
    const { hot, plugin, destroy } = createGrid({ rowId: 'id', filters: true });
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'neq', ['B']);
    filters.filter();

    const contexts: unknown[] = [];
    const result = plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, async(context) => {
      contexts.push({ row: context.row, physicalRow: context.physicalRow, rowId: context.rowId });

      return 'new B';
    });

    expect(plugin.getAsyncStateAt({ rowId: 'b', prop: 'name' })).toEqual({ status: 'pending' });
    expect(await result).toEqual({ status: 'resolved', value: 'new B' });
    expect(contexts).toEqual([{ row: null, physicalRow: 1, rowId: 'b' }]);
    expect(hot.getSourceDataAtRow(1)).toEqual({ id: 'b', sku: 'B', name: 'new B', price: 2 });

    destroy();
  });

  it('should start a request for a trimmed row by its physical index', async() => {
    const { hot, plugin, destroy } = createGrid({ trimRows: [2] });

    expect(await plugin.setAsyncValueAt({ physicalRow: 2, prop: 'name' }, Promise.resolve('new C')))
      .toEqual({ status: 'resolved', value: 'new C' });
    expect(hot.getSourceDataAtRow(2)).toEqual({ id: 'c', sku: 'C', name: 'new C', price: 3 });

    destroy();
  });

  it('should fill a column for every row, filtered ones included, with `\'all\'`', async() => {
    const { hot, plugin, destroy } = createGrid({ filters: true });
    const filters = hot.getPlugin('filters');

    filters.addCondition(0, 'eq', ['A']);
    filters.filter();

    const results = await plugin.setAsyncValuesForRows('all', 'name', async({ physicalRow }) => `new ${physicalRow}`);

    expect(results.map(result => result.status)).toEqual(['resolved', 'resolved', 'resolved', 'resolved']);
    expect(hot.getSourceDataAtCol(1)).toEqual(['new 0', 'new 1', 'new 2', 'new 3']);

    destroy();
  });

  it('should start nothing when one of the rows or the column does not exist', () => {
    const { plugin, destroy } = createGrid({ rowId: 'id' });
    const source = jest.fn(() => deferred().promise);

    expect(() => plugin.setAsyncValuesForRows([{ rowId: 'a' }, { rowId: 'zzz' }], 'name', source))
      .toThrow('cannot hold an async value');
    expect(() => plugin.setAsyncValuesForRows([{ physicalRow: 0 }, { physicalRow: 9 }], 'name', source))
      .toThrow('cannot hold an async value');
    expect(() => plugin.setAsyncValuesForRows('all', 'missing', source)).toThrow('cannot hold async values');
    expect(() => plugin.setAsyncValueAt({ physicalRow: 0, prop: 'missing' }, Promise.resolve(1)))
      .toThrow('cannot hold an async value');
    expect(source).not.toHaveBeenCalled();
    expect(plugin.countPending()).toBe(0);

    destroy();
  });

  it('should pass the row id to the hooks', async() => {
    const { hot, plugin, destroy } = createGrid({ rowId: 'id' });
    const start = jest.fn();
    const resolve = jest.fn();
    const cancel = jest.fn();

    hot.addHook('afterAsyncValueStart', start);
    hot.addHook('afterAsyncValueResolve', resolve);
    hot.addHook('afterAsyncValueCancel', cancel);

    await plugin.setAsyncValue(1, 1, Promise.resolve('new B'));
    plugin.setAsyncValue(2, 1, () => deferred().promise);
    plugin.cancel(2, 1);

    expect(start).toHaveBeenCalledWith(1, 'name', 'b');
    expect(resolve).toHaveBeenCalledWith(1, 'name', 'new B', 'b');
    expect(cancel).toHaveBeenCalledWith(2, 'name', 'manual', 'c');

    destroy();
  });

  describe('data replacement', () => {
    it('should move each request to the row that holds its id after `updateData()`', async() => {
      const { hot, plugin, destroy } = createGrid({ rowId: 'id' });
      const b = deferred();
      const d = deferred();
      const bResult = plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, () => b.promise);
      const dResult = plugin.setAsyncValueAt({ rowId: 'd', prop: 'name' }, () => d.promise);
      const [, rowB] = products();

      // Reordered, and without row "d".
      hot.updateData([rowB, products()[0], products()[2]]);

      expect(await dResult).toEqual({ status: 'canceled', reason: 'rowRemoved' });
      expect(plugin.getAsyncStateAt({ rowId: 'b', prop: 'name' })).toEqual({ status: 'pending' });
      expect(plugin.isPending(0, 1)).toBe(true);

      b.resolve('new B');

      expect(await bResult).toEqual({ status: 'resolved', value: 'new B' });
      expect(hot.getSourceDataAtRow(0)).toEqual({ id: 'b', sku: 'B', name: 'new B', price: 2 });

      destroy();
    });

    it('should keep the requests across `loadData()` for the ids the new data still holds', async() => {
      const { hot, plugin, destroy } = createGrid({ rowId: 'id' });
      const c = deferred();
      const cResult = plugin.setAsyncValueAt({ rowId: 'c', prop: 'name' }, () => c.promise);
      const aResult = plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, () => deferred().promise);

      hot.loadData([products()[2], products()[3]]);

      expect(await aResult).toEqual({ status: 'canceled', reason: 'rowRemoved' });

      c.resolve('new C');

      expect(await cResult).toEqual({ status: 'resolved', value: 'new C' });
      expect(hot.getSourceDataAtRow(0)).toEqual({ id: 'c', sku: 'C', name: 'new C', price: 3 });

      destroy();
    });

    it('should cancel every request on `loadData()` when the rows have no ids', async() => {
      const { hot, plugin, destroy } = createGrid();
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.loadData(products());

      expect(await result).toEqual({ status: 'canceled', reason: 'dataReplaced' });

      destroy();
    });

    it('should keep the requests by position across `updateData()` with generated ids', async() => {
      const { hot, plugin, destroy } = createGrid({ rowId: true });
      const request = deferred();
      const result = plugin.setAsyncValue(1, 1, () => request.promise);

      hot.updateData(products());
      request.resolve('new B');

      expect(await result).toEqual({ status: 'resolved', value: 'new B' });
      expect(hot.getDataAtCell(1, 1)).toBe('new B');

      destroy();
    });

    it('should keep a request that settled before an `updateData()` and lands after it', async() => {
      const { hot, plugin, destroy } = createGrid({ rowId: 'id' });
      const request = deferred();
      const result = plugin.setAsyncValueAt({ rowId: 'c', prop: 'name' }, () => request.promise);

      request.resolve('new C');
      // The settle callback runs and queues the write; the data is replaced before the write.
      await null;
      hot.updateData([products()[2], products()[0]]);
      await settle();

      expect(await result).toEqual({ status: 'resolved', value: 'new C' });
      expect(hot.getSourceDataAtRow(0)).toEqual({ id: 'c', sku: 'C', name: 'new C', price: 3 });

      destroy();
    });
  });

  describe('the `afterAsyncValueCancel` payload', () => {
    const rows = () => [...products(), { id: 'e', sku: 'E', name: 'old E', price: 5 }];

    /**
     * Builds a grid with a pending request on the `name` of every row, and a spy on the cancel hook.
     */
    function createPendingGrid(settings: Record<string, unknown> = {}) {
      const grid = createGrid({ data: rows(), rowId: 'id', ...settings });
      const cancel = jest.fn();

      grid.hot.addHook('afterAsyncValueCancel', cancel);
      grid.plugin.setAsyncValuesForRows('all', 'name', () => deferred().promise);

      return { ...grid, cancel };
    }

    it('should report the id of the removed row, not the one that took its place', () => {
      const { hot, cancel, destroy } = createPendingGrid();

      hot.alter('remove_row', 1, 1);

      expect(cancel.mock.calls).toEqual([[1, 'name', 'rowRemoved', 'b']]);

      destroy();
    });

    it('should report the id of the removed last row, not `null`', () => {
      const { hot, cancel, destroy } = createPendingGrid();

      hot.alter('remove_row', 4, 1);

      expect(cancel.mock.calls).toEqual([[4, 'name', 'rowRemoved', 'e']]);

      destroy();
    });

    it('should report the id of every row of a removal of several rows', () => {
      const { hot, cancel, destroy } = createPendingGrid();

      hot.alter('remove_row', 1, 2);

      expect(cancel.mock.calls).toHaveLength(2);
      expect(cancel.mock.calls).toEqual(expect.arrayContaining([
        [1, 'name', 'rowRemoved', 'b'],
        [2, 'name', 'rowRemoved', 'c'],
      ]));

      destroy();
    });

    it('should report the id of every row of a removal of non-contiguous rows', () => {
      const { hot, cancel, destroy } = createPendingGrid();

      hot.alter('remove_row', [[0, 1], [3, 2]]);

      // The groups are removed one after the other, so the physical row of a later group is its index just
      // before that group goes, after the earlier group shifted it; the ids are what identifies the row.
      expect(cancel.mock.calls.map(call => [call[0], call[2], call[3]]).sort()).toEqual([
        [0, 'rowRemoved', 'a'],
        [2, 'rowRemoved', 'd'],
        [3, 'rowRemoved', 'e'],
      ]);

      destroy();
    });

    it('should report the id of the removed row when the rows were sorted first', () => {
      const { hot, cancel, destroy } = createPendingGrid({ columnSorting: true });

      hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      // The first visual row is now "e", the fifth physical row.
      hot.alter('remove_row', 0, 1);

      expect(cancel.mock.calls).toEqual([[4, 'name', 'rowRemoved', 'e']]);

      destroy();
    });

    it('should report the ids of the rows an `updateData()` drops', () => {
      const { hot, cancel, destroy } = createPendingGrid();

      hot.updateData([rows()[4], rows()[0], rows()[2]]);

      expect(cancel.mock.calls).toHaveLength(2);
      expect(cancel.mock.calls).toEqual(expect.arrayContaining([
        [1, 'name', 'rowRemoved', 'b'],
        [3, 'name', 'rowRemoved', 'd'],
      ]));

      destroy();
    });

    it('should report the ids of the rows a `loadData()` drops', () => {
      const { hot, cancel, destroy } = createPendingGrid();

      hot.loadData([rows()[2], rows()[3]]);

      expect(cancel.mock.calls).toHaveLength(3);
      expect(cancel.mock.calls).toEqual(expect.arrayContaining([
        [0, 'name', 'rowRemoved', 'a'],
        [1, 'name', 'rowRemoved', 'b'],
        [4, 'name', 'rowRemoved', 'e'],
      ]));

      destroy();
    });

    it('should not report the id the new data holds when a `loadData()` cancels rows that had none', () => {
      const withoutIds = rows().map(({ id, ...row }) => row);
      const { hot, plugin, destroy } = createGrid({ data: withoutIds, rowId: 'id' });
      const cancel = jest.fn();

      hot.addHook('afterAsyncValueCancel', cancel);
      plugin.setAsyncValue(1, 1, () => deferred().promise);
      hot.loadData(rows());

      expect(cancel.mock.calls).toEqual([[1, 'name', 'dataReplaced', null]]);

      destroy();
    });

    it('should report the id a row held when `loadData()` dropped it after the id was edited', () => {
      const { hot, cancel, destroy } = createPendingGrid({ rowId: (row: { sku: string }) => row.sku });

      hot.setSourceDataAtCell(1, 'sku', 'B2');
      hot.loadData([rows()[0], rows()[2], rows()[3], rows()[4]]);

      expect(cancel.mock.calls).toEqual([[1, 'name', 'rowRemoved', 'B2']]);

      destroy();
    });

    it('should report the id of a row spliced out of the middle of the data', async() => {
      const data = rows();
      const { hot, plugin, destroy } = createGrid({ data, rowId: 'id' });
      const cancel = jest.fn();

      hot.addHook('afterAsyncValueCancel', cancel);
      plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, () => deferred().promise);
      data.splice(1, 1);
      hot.batch(() => hot.rowIndexMapper.removeIndexes([4]));
      await settle();

      expect(cancel.mock.calls.map(call => [call[2], call[3]])).toEqual([['rowRemoved', 'b']]);

      destroy();
    });

    it('should keep reading the live id for a state that is not dropped (a `columnsChanged` cancel)', () => {
      const { hot, plugin, destroy } = createGrid({
        data: [['a', 1], ['b', 2], ['c', 3]],
        columns: undefined,
        rowId: (row: unknown[]) => row[0],
      });
      const cancel = jest.fn();

      hot.addHook('afterAsyncValueCancel', cancel);
      plugin.setAsyncValue(1, 1, () => deferred().promise);
      hot.alter('insert_col_start', 1);

      expect(cancel.mock.calls).toEqual([[1, 1, 'columnsChanged', 'b']]);

      destroy();
    });
  });
});
