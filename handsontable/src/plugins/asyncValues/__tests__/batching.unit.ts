import { registerAllModules } from 'handsontable/registry';
import { createGrid, deferred, settle } from './helpers/grid';
import type { AsyncValueContext } from '../types';

registerAllModules();

describe('AsyncValues: batches, concurrency, and flushing', () => {
  describe('batch sources', () => {
    it('should call the source once per batch and settle each cell on its own', async() => {
      const { hot, plugin, destroy } = createGrid();
      const calls: number[][] = [];

      const results = await plugin.setAsyncValuesInBatches('all', 'name', async(cells: AsyncValueContext[]) => {
        calls.push(cells.map(cell => cell.physicalRow));

        return cells.map(cell => (cell.physicalRow === 1 ? new Error('Model refused') : `new ${cell.physicalRow}`));
      }, { batchSize: 3 });

      expect(calls).toEqual([[0, 1, 2], [3]]);
      expect(results.map(result => result.status)).toEqual(['resolved', 'rejected', 'resolved', 'resolved']);
      expect(results[1]).toEqual(expect.objectContaining({ message: 'Model refused' }));
      expect(hot.getSourceDataAtCol(1)).toEqual(['new 0', 'old B', 'new 2', 'new 3']);
      expect(plugin.getAsyncState(1, 1)).toEqual(expect.objectContaining({ status: 'error' }));

      destroy();
    });

    it('should reject the cells a short answer leaves out, and every cell of a rejected batch', async() => {
      const { plugin, destroy } = createGrid();
      const short = await plugin.setAsyncValuesInBatches(
        [{ physicalRow: 0 }, { physicalRow: 1 }], 'name', async() => ['only one'],
      );
      const failed = await plugin.setAsyncValuesInBatches(
        [{ physicalRow: 2 }, { physicalRow: 3 }], 'name', () => Promise.reject(new Error('Rate limited')),
      );

      expect(short).toEqual([
        { status: 'resolved', value: 'only one' },
        { status: 'rejected', error: undefined, message: '' },
      ]);
      expect(failed.map(result => result.status)).toEqual(['rejected', 'rejected']);
      expect(failed[0]).toEqual(expect.objectContaining({ message: 'Rate limited' }));

      destroy();
    });

    it('should keep the batch signal alive until every cell of the batch is cancelled', async() => {
      const { plugin, destroy } = createGrid();
      const request = deferred<unknown[]>();
      let batchSignal: AbortSignal | undefined;
      const cellSignals: AbortSignal[] = [];
      const rows = [{ physicalRow: 0 }, { physicalRow: 1 }];
      const results = plugin.setAsyncValuesInBatches(rows, 'name', (cells, signal) => {
        batchSignal = signal;
        cells.forEach(cell => cellSignals.push(cell.signal));

        return request.promise;
      });

      plugin.cancel(0, 1);

      expect(cellSignals[0].aborted).toBe(true);
      expect(batchSignal!.aborted).toBe(false);

      request.resolve(['late 0', 'new 1']);

      const [first, second] = await results;

      expect(first).toEqual({ status: 'cancelled', reason: 'manual' });
      expect(second).toEqual({ status: 'resolved', value: 'new 1' });

      const other = deferred<unknown[]>();
      let otherSignal: AbortSignal | undefined;

      plugin.setAsyncValuesInBatches([{ physicalRow: 2 }, { physicalRow: 3 }], 'name', (cells, signal) => {
        otherSignal = signal;

        return other.promise;
      });
      plugin.cancelAll();

      expect(otherSignal!.aborted).toBe(true);

      destroy();
    });

    it('should retry a failed batch cell in a batch of the cells that failed', async() => {
      const { hot, plugin, destroy } = createGrid();
      const calls: number[][] = [];
      let attempt = 0;

      await plugin.setAsyncValuesInBatches('all', 'name', async(cells) => {
        attempt += 1;
        calls.push(cells.map(cell => cell.physicalRow));

        return cells.map(cell => (
          attempt === 1 && cell.physicalRow % 2 === 0 ? new Error('Busy') : `ok ${cell.physicalRow}`
        ));
      });

      expect(plugin.countErrors()).toBe(2);

      const retried = await plugin.retryErrors();

      expect(calls).toEqual([[0, 1, 2, 3], [0, 2]]);
      expect(retried.map(result => result.status)).toEqual(['resolved', 'resolved']);
      expect(hot.getSourceDataAtCol(1)).toEqual(['ok 0', 'ok 1', 'ok 2', 'ok 3']);
      expect(plugin.countErrors()).toBe(0);

      destroy();
    });
  });

  describe('concurrency', () => {
    it('should run at most `concurrency` sources at once and keep the queued cells pending', async() => {
      const { plugin, destroy } = createGrid({ asyncValues: { concurrency: 2 } });
      const requests = [deferred(), deferred(), deferred(), deferred()];
      const source = jest.fn(({ physicalRow }: AsyncValueContext) => requests[physicalRow].promise);
      const results = plugin.setAsyncValuesForRows('all', 'name', source);

      expect(source).toHaveBeenCalledTimes(2);
      expect(plugin.countPending()).toBe(4);
      expect(plugin.isPending(3, 1)).toBe(true);

      requests[0].resolve('new 0');
      await settle();

      expect(source).toHaveBeenCalledTimes(3);

      plugin.cancel(3, 1);
      requests[1].resolve('new 1');
      requests[2].resolve('new 2');

      expect((await results).map(result => result.status)).toEqual(['resolved', 'resolved', 'resolved', 'cancelled']);
      expect(source).toHaveBeenCalledTimes(3);

      destroy();
    });

    it('should give a slot back at once when its cell is cancelled, even if the source never settles', async() => {
      const { plugin, destroy } = createGrid({ asyncValues: { concurrency: 1 } });
      const source = jest.fn(() => deferred().promise);

      plugin.setAsyncValue(0, 1, source);
      plugin.setAsyncValue(1, 1, source);

      expect(source).toHaveBeenCalledTimes(1);

      plugin.cancel(0, 1);

      expect(source).toHaveBeenCalledTimes(2);

      destroy();
    });

    it('should start the queued sources that fit when `updateSettings()` raises the limit', () => {
      const { hot, plugin, destroy } = createGrid({ asyncValues: { concurrency: 1 } });
      const source = jest.fn(() => deferred().promise);

      plugin.setAsyncValuesForRows('all', 'name', source);
      hot.updateSettings({ asyncValues: { concurrency: 3 } });

      expect(source).toHaveBeenCalledTimes(3);
      expect(plugin.countPending()).toBe(4);

      destroy();
    });
  });

  describe('flushing', () => {
    it('should write the results that settle within the flush window in one change', async() => {
      const { hot, plugin, destroy } = createGrid({ asyncValues: { flush: 20 } });
      const changes = jest.fn();
      const requests = [deferred(), deferred(), deferred(), deferred()];

      hot.addHook('afterChange', changes);

      const results = plugin.setAsyncValuesForRows('all', 'name', ({ physicalRow }) => requests[physicalRow].promise);

      // Settled in separate tasks, as separate network responses are.
      for (const [index, request] of requests.entries()) {
        request.resolve(`new ${index}`);
        await settle();
      }

      await results;

      expect(changes).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCol(1)).toEqual(['new 0', 'new 1', 'new 2', 'new 3']);

      destroy();
    });

    it('should write once per animation frame with `flush: \'frame\'`', async() => {
      const { hot, plugin, destroy } = createGrid({ asyncValues: { flush: 'frame' } });
      const changes = jest.fn();
      const frames: FrameRequestCallback[] = [];
      const requestFrame = jest.spyOn(hot.rootWindow, 'requestAnimationFrame')
        .mockImplementation((callback) => {
          frames.push(callback);

          return frames.length;
        });

      hot.addHook('afterChange', changes);

      const results = plugin.setAsyncValuesForRows('all', 'name', async({ physicalRow }) => `new ${physicalRow}`);

      await settle();

      expect(changes).not.toHaveBeenCalled();

      frames.splice(0).forEach(callback => callback(0));
      await results;

      expect(changes).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCol(1)).toEqual(['new 0', 'new 1', 'new 2', 'new 3']);

      requestFrame.mockRestore();
      destroy();
    });
  });
});
