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
});
