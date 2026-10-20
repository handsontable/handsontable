import Handsontable from 'handsontable/base';
import { HyperFormula } from 'hyperformula';
import { registerAllModules } from 'handsontable/registry';
import * as announcer from '../../../utils/a11yAnnouncer';
import type { AsyncValueContext } from '../types';

registerAllModules();

/**
 * A promise with its settle functions exposed.
 */
function deferred<T = unknown>() {
  let resolve: (value: T) => void = () => {};
  let reject: (reason: unknown) => void = () => {};
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

/**
 * Lets the plugin's flush (a microtask after the request settled) run.
 */
function settle() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

/**
 * Builds a grid of products whose `name` column is filled asynchronously.
 */
function createGrid(settings: Record<string, unknown> = {}) {
  const container = document.createElement('div');

  document.body.appendChild(container);

  const hot = new Handsontable(container, {
    data: [
      { sku: 'A', name: 'old A', price: 1 },
      { sku: 'B', name: 'old B', price: 2 },
      { sku: 'C', name: 'old C', price: 3 },
      { sku: 'D', name: 'old D', price: 4 },
    ],
    columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price' }],
    asyncValues: true,
    licenseKey: 'non-commercial-and-evaluation',
    ...settings,
  });

  return {
    hot,
    plugin: hot.getPlugin('asyncValues'),
    destroy() {
      hot.destroy();
      container.remove();
    },
  };
}

describe('AsyncValues', () => {
  describe('enabling', () => {
    it.each([false, null, undefined])('should stay disabled when the option is `%s`', (value) => {
      const { plugin, destroy } = createGrid({ asyncValues: value });

      expect(plugin.isEnabled()).toBe(false);
      expect(() => plugin.setAsyncValue(0, 1, Promise.resolve('x'))).toThrow('The AsyncValues plugin is not enabled.');

      destroy();
    });

    it('should be enabled with `true`', () => {
      const { plugin, destroy } = createGrid();

      expect(plugin.isEnabled()).toBe(true);

      destroy();
    });

    it('should cancel every request and clear the decoration when disabled with `updateSettings()`', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);

      hot.updateSettings({ asyncValues: false });

      expect(await result).toEqual({ status: 'canceled', reason: 'disabled' });
      expect(hot.getCell(0, 1)!.classList.contains('htAsyncPending')).toBe(false);
      expect(hot.getCell(0, 1)!.querySelector('.htAsyncIndicator')).toBeNull();

      request.resolve('late');
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('old A');

      destroy();
    });
  });

  describe('pending state', () => {
    it('should mark the cell pending in its meta, its classes, and its ARIA attributes', () => {
      const { hot, plugin, destroy } = createGrid();
      const start = jest.fn();

      hot.addHook('afterAsyncValueStart', start);
      plugin.setAsyncValue(1, 1, () => deferred().promise);

      const TD = hot.getCell(1, 1)!;

      expect(plugin.isPending(1, 1)).toBe(true);
      expect(plugin.getAsyncState(1, 1)).toEqual({ status: 'pending' });
      expect(hot.getCellMeta(1, 1).asyncState).toBe('pending');
      expect(TD.classList.contains('htAsyncPending')).toBe(true);
      expect(TD.querySelector('.htAsyncIndicator')).not.toBeNull();
      expect(TD.getAttribute('aria-busy')).toBe('true');
      expect(hot.getDataAtCell(1, 1)).toBe('old B');
      expect(start).toHaveBeenCalledWith(1, 'name', null);
      expect(plugin.isPending(0, 1)).toBe(false);
      expect(plugin.getAsyncState(0, 1)).toBeNull();

      destroy();
    });

    it('should repaint the pending state under `renderMode: \'onChange\'`', () => {
      const { hot, plugin, destroy } = createGrid({ renderMode: 'onChange' });

      plugin.setAsyncValue(1, 1, () => deferred().promise);

      expect(hot.getCell(1, 1)!.classList.contains('htAsyncPending')).toBe(true);

      plugin.cancel(1, 1);

      expect(hot.getCell(1, 1)!.classList.contains('htAsyncPending')).toBe(false);

      destroy();
    });

    it('should pass the signal and the cell coordinates to the source', () => {
      const { plugin, destroy } = createGrid();
      const source = jest.fn((context: AsyncValueContext) => {
        expect(context.signal.aborted).toBe(false);

        return deferred().promise;
      });

      plugin.setAsyncValue(2, 1, source);

      expect(source).toHaveBeenCalledWith(expect.objectContaining({
        row: 2, column: 1, physicalRow: 2, prop: 'name',
      }));

      destroy();
    });
  });

  describe('resolving', () => {
    it('should write the resolved value and clear the pending state', async() => {
      const { hot, plugin, destroy } = createGrid();
      const resolved = jest.fn();
      const changes = jest.fn();

      hot.addHook('afterAsyncValueResolve', resolved);
      hot.addHook('afterChange', changes);

      expect(await plugin.setAsyncValue(0, 1, Promise.resolve('new A')))
        .toEqual({ status: 'resolved', value: 'new A' });
      expect(hot.getDataAtCell(0, 1)).toBe('new A');
      expect(plugin.getAsyncState(0, 1)).toBeNull();
      expect(hot.getCellMeta(0, 1).asyncState).toBeNull();
      expect(hot.getCell(0, 1)!.classList.contains('htAsyncPending')).toBe(false);
      expect(hot.getCell(0, 1)!.hasAttribute('aria-busy')).toBe(false);
      expect(resolved).toHaveBeenCalledWith(0, 'name', 'new A', null);
      expect(changes).toHaveBeenCalledWith([[0, 'name', 'old A', 'new A']], 'AsyncValues.resolve');

      destroy();
    });

    it('should write the values of a range in one change', async() => {
      const { hot, plugin, destroy } = createGrid();
      const changes = jest.fn();

      hot.addHook('afterChange', changes);

      const results = await plugin.setAsyncValues(0, 1, 2, 1, async({ row }) => `new ${row}`);

      expect(results.map(result => result.status)).toEqual(['resolved', 'resolved', 'resolved']);
      expect(hot.getDataAtCol(1)).toEqual(['new 0', 'new 1', 'new 2', 'old D']);
      expect(changes).toHaveBeenCalledTimes(1);

      destroy();
    });

    it('should accept the corners of a range in any order', async() => {
      const { hot, plugin, destroy } = createGrid();

      await plugin.setAsyncValues(1, 1, 0, 1, async({ row }) => `new ${row}`);

      expect(hot.getDataAtCol(1)).toEqual(['new 0', 'new 1', 'old C', 'old D']);

      destroy();
    });

    it('should start nothing when a range reaches outside the grid', () => {
      const { plugin, destroy } = createGrid();
      const source = jest.fn(() => deferred().promise);

      expect(() => plugin.setAsyncValues(2, 1, 4, 1, source)).toThrow('cannot hold async values');
      expect(() => plugin.setAsyncValues(0, 1, -1, 1, source)).toThrow('cannot hold async values');
      expect(source).not.toHaveBeenCalled();
      expect(plugin.isPending(2, 1)).toBe(false);

      destroy();
    });

    it('should start nothing when a column of the range has a `data` function', () => {
      const { plugin, destroy } = createGrid({
        columns: [{ data: 'sku' }, { data: 'name' }, { data: (row: { price: number }) => row.price }],
      });
      const source = jest.fn(() => deferred().promise);

      expect(() => plugin.setAsyncValues(0, 1, 0, 2, source)).toThrow('cannot hold async values');
      expect(source).not.toHaveBeenCalled();
      expect(plugin.isPending(0, 1)).toBe(false);

      destroy();
    });

    it('should throw for coordinates outside the grid', () => {
      const { plugin, destroy } = createGrid();

      expect(() => plugin.setAsyncValue(4, 1, Promise.resolve(1))).toThrow('cannot hold an async value');
      expect(() => plugin.setAsyncValue(0, 3, Promise.resolve(1))).toThrow('cannot hold an async value');
      expect(() => plugin.setAsyncValue(-1, 0, Promise.resolve(1))).toThrow('cannot hold an async value');

      destroy();
    });

    it('should not add the resolved value to the undo history', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });

      await plugin.setAsyncValue(0, 1, Promise.resolve('new A'));

      expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);

      destroy();
    });

    it('should restore the recorded value over the async one when an earlier edit of the cell is undone', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });

      hot.setDataAtCell(0, 1, 'typed');
      await plugin.setAsyncValue(0, 1, Promise.resolve('async'));
      hot.getPlugin('undoRedo').undo();

      expect(hot.getDataAtCell(0, 1)).toBe('old A');

      destroy();
    });
  });

  describe('rejecting', () => {
    it('should keep the previous value and show the error state with the message', async() => {
      const { hot, plugin, destroy } = createGrid();
      const rejected = jest.fn();

      hot.addHook('afterAsyncValueReject', rejected);

      const error = new Error('Lookup failed');
      const result = await plugin.setAsyncValue(0, 1, Promise.reject(error));
      const TD = hot.getCell(0, 1)!;

      expect(result).toEqual({ status: 'rejected', error, message: 'Lookup failed' });
      expect(hot.getDataAtCell(0, 1)).toBe('old A');
      expect(plugin.getAsyncState(0, 1)).toEqual({ status: 'error', error, message: 'Lookup failed' });
      expect(hot.getCellMeta(0, 1).asyncState).toBe('error');
      expect(hot.getCellMeta(0, 1).asyncError).toBe('Lookup failed');
      expect(TD.classList.contains('htAsyncError')).toBe(true);
      expect(TD.getAttribute('title')).toBe('Lookup failed');
      expect(TD.getAttribute('aria-invalid')).toBe('true');
      expect(rejected).toHaveBeenCalledWith(0, 'name', error, 'Lookup failed', null);

      destroy();
    });

    it('should carry the error message in visually hidden text and paint it under `renderMode: \'onChange\'`', async() => {
      const { hot, plugin, destroy } = createGrid({ renderMode: 'onChange' });

      await plugin.setAsyncValue(0, 1, Promise.reject(new Error('Lookup failed')));

      const TD = hot.getCell(0, 1)!;

      expect(TD.classList.contains('htAsyncError')).toBe(true);
      expect(TD.querySelector('.htAsyncErrorMessage')!.textContent).toBe('Lookup failed');

      plugin.cancel(0, 1);

      expect(hot.getCell(0, 1)!.querySelector('.htAsyncErrorMessage')).toBeNull();
      expect(hot.getCell(0, 1)!.hasAttribute('title')).toBe(false);

      destroy();
    });

    it('should announce the error message when the request of the selected cell fails', async() => {
      const { hot, plugin, destroy } = createGrid();
      const announce = jest.spyOn(announcer, 'announce');

      hot.selectCell(0, 1);
      await plugin.setAsyncValue(1, 1, Promise.reject(new Error('Not selected')));
      await plugin.setAsyncValue(0, 1, Promise.reject(new Error('Lookup failed')));

      expect(announce.mock.calls).toEqual([['Lookup failed', 'polite']]);

      announce.mockRestore();
      destroy();
    });

    it('should take its elements off a cell whose renderer keeps the cell content', async() => {
      const { hot, plugin, destroy } = createGrid({
        columns: [
          { data: 'sku' },
          {
            data: 'name',
            renderer(instance: Handsontable, TD: HTMLTableCellElement, row: number) {
              if (!TD.hasAttribute('data-rendered')) {
                TD.setAttribute('data-rendered', '');
                TD.appendChild(document.createTextNode(`name ${row}`));
              }
            },
          },
          { data: 'price' },
        ],
      });

      await plugin.setAsyncValue(0, 1, Promise.reject(new Error('Lookup failed')));

      expect(hot.getCell(0, 1)!.querySelector('.htAsyncErrorMessage')).not.toBeNull();

      plugin.cancel(0, 1);
      plugin.setAsyncValue(0, 1, () => deferred().promise);
      plugin.cancel(0, 1);

      const TD = hot.getCell(0, 1)!;

      expect(TD.querySelector('.htAsyncErrorMessage')).toBeNull();
      expect(TD.querySelector('.htAsyncIndicator')).toBeNull();
      expect(TD.textContent).toBe('name 0');

      destroy();
    });

    it('should read the message of a rejection reason that is a plain object', async() => {
      const { plugin, destroy } = createGrid();
      // Rejected through the helper: a service can reject with something that is not an `Error`.
      const rejectedWith = (reason: unknown) => {
        const request = deferred();

        request.reject(reason);

        return request.promise;
      };

      expect(await plugin.setAsyncValue(0, 1, rejectedWith({ message: 'Rate limited' })))
        .toEqual(expect.objectContaining({ status: 'rejected', message: 'Rate limited' }));
      expect(await plugin.setAsyncValue(1, 1, rejectedWith({ code: 429 })))
        .toEqual(expect.objectContaining({ status: 'rejected', message: '' }));
      expect(await plugin.setAsyncValue(2, 1, rejectedWith('Timed out')))
        .toEqual(expect.objectContaining({ status: 'rejected', message: 'Timed out' }));

      destroy();
    });

    it('should treat a source that throws as a rejection', async() => {
      const { plugin, destroy } = createGrid();
      const result = await plugin.setAsyncValue(0, 1, () => {
        throw new Error('Bad input');
      });

      expect(result).toEqual(expect.objectContaining({ status: 'rejected', message: 'Bad input' }));

      destroy();
    });

    it('should clear the error state when the cell is edited', async() => {
      const { hot, plugin, destroy } = createGrid();

      await plugin.setAsyncValue(0, 1, Promise.reject(new Error('Lookup failed')));
      hot.setDataAtCell(0, 1, 'typed');

      const TD = hot.getCell(0, 1)!;

      expect(plugin.getAsyncState(0, 1)).toBeNull();
      expect(TD.classList.contains('htAsyncError')).toBe(false);
      expect(TD.hasAttribute('title')).toBe(false);

      destroy();
    });
  });

  describe('cancelling', () => {
    it('should cancel the request and ignore its late result when the cell is edited', async() => {
      const { hot, plugin, destroy } = createGrid();
      const canceled = jest.fn();
      const request = deferred();
      let signal: AbortSignal | undefined;

      hot.addHook('afterAsyncValueCancel', canceled);

      const result = plugin.setAsyncValue(0, 1, (context) => {
        signal = context.signal;

        return request.promise;
      });

      hot.setDataAtCell(0, 1, 'typed');

      expect(signal!.aborted).toBe(true);
      expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
      expect(canceled).toHaveBeenCalledWith(0, 'name', 'edit', null);

      request.resolve('late');
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('typed');

      destroy();
    });

    it('should cancel the request when a cell it depends on is edited', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise, { dependsOn: ['sku'] });

      hot.setDataAtCell(0, 2, 10);

      expect(plugin.isPending(0, 1)).toBe(true);

      hot.setDataAtCell(0, 0, 'Z');

      expect(await result).toEqual({ status: 'canceled', reason: 'dependency' });

      request.resolve('late');
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('old A');

      destroy();
    });

    it('should cancel the request when the cell is pasted over', async() => {
      const { hot, plugin, destroy } = createGrid();
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.populateFromArray(0, 1, [['pasted']], undefined, undefined, 'CopyPaste.paste');

      expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
      expect(hot.getDataAtCell(0, 1)).toBe('pasted');

      destroy();
    });

    it('should cancel the request when a source write or an undo changes the cell', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });

      hot.setDataAtCell(0, 1, 'typed');

      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.getPlugin('undoRedo').undo();

      expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
      expect(hot.getDataAtCell(0, 1)).toBe('old A');

      hot.getPlugin('undoRedo').redo();

      expect(plugin.isPending(0, 1)).toBe(false);
      expect(hot.getDataAtCell(0, 1)).toBe('typed');

      destroy();
    });

    it('should cancel the request when the source data of the cell is written', async() => {
      const { hot, plugin, destroy } = createGrid();
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.setSourceDataAtCell(0, 'name', 'from source');

      expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
      expect(hot.getDataAtCell(0, 1)).toBe('from source');

      destroy();
    });

    it('should cancel the previous request when a new one starts for the same cell', async() => {
      const { hot, plugin, destroy } = createGrid();
      const first = deferred();
      const firstResult = plugin.setAsyncValue(0, 1, () => first.promise);
      const secondResult = plugin.setAsyncValue(0, 1, Promise.resolve('second'));

      expect(await firstResult).toEqual({ status: 'canceled', reason: 'restart' });
      expect(await secondResult).toEqual({ status: 'resolved', value: 'second' });

      first.resolve('first');
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('second');

      destroy();
    });

    it('should drop the late result of a source that ignores the signal', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, request.promise);

      plugin.cancel(0, 1);
      request.resolve('late');
      await settle();

      expect(await result).toEqual({ status: 'canceled', reason: 'manual' });
      expect(hot.getDataAtCell(0, 1)).toBe('old A');

      destroy();
    });

    it('should cancel every request with `cancelAll()`', async() => {
      const { plugin, destroy } = createGrid();
      const results = plugin.setAsyncValues(0, 1, 3, 1, () => deferred().promise);

      plugin.cancelAll();

      expect((await results).every(result => result.status === 'canceled')).toBe(true);

      destroy();
    });

    it('should cancel the requests of a removed row and keep the others on their records', async() => {
      const { hot, plugin, destroy } = createGrid();
      const second = deferred();
      const third = deferred();
      let removedSignal: AbortSignal | undefined;
      const removedResult = plugin.setAsyncValue(1, 1, ({ signal }) => {
        removedSignal = signal;

        return second.promise;
      });
      const keptResult = plugin.setAsyncValue(2, 1, () => third.promise);

      hot.alter('remove_row', 1);

      expect(removedSignal!.aborted).toBe(true);
      expect(await removedResult).toEqual({ status: 'canceled', reason: 'rowRemoved' });
      expect(plugin.isPending(1, 1)).toBe(true);

      third.resolve('new C');
      await keptResult;

      expect(hot.getSourceDataAtRow(1)).toEqual({ sku: 'C', name: 'new C', price: 3 });

      destroy();
    });

    it('should not bring a canceled request back when the row removal is undone', async() => {
      const { hot, plugin, destroy } = createGrid({ undo: true });
      const result = plugin.setAsyncValue(1, 1, () => deferred().promise);

      const other = deferred();

      // A request elsewhere keeps the plugin's lookups live.
      const otherResult = plugin.setAsyncValue(3, 1, () => other.promise);

      hot.alter('remove_row', 1);
      hot.getPlugin('undoRedo').undo();

      expect(await result).toEqual({ status: 'canceled', reason: 'rowRemoved' });
      expect(hot.getDataAtRowProp(1, 'sku')).toBe('B');
      expect(plugin.isPending(1, 1)).toBe(false);
      expect(hot.getCell(1, 1)!.classList.contains('htAsyncPending')).toBe(false);

      other.resolve('new D');
      await otherResult;

      expect(hot.getSourceDataAtRow(3)).toEqual({ sku: 'D', name: 'new D', price: 4 });

      destroy();
    });

    it('should land the result on its record after a row is inserted above it', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(2, 1, () => request.promise);

      hot.alter('insert_row_above', 0);

      expect(plugin.isPending(3, 1)).toBe(true);

      request.resolve('new C');
      await result;

      expect(hot.getDataAtRowProp(3, 'name')).toBe('new C');
      expect(hot.getDataAtRowProp(3, 'sku')).toBe('C');

      destroy();
    });

    it('should keep the requests on their rows when the data is updated without row ids', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);
      const removed = plugin.setAsyncValue(3, 1, () => deferred().promise);

      hot.updateData([{ sku: 'X', name: 'x', price: 9 }, { sku: 'Y', name: 'y', price: 8 }]);

      expect(plugin.isPending(0, 1)).toBe(true);
      expect(await removed).toEqual({ status: 'canceled', reason: 'rowRemoved' });

      request.resolve('new X');

      expect(await result).toEqual({ status: 'resolved', value: 'new X' });
      expect(hot.getSourceDataAtRow(0)).toEqual({ sku: 'X', name: 'new X', price: 9 });

      destroy();
    });

    it('should clear the error state of a cell when a cell it depends on is edited', async() => {
      const { hot, plugin, destroy } = createGrid();
      const canceled = jest.fn();

      hot.addHook('afterAsyncValueCancel', canceled);
      await plugin.setAsyncValue(0, 1, Promise.reject(new Error('Unknown SKU')), { dependsOn: ['sku'] });
      hot.setDataAtCell(0, 0, 'Z');

      expect(plugin.getAsyncState(0, 1)).toBeNull();
      expect(hot.getCell(0, 1)!.classList.contains('htAsyncError')).toBe(false);
      expect(canceled).not.toHaveBeenCalled();

      destroy();
    });

    it('should cancel every request when the data is replaced', async() => {
      const { hot, plugin, destroy } = createGrid();
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.loadData([{ sku: 'X', name: 'x', price: 9 }]);

      expect(await result).toEqual({ status: 'canceled', reason: 'dataReplaced' });

      destroy();
    });

    it('should cancel the requests keyed by a column index when a column is inserted', async() => {
      const { hot, plugin, destroy } = createGrid({
        data: [['A', 'old A'], ['B', 'old B']],
        columns: undefined,
      });
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.alter('insert_col_start', 0);

      expect(await result).toEqual({ status: 'canceled', reason: 'columnsChanged' });

      destroy();
    });

    it('should keep the requests keyed by a column index before an inserted or removed column', async() => {
      const { hot, plugin, destroy } = createGrid({
        data: [['A', 'old A', 'x'], ['B', 'old B', 'y']],
        columns: undefined,
      });
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);

      hot.alter('insert_col_end', 2);
      hot.alter('remove_col', 3);

      expect(plugin.isPending(0, 1)).toBe(true);

      hot.alter('remove_col', 0);

      expect(await result).toEqual({ status: 'canceled', reason: 'columnsChanged' });

      destroy();
    });

    it('should keep the requests when `maxCols` stops a column insert', async() => {
      const { hot, plugin, destroy } = createGrid({
        data: [['A', 'old A'], ['B', 'old B']],
        columns: undefined,
        maxCols: 2,
      });

      plugin.setAsyncValue(0, 1, () => deferred().promise);
      hot.alter('insert_col_start', 0);

      expect(plugin.isPending(0, 1)).toBe(true);

      destroy();
    });
  });

  describe('re-entrancy', () => {
    it('should keep a pending request when `updateSettings()` sends the option again', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);

      hot.updateSettings({ asyncValues: true, colWidths: 120 });

      expect(plugin.isPending(0, 1)).toBe(true);

      request.resolve('new A');

      expect(await result).toEqual({ status: 'resolved', value: 'new A' });
      expect(hot.getDataAtCell(0, 1)).toBe('new A');

      destroy();
    });

    it('should cancel nothing when another listener vetoes the row removal', async() => {
      const { hot, plugin, destroy } = createGrid();
      const canceled = jest.fn();
      const request = deferred();
      const result = plugin.setAsyncValue(1, 1, () => request.promise);

      hot.addHook('afterAsyncValueCancel', canceled);

      const veto = () => false;

      hot.addHook('beforeRemoveRow', veto);
      hot.alter('remove_row', 1);
      hot.removeHook('beforeRemoveRow', veto);
      // A later removal of another row must not consume anything the vetoed one left behind.
      hot.alter('remove_row', 3);

      expect(plugin.isPending(1, 1)).toBe(true);

      request.resolve('new B');

      expect(await result).toEqual({ status: 'resolved', value: 'new B' });
      expect(canceled).not.toHaveBeenCalled();

      destroy();
    });

    it('should cancel the requests of the rows a nested removal takes and keep the rest on their records', async() => {
      const { hot, plugin, destroy } = createGrid();
      const kept = deferred();
      const outerResult = plugin.setAsyncValue(1, 1, () => deferred().promise);
      const innerResult = plugin.setAsyncValue(3, 1, () => deferred().promise);
      const keptResult = plugin.setAsyncValue(2, 1, () => kept.promise);
      let nested = false;

      hot.addHook('beforeRemoveRow', () => {
        if (!nested) {
          nested = true;
          hot.alter('remove_row', 3);
        }
      });
      hot.alter('remove_row', 1);

      expect(await outerResult).toEqual({ status: 'canceled', reason: 'rowRemoved' });
      expect(await innerResult).toEqual({ status: 'canceled', reason: 'rowRemoved' });

      kept.resolve('new C');
      await keptResult;

      expect(hot.getSourceData()).toEqual([
        { sku: 'A', name: 'old A', price: 1 },
        { sku: 'C', name: 'new C', price: 3 },
      ]);

      destroy();
    });

    it('should cancel the requests of a row removed inside `batch()` and keep the rest on their records', async() => {
      const { hot, plugin, destroy } = createGrid();
      const kept = deferred();
      const removedResult = plugin.setAsyncValue(1, 1, () => deferred().promise);
      const keptResult = plugin.setAsyncValue(2, 1, () => kept.promise);

      hot.batch(() => {
        hot.alter('remove_row', 1);
      });

      expect(await removedResult).toEqual({ status: 'canceled', reason: 'rowRemoved' });

      kept.resolve('new C');
      await keptResult;

      expect(hot.getSourceDataAtRow(1)).toEqual({ sku: 'C', name: 'new C', price: 3 });

      destroy();
    });

    it('should report a load that also adds spare rows as a data replacement', async() => {
      const { hot, plugin, destroy } = createGrid({ minSpareRows: 1 });
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);

      hot.loadData([{ sku: 'X', name: 'x', price: 9 }]);

      expect(await result).toEqual({ status: 'canceled', reason: 'dataReplaced' });

      destroy();
    });

    it('should drop a result whose cell is edited between the settle and the write', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);

      request.resolve('late');
      // The settle callback runs, and queues the write behind this continuation.
      await null;
      hot.setDataAtCell(0, 1, 'typed');
      await settle();

      expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
      expect(hot.getDataAtCell(0, 1)).toBe('typed');

      destroy();
    });

    it('should let a cancel listener restart the same cell without leaving an orphaned request', async() => {
      const { hot, plugin, destroy } = createGrid();
      const fromListener = deferred();
      let listenerResult: Promise<unknown> | undefined;
      let restarted = false;

      plugin.setAsyncValue(0, 1, () => deferred().promise);
      hot.addHook('afterAsyncValueCancel', (physicalRow, prop, reason) => {
        if (reason === 'restart' && !restarted) {
          restarted = true;
          listenerResult = plugin.setAsyncValue(0, 1, () => fromListener.promise);
        }
      });

      const outerResult = plugin.setAsyncValue(0, 1, () => deferred().promise);

      expect(await outerResult).toEqual({ status: 'canceled', reason: 'restart' });

      fromListener.resolve('from listener');

      expect(await listenerResult).toEqual({ status: 'resolved', value: 'from listener' });
      expect(hot.getDataAtCell(0, 1)).toBe('from listener');
      expect(plugin.isPending(0, 1)).toBe(false);

      destroy();
    });

    it('should keep a request the application starts from its own `afterChange` for the changed input', async() => {
      const request = deferred();
      let result: Promise<unknown> | undefined;
      const { hot, plugin, destroy } = createGrid({
        afterChange(changes: Array<[number, string, unknown, unknown]> | null) {
          if (changes?.some(([, prop]) => prop === 'sku')) {
            result = plugin.setAsyncValue(0, 1, () => request.promise, { dependsOn: ['sku'] });
          }
        },
      });

      // Re-enable at runtime, so the plugin's hooks are registered after the settings listener.
      hot.updateSettings({ asyncValues: false });
      hot.updateSettings({ asyncValues: true });
      hot.setDataAtCell(0, 0, 'Z');

      expect(plugin.isPending(0, 1)).toBe(true);

      request.resolve('Product Z');

      expect(await result).toEqual({ status: 'resolved', value: 'Product Z' });

      destroy();
    });

    it('should keep a pending request when `updateSettings()` rebuilds the row index', async() => {
      const { hot, plugin, destroy } = createGrid();
      const request = deferred();
      const result = plugin.setAsyncValue(2, 1, () => request.promise);

      hot.updateSettings({ columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price', type: 'numeric' }] });

      expect(plugin.isPending(2, 1)).toBe(true);

      hot.alter('insert_row_below', 3);

      expect(plugin.isPending(2, 1)).toBe(true);

      request.resolve('new C');

      expect(await result).toEqual({ status: 'resolved', value: 'new C' });
      expect(hot.getSourceDataAtRow(2)).toEqual({ sku: 'C', name: 'new C', price: 3 });

      destroy();
    });

    it('should not let a cancel listener start a request while the plugin is being disabled', async() => {
      const { hot, plugin, destroy } = createGrid();
      const restarted: Array<Promise<unknown>> = [];

      plugin.setAsyncValue(0, 1, () => deferred().promise);
      hot.addHook('afterAsyncValueCancel', () => {
        restarted.push(plugin.setAsyncValue(0, 1, Promise.resolve('LEAKED')));
      });
      hot.updateSettings({ asyncValues: false });

      expect(await restarted[0]).toEqual({ status: 'canceled', reason: 'disabled' });

      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('old A');

      destroy();
    });

    it('should cancel a request cleanly from a row listener that runs before the plugin', async() => {
      const canceled = jest.fn();
      const { hot, plugin, destroy } = createGrid({
        asyncValues: false,
        afterRemoveRow() {
          hot.getPlugin('asyncValues').cancel(1, 1);
        },
      });

      // Enabled at runtime, so the settings listener above was registered first.
      hot.updateSettings({ asyncValues: true });
      hot.addHook('afterAsyncValueCancel', canceled);

      const result = plugin.setAsyncValue(2, 1, () => deferred().promise);

      hot.alter('remove_row', 0);

      expect(await result).toEqual({ status: 'canceled', reason: 'manual' });
      expect(canceled).toHaveBeenCalledWith(1, 'name', 'manual', null);
      expect(plugin.isPending(1, 1)).toBe(false);
      expect(hot.getCell(1, 1)!.classList.contains('htAsyncPending')).toBe(false);

      // Another entry keeps the lookups live, so a leftover entry would show here.
      plugin.setAsyncValue(0, 1, () => deferred().promise);

      expect(plugin.isPending(1, 1)).toBe(false);

      destroy();
    });

    it('should cancel the requests a load orphaned when the load throws', async() => {
      const { hot, plugin, destroy } = createGrid({ minSpareRows: 1 });
      const result = plugin.setAsyncValue(0, 1, () => deferred().promise);
      const thrower = () => {
        throw new Error('listener failure');
      };

      hot.addHook('afterLoadData', thrower, -10);

      expect(() => hot.loadData([{ sku: 'X', name: 'x', price: 9 }])).toThrow('listener failure');

      hot.removeHook('afterLoadData', thrower);

      expect(await result).toEqual({ status: 'canceled', reason: 'dataReplaced' });

      const kept = deferred();
      const keptResult = plugin.setAsyncValue(0, 1, () => kept.promise);

      hot.alter('insert_row_above', 0);
      kept.resolve('new X');
      await keptResult;

      expect(hot.getSourceDataAtRow(1)).toEqual({ sku: 'X', name: 'new X', price: 9 });

      destroy();
    });

    it('should not report a rejection whose error a result in the same flush already cleared', async() => {
      const { hot, plugin, destroy } = createGrid();
      const rejected = jest.fn();

      hot.addHook('afterAsyncValueReject', rejected);

      const [skuResult, nameResult] = await Promise.all([
        plugin.setAsyncValue(0, 0, Promise.resolve('Z')),
        plugin.setAsyncValue(0, 1, Promise.reject(new Error('Unknown SKU')), { dependsOn: ['sku'] }),
      ]);

      expect(skuResult).toEqual({ status: 'resolved', value: 'Z' });
      expect(nameResult).toEqual(expect.objectContaining({ status: 'rejected', message: 'Unknown SKU' }));
      expect(plugin.getAsyncState(0, 1)).toBeNull();
      expect(rejected).not.toHaveBeenCalled();

      destroy();
    });

    it('should not call the source when a start listener cancels the request', async() => {
      const { hot, plugin, destroy } = createGrid();
      const source = jest.fn(() => deferred().promise);

      hot.addHook('afterAsyncValueStart', () => plugin.cancel(0, 1));

      expect(await plugin.setAsyncValue(0, 1, source)).toEqual({ status: 'canceled', reason: 'manual' });
      expect(source).not.toHaveBeenCalled();

      destroy();
    });

    it('should settle every promise when a cancel listener throws', async() => {
      const { hot, plugin, destroy } = createGrid();
      const results = [
        plugin.setAsyncValue(0, 1, () => deferred().promise),
        plugin.setAsyncValue(1, 1, () => deferred().promise),
      ];

      hot.addHook('afterAsyncValueCancel', () => {
        throw new Error('listener failure');
      });

      expect(() => plugin.cancelAll()).toThrow('listener failure');
      expect((await Promise.all(results)).map(result => result.status)).toEqual(['canceled', 'canceled']);

      destroy();
    });

    it('should keep a request the application starts from its own `afterLoadData`', async() => {
      const request = deferred();
      let result: Promise<unknown> | undefined;
      const { hot, destroy } = createGrid({
        afterLoadData(sourceData: unknown[], initialLoad: boolean) {
          if (!initialLoad) {
            result = hot.getPlugin('asyncValues').setAsyncValue(0, 1, () => request.promise);
          }
        },
      });

      // Re-enable at runtime, so the plugin's hooks are registered after the settings listener.
      hot.updateSettings({ asyncValues: false });
      hot.updateSettings({ asyncValues: true });
      hot.loadData([{ sku: 'X', name: 'x', price: 9 }]);
      request.resolve('Product X');

      expect(await result).toEqual({ status: 'resolved', value: 'Product X' });

      destroy();
    });

    it('should resolve the promises of pending requests as canceled when the grid is destroyed', async() => {
      const { plugin, destroy } = createGrid();
      let signal: AbortSignal | undefined;
      const result = plugin.setAsyncValue(0, 1, (context) => {
        signal = context.signal;

        return deferred().promise;
      });

      destroy();

      expect(signal!.aborted).toBe(true);
      expect(await result).toEqual({ status: 'canceled', reason: 'disabled' });
    });
  });

  describe('other plugins', () => {
    it('should stay disabled next to NestedRows', () => {
      const { plugin, destroy } = createGrid({
        data: [{ sku: 'A', name: 'old A', price: 1, __children: [{ sku: 'A1', name: 'old A1', price: 2 }] }],
        nestedRows: true,
      });

      expect(plugin.enabled).toBe(false);

      destroy();
    });

    it('should write the result into the source data of a row the filters hide', async() => {
      const { hot, plugin, destroy } = createGrid({ filters: true });
      const request = deferred();
      const result = plugin.setAsyncValue(1, 1, () => request.promise);
      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'neq', ['B']);
      filters.filter();
      request.resolve('new B');

      expect(await result).toEqual({ status: 'resolved', value: 'new B' });
      expect(hot.getSourceDataAtRow(1)).toEqual({ sku: 'B', name: 'new B', price: 2 });

      destroy();
    });

    it('should recompute a formula that references a resolved cell', async() => {
      const { hot, plugin, destroy } = createGrid({
        data: [{ sku: 'A', name: 'old A', price: 1, total: '=C1*2' }],
        columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price' }, { data: 'total' }],
        formulas: { engine: HyperFormula },
      });

      expect(hot.getDataAtCell(0, 3)).toBe(2);

      await plugin.setAsyncValue(0, 2, Promise.resolve(10));

      expect(hot.getDataAtCell(0, 3)).toBe(20);

      destroy();
    });

    it('should report a value a validator rejects as resolved and keep the previous value', async() => {
      const { hot, plugin, destroy } = createGrid({
        columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price', type: 'numeric', allowInvalid: false }],
      });

      expect(await plugin.setAsyncValue(0, 2, Promise.resolve('n/a')))
        .toEqual({ status: 'resolved', value: 'n/a' });

      await settle();

      expect(hot.getDataAtCell(0, 2)).toBe(1);

      destroy();
    });
  });

  describe('row order', () => {
    it('should land the result on its record after a sort', async() => {
      const { hot, plugin, destroy } = createGrid({ columnSorting: true });
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);

      hot.getPlugin('columnSorting').sort({ column: 2, sortOrder: 'desc' });

      expect(plugin.isPending(3, 1)).toBe(true);

      request.resolve('new A');
      await result;

      expect(hot.getSourceDataAtRow(0)).toEqual({ sku: 'A', name: 'new A', price: 1 });
      expect(hot.getDataAtRowProp(3, 'name')).toBe('new A');

      destroy();
    });

    it('should land the result on its record after a row is moved', async() => {
      const { hot, plugin, destroy } = createGrid({ manualRowMove: true });
      const request = deferred();
      const result = plugin.setAsyncValue(0, 1, () => request.promise);

      hot.getPlugin('manualRowMove').moveRow(1, 0);
      hot.render();

      expect(plugin.isPending(1, 1)).toBe(true);
      expect(hot.getCell(1, 1)!.classList.contains('htAsyncPending')).toBe(true);
      expect(hot.getCell(0, 1)!.classList.contains('htAsyncPending')).toBe(false);

      request.resolve('new A');
      await result;

      expect(hot.getDataAtRowProp(1, 'name')).toBe('new A');
      expect(hot.getSourceDataAtRow(0)).toEqual({ sku: 'A', name: 'new A', price: 1 });

      destroy();
    });

    it('should write the result into the source data of a trimmed row', async() => {
      const { hot, plugin, destroy } = createGrid({ trimRows: true });
      const request = deferred();
      const result = plugin.setAsyncValue(1, 1, () => request.promise);

      hot.getPlugin('trimRows').trimRow(1);
      request.resolve('new B');

      expect(await result).toEqual({ status: 'resolved', value: 'new B' });
      expect(hot.getSourceDataAtRow(1)).toEqual({ sku: 'B', name: 'new B', price: 2 });

      destroy();
    });
  });

  describe('reading values', () => {
    it('should copy the current value of a pending cell', () => {
      const { hot, plugin, destroy } = createGrid();

      plugin.setAsyncValue(0, 1, () => deferred().promise);

      expect(hot.getCopyableData(0, 1)).toBe('old A');

      destroy();
    });

    it('should export the current value of a pending or failed cell', async() => {
      const { hot, plugin, destroy } = createGrid();

      plugin.setAsyncValue(0, 1, () => deferred().promise);
      await plugin.setAsyncValue(1, 1, Promise.reject(new Error('Lookup failed')));

      const csv = hot.getPlugin('exportFile').exportAsString('csv', { range: [0, 1, 1, 1], bom: false });

      expect(csv).toBe('old A\r\nold B');

      destroy();
    });
  });
});
