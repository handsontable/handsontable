import { registerAllModules } from 'handsontable/registry';
import { createGrid, deferred, settle } from './helpers/grid';
import { ASYNC_VALUE_CANCEL_REASONS } from '../types';

registerAllModules();

/**
 * Builds `count` rows of products.
 */
function manyProducts(count: number) {
  return Array.from({ length: count }, (_, index) => ({ id: `p${index}`, sku: `S${index}`, name: null, price: index }));
}

describe('AsyncValues: progress, retry, and request options', () => {
  describe('progress', () => {
    it('should report the pending and failed cells through a 500-row run, and fire the idle hook once', async() => {
      const { hot, plugin, destroy } = createGrid({ data: manyProducts(500), rowId: 'id' });
      const idle = jest.fn();
      const requests = Array.from({ length: 500 }, () => deferred());

      hot.addHook('afterAsyncValuesIdle', idle);

      const results = plugin.setAsyncValuesForRows('all', 'name', ({ physicalRow }) => requests[physicalRow].promise);

      expect(plugin.countPending()).toBe(500);
      expect(plugin.getPendingCells()[499]).toEqual({ physicalRow: 499, prop: 'name', rowId: 'p499' });

      requests.slice(0, 37).forEach((request, index) => request.resolve(`name ${index}`));
      await settle();

      expect(plugin.countPending()).toBe(463);

      requests.slice(37).forEach((request, index) => (index % 100 === 0
        ? request.reject(new Error('Timeout'))
        : request.resolve('ok')));
      await results;

      expect(plugin.countPending()).toBe(0);
      expect(plugin.countErrors()).toBe(5);
      expect(plugin.getErrorCells().map(cell => cell.rowId)).toEqual(['p37', 'p137', 'p237', 'p337', 'p437']);
      expect(idle).toHaveBeenCalledTimes(1);

      destroy();
    });

    it('should fire the idle hook when the last request is cancelled', () => {
      const { hot, plugin, destroy } = createGrid();
      const idle = jest.fn();

      hot.addHook('afterAsyncValuesIdle', idle);
      plugin.setAsyncValues(0, 1, 1, 1, () => deferred().promise);
      plugin.cancel(0, 1);

      expect(idle).not.toHaveBeenCalled();

      plugin.cancelAll();

      expect(idle).toHaveBeenCalledTimes(1);

      destroy();
    });
  });

  describe('retry', () => {
    it('should run a failed cell\'s source again with its options', async() => {
      const { hot, plugin, destroy } = createGrid();
      let attempt = 0;
      const source = jest.fn(async() => {
        attempt += 1;

        if (attempt === 1) {
          throw new Error('Busy');
        }

        return 'second try';
      });

      await plugin.setAsyncValue(0, 1, source, { source: 'AI.fill' });

      const changes = jest.fn();

      hot.addHook('afterChange', changes);

      expect(await plugin.retry(0, 1)).toEqual({ status: 'resolved', value: 'second try' });
      expect(changes).toHaveBeenCalledWith([[0, 'name', 'old A', 'second try']], 'AI.fill');
      expect(plugin.retry(0, 1)).toBeNull();

      destroy();
    });

    it('should cancel and retry a cell by its row id', async() => {
      const { plugin, destroy } = createGrid({ rowId: 'id' });
      let attempt = 0;

      plugin.setAsyncValueAt({ rowId: 'c', prop: 'name' }, () => deferred().promise);
      plugin.cancelAt({ rowId: 'c', prop: 'name' });

      expect(plugin.countPending()).toBe(0);

      await plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, async() => {
        attempt += 1;

        if (attempt === 1) {
          throw new Error('Timeout');
        }

        return 'new B';
      });

      expect(plugin.getAsyncStateAt({ rowId: 'b', prop: 'name' }))
        .toEqual({ status: 'error', error: expect.any(Error), message: 'Timeout' });
      expect(await plugin.retryAt({ rowId: 'b', prop: 'name' })).toEqual({ status: 'resolved', value: 'new B' });

      destroy();
    });

    it('should not retry a cell whose source was not kept', async() => {
      const { plugin, destroy } = createGrid();

      await plugin.setAsyncValue(0, 1, () => Promise.reject(new Error('Busy')), { keepSource: false });
      await plugin.setAsyncValue(1, 1, Promise.reject(new Error('Busy')));

      expect(plugin.retry(0, 1)).toBeNull();
      expect(plugin.retry(1, 1)).toBeNull();
      expect(await plugin.retryErrors()).toEqual([]);

      destroy();
    });
  });

  describe('request options', () => {
    it('should write with the request\'s own source and merge its meta into the cell', async() => {
      const { hot, plugin, destroy } = createGrid();
      const before = jest.fn();
      const after = jest.fn();

      hot.addHook('beforeChange', before);
      hot.addHook('afterChange', after);

      await plugin.setAsyncValue(0, 1, Promise.resolve('Desk lamp'), {
        source: 'AI.fill', meta: { aiGenerated: true },
      });

      expect(before).toHaveBeenCalledWith([[0, 'name', 'old A', 'Desk lamp']], 'AI.fill');
      expect(after).toHaveBeenCalledWith([[0, 'name', 'old A', 'Desk lamp']], 'AI.fill');
      expect(hot.getCellMeta(0, 1).aiGenerated).toBe(true);
      expect(hot.getCellMeta(1, 1).aiGenerated).toBeUndefined();

      destroy();
    });

    it('should not apply `meta` to a filtered-out row, nor to a value the grid rejected', async() => {
      const { hot, plugin, destroy } = createGrid({
        trimRows: [3],
        beforeChange(changes: Array<[number, string, unknown, unknown] | null>) {
          // Rejects the write of row 1.
          changes.forEach((change, index) => {
            if (change?.[0] === 1) {
              changes[index] = null;
            }
          });
        },
      });
      const meta = { className: 'fromAsync' };

      await plugin.setAsyncValueAt({ physicalRow: 3, prop: 'name' }, async() => 'new D', { meta });
      await plugin.setAsyncValues(0, 1, 1, 1, async() => 'new', { meta });

      expect(hot.getCellMeta(0, 1).className).toBe('fromAsync');
      expect(hot.getCellMeta(1, 1).className).toBeUndefined();

      hot.getPlugin('trimRows').untrimAll();

      expect(hot.getDataAtCell(3, 1)).toBe('new D');
      expect(hot.getCellMeta(3, 1).className).toBeUndefined();

      destroy();
    });

    it('should list every cancel reason in `ASYNC_VALUE_CANCEL_REASONS`', () => {
      expect(ASYNC_VALUE_CANCEL_REASONS).toEqual([
        'edit', 'dependency', 'restart', 'rowRemoved', 'columnsChanged', 'dataReplaced', 'manual', 'disabled', 'vetoed',
      ]);
    });
  });

  describe('before-hooks', () => {
    it('should skip a request a `beforeAsyncValueStart` listener vetoes, without calling its source', async() => {
      const { hot, plugin, destroy } = createGrid({ rowId: 'id' });
      const source = jest.fn(async() => 'value');
      const start = jest.fn();

      hot.addHook('beforeAsyncValueStart', (physicalRow, prop, rowId) => rowId !== 'b');
      hot.addHook('afterAsyncValueStart', start);

      const results = await plugin.setAsyncValues(0, 1, 2, 1, source);

      expect(results.map(result => result.status)).toEqual(['resolved', 'cancelled', 'resolved']);
      expect(results[1]).toEqual({ status: 'cancelled', reason: 'vetoed' });
      expect(source).toHaveBeenCalledTimes(2);
      expect(start).toHaveBeenCalledTimes(2);

      destroy();
    });

    it('should discard or replace a value from `beforeAsyncValueResolve`', async() => {
      const { hot, plugin, destroy } = createGrid();
      const cancel = jest.fn();

      hot.addHook('afterAsyncValueCancel', cancel);
      hot.addHook('beforeAsyncValueResolve', (value) => {
        if (value === 'spam') {
          return false;
        }

        return typeof value === 'string' ? value.toUpperCase() : undefined;
      });

      const [kept, discarded, written] = await plugin.setAsyncValues(0, 1, 2, 1, async({ row }) => (
        [false, 'spam', 'lamp'][row!]
      ));

      expect(kept).toEqual({ status: 'resolved', value: false });
      expect(discarded).toEqual({ status: 'cancelled', reason: 'vetoed' });
      expect(written).toEqual({ status: 'resolved', value: 'LAMP' });
      expect(hot.getDataAtCol(1)).toEqual([false, 'old B', 'LAMP', 'old D']);
      expect(cancel).toHaveBeenCalledWith(1, 'name', 'vetoed', null);

      destroy();
    });
  });

  describe('copying', () => {
    it('should copy a pending cell as an empty value with `copyPendingAs: \'empty\'`', () => {
      const { hot, plugin, destroy } = createGrid({ asyncValues: { copyPendingAs: 'empty' } });

      plugin.setAsyncValue(1, 1, () => deferred().promise);

      const data = [['A', 'old A'], ['B', 'old B']];

      hot.runHooks('beforeCopy', data, [{ startRow: 0, startCol: 0, endRow: 1, endCol: 1 }], { columnHeadersCount: 0 });

      expect(data).toEqual([['A', 'old A'], ['B', '']]);

      destroy();
    });

    it('should copy a pending cell\'s current value by default', () => {
      const { hot, plugin, destroy } = createGrid();

      plugin.setAsyncValue(1, 1, () => deferred().promise);

      const data = [['B', 'old B']];

      hot.runHooks('beforeCopy', data, [{ startRow: 1, startCol: 0, endRow: 1, endCol: 1 }], { columnHeadersCount: 0 });

      expect(data).toEqual([['B', 'old B']]);

      destroy();
    });
  });

  describe('undo', () => {
    it('should record a `undo: \'record\'` call as one undo step once its last request settles', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const requests = [deferred(), deferred(), deferred()];
      const results = plugin.setAsyncValues(0, 1, 2, 1, ({ row }) => requests[row!].promise, { undo: 'record' });

      requests[0].resolve('new A');
      requests[1].resolve('new B');
      await settle();

      // The call is still running: nothing is recorded yet, and the values are already shown.
      expect(undoRedo.isUndoAvailable()).toBe(false);
      expect(hot.getDataAtCol(1)).toEqual(['new A', 'new B', 'old C', 'old D']);

      requests[2].reject(new Error('Timeout'));
      await results;
      await settle();

      expect(undoRedo.isUndoAvailable()).toBe(true);

      undoRedo.undo();

      expect(hot.getDataAtCol(1)).toEqual(['old A', 'old B', 'old C', 'old D']);
      expect(undoRedo.isUndoAvailable()).toBe(false);

      undoRedo.redo();

      expect(hot.getDataAtCol(1)).toEqual(['new A', 'new B', 'old C', 'old D']);

      destroy();
    });

    it('should keep a user\'s edit made during the call out of the call\'s step', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const late = deferred();
      const source = ({ row }: { row: number | null }) => (row === 0 ? Promise.resolve('new A') : late.promise);
      const results = plugin.setAsyncValues(0, 1, 1, 1, source, { undo: 'record' });

      await settle();
      hot.setDataAtCell(0, 1, 'typed');

      expect(undoRedo.isUndoAvailable()).toBe(true);

      late.resolve('new B');
      await results;
      await settle();

      undoRedo.undo();

      // The call's step held only row 1: the user's later edit of row 0 won.
      expect(hot.getDataAtCol(1)).toEqual(['typed', 'old B', 'old C', 'old D']);

      undoRedo.undo();

      expect(hot.getDataAtCol(1)).toEqual(['new A', 'old B', 'old C', 'old D']);

      destroy();
    });

    it('should not cancel a request that depends on the cells a recorded step writes', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });
      const price = deferred();

      // The name lands first, and its step is written a task later, writing the name again.
      await plugin.setAsyncValue(1, 1, Promise.resolve('new B'), { undo: 'record' });

      const priceResult = plugin.setAsyncValue(1, 2, () => price.promise, { dependsOn: ['name'] });

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);

      await settle();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(true);
      expect(plugin.isPending(1, 2)).toBe(true);

      price.resolve(10);

      expect(await priceResult).toEqual({ status: 'resolved', value: 10 });

      destroy();
    });

    it('should record the value the grid stored, after a `valueSetter` changed it', async() => {
      const { hot, plugin, destroy } = createGrid({
        undo: true,
        columns: [
          { data: 'sku' },
          { data: 'name', valueSetter: (value: unknown) => String(value).toUpperCase() },
          { data: 'price' },
        ],
      });
      const undoRedo = hot.getPlugin('undoRedo');

      await plugin.setAsyncValues(0, 1, 1, 1, async({ row }) => `new ${row}`, { undo: 'record' });
      await settle();

      expect(hot.getDataAtCol(1)).toEqual(['NEW 0', 'NEW 1', 'old C', 'old D']);

      undoRedo.undo();

      expect(hot.getDataAtCol(1)).toEqual(['old A', 'old B', 'old C', 'old D']);

      undoRedo.redo();

      expect(hot.getDataAtCol(1)).toEqual(['NEW 0', 'NEW 1', 'old C', 'old D']);

      destroy();
    });

    it('should keep a call\'s written values with their rows through a row insert', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const requests = [deferred(), deferred()];
      const results = plugin.setAsyncValues(0, 1, 1, 1, ({ row }) => requests[row!].promise, { undo: 'record' });

      requests[0].resolve('new A');
      await settle();
      hot.alter('insert_row_above', 0);
      requests[1].resolve('new B');
      await results;
      await settle();

      expect(hot.getDataAtCol(1)).toEqual([null, 'new A', 'new B', 'old C', 'old D']);

      undoRedo.undo();

      expect(hot.getDataAtCol(1)).toEqual([null, 'old A', 'old B', 'old C', 'old D']);

      destroy();
    });

    it('should keep a call\'s written values through `updateSettings()` with `columns`', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });
      const undoRedo = hot.getPlugin('undoRedo');
      const requests = [deferred(), deferred()];
      const results = plugin.setAsyncValues(0, 1, 1, 1, ({ row }) => requests[row!].promise, { undo: 'record' });

      requests[0].resolve('new A');
      await settle();
      hot.updateSettings({ columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price' }] });
      requests[1].resolve('new B');
      await results;
      await settle();

      undoRedo.undo();

      expect(hot.getDataAtCol(1)).toEqual(['old A', 'old B', 'old C', 'old D']);

      destroy();
    });

    it('should keep a call\'s written values on their records through an `updateData()` that reorders them', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true, rowId: 'id' });
      const undoRedo = hot.getPlugin('undoRedo');
      const requests = { a: deferred(), b: deferred() };
      const results = plugin.setAsyncValuesForRows(
        [{ rowId: 'a' }, { rowId: 'b' }],
        'name',
        ({ rowId }) => requests[rowId as 'a' | 'b'].promise,
        { undo: 'record' },
      );

      requests.a.resolve('new A');
      await settle();
      hot.updateData((hot.getSourceData() as Array<Record<string, unknown>>).slice().reverse());
      requests.b.resolve('new B');
      await results;
      await settle();

      expect(hot.getDataAtCol(1)).toEqual(['old D', 'old C', 'new B', 'new A']);

      undoRedo.undo();

      expect(hot.getDataAtCol(1)).toEqual(['old D', 'old C', 'old B', 'old A']);

      destroy();
    });

    it('should record nothing with the default `undo: \'skip\'`', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });

      await plugin.setAsyncValues(0, 1, 1, 1, async() => 'value');
      await settle();

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);

      destroy();
    });
  });
});
