import { registerAllModules } from 'handsontable/registry';
import { createGrid, deferred, settle } from './helpers/grid';

registerAllModules();

/**
 * Collects the errors a flush throws: it runs in a microtask, so the browser reports them on the window.
 */
function catchWindowErrors(rootWindow: Window) {
  const errors: unknown[] = [];
  const onError = (event: ErrorEvent) => {
    event.preventDefault();
    errors.push(event.error);
  };

  rootWindow.addEventListener('error', onError);

  return {
    errors,
    stop() {
      rootWindow.removeEventListener('error', onError);
    },
  };
}

describe('AsyncValues: listeners that throw, and the order of the hooks', () => {
  it('should fail only the cell whose `beforeAsyncValueResolve` listener throws, and write the others', async() => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');
    const windowErrors = catchWindowErrors(hot.rootWindow);

    hot.addHook('beforeAsyncValueResolve', (value, physicalRow) => {
      if (physicalRow === 1) {
        throw thrown;
      }

      return undefined;
    });

    const results = await plugin.setAsyncValues(0, 1, 2, 1, async({ row }) => `new ${row}`);

    expect(results).toEqual([
      { status: 'resolved', value: 'new 0' },
      { status: 'rejected', error: thrown, message: 'Listener failed' },
      { status: 'resolved', value: 'new 2' },
    ]);
    expect(hot.getDataAtCol(1)).toEqual(['new 0', 'old B', 'new 2', 'old D']);
    expect(plugin.getAsyncState(1, 1)).toEqual({ status: 'error', error: thrown, message: 'Listener failed' });
    expect(plugin.countPending()).toBe(0);

    await settle();

    // Thrown again once every cell was settled.
    expect(windowErrors.errors).toEqual([thrown]);

    windowErrors.stop();
    destroy();
  });

  it('should start the other cells of a batch when a `beforeAsyncValueStart` listener throws, and throw after', async() => {
    const { hot, plugin, destroy } = createGrid({ rowId: 'id' });
    const thrown = new Error('Listener failed');
    const calls: number[][] = [];

    hot.addHook('beforeAsyncValueStart', (physicalRow) => {
      if (physicalRow === 1) {
        throw thrown;
      }
    });

    expect(() => plugin.setAsyncValuesInBatches('all', 'name', async(cells) => {
      calls.push(cells.map(cell => cell.physicalRow));

      return cells.map(cell => `new ${cell.rowId}`);
    }, { batchSize: 2 })).toThrow(thrown);

    // The throwing listener counts as a veto of its own cell.
    expect(plugin.countPending()).toBe(3);
    expect(calls).toEqual([[0, 2], [3]]);

    await settle();

    expect(hot.getDataAtCol(1)).toEqual(['new a', 'old B', 'new c', 'new d']);

    destroy();
  });

  it('should keep a request whose `afterAsyncValueStart` listener throws', async() => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');
    const request = deferred();

    hot.addHook('afterAsyncValueStart', () => {
      throw thrown;
    });

    expect(() => plugin.setAsyncValue(0, 1, () => request.promise)).toThrow(thrown);
    expect(plugin.isPending(0, 1)).toBe(true);

    request.resolve('new A');
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('new A');

    destroy();
  });

  it('should fire `afterAsyncValuesIdle` after the resolve hooks of the last flush', async() => {
    const { hot, plugin, destroy } = createGrid();
    const order: string[] = [];

    hot.addHook('afterAsyncValueResolve', physicalRow => order.push(`resolve ${physicalRow}`));
    hot.addHook('afterAsyncValuesIdle', () => order.push('idle'));

    await plugin.setAsyncValues(0, 1, 1, 1, async({ row }) => `new ${row}`);

    expect(order).toEqual(['resolve 0', 'resolve 1', 'idle']);

    destroy();
  });

  it('should count the written and the vetoed cells as done while their values are written', async() => {
    const { hot, plugin, destroy } = createGrid();
    const counts: number[] = [];

    hot.addHook('beforeAsyncValueResolve', (value, physicalRow) => (physicalRow === 1 ? false : undefined));
    hot.addHook('afterChange', (changes, source) => {
      if (source === 'AsyncValues.resolve') {
        counts.push(plugin.countPending());
      }
    });

    plugin.setAsyncValue(3, 1, () => deferred().promise);
    await plugin.setAsyncValues(0, 1, 2, 1, async() => 'new');

    expect(counts).toEqual([1]);

    destroy();
  });

  it('should keep what the user types in an open editor when a filtered-out row\'s value is written', async() => {
    const { hot, plugin, destroy } = createGrid({ trimRows: [3] });
    const request = deferred();

    plugin.setAsyncValueAt({ physicalRow: 3, prop: 'name' }, () => request.promise);
    hot.selectCell(0, 1);

    const editor = hot.getActiveEditor()!;

    editor.beginEditing();
    editor.setValue('typing');

    request.resolve('new D');
    await settle();

    expect(hot.getSourceDataAtCell(3, 'name')).toBe('new D');
    expect(editor.isOpened()).toBe(true);
    expect(editor.getValue()).toBe('typing');

    destroy();
  });
});
