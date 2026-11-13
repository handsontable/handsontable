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

  it('should start a restarted request when the previous request\'s cancel listener throws', async() => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');
    const source = jest.fn(async() => 'new A');

    plugin.setAsyncValue(0, 1, () => deferred().promise);
    hot.addHook('afterAsyncValueCancel', () => {
      throw thrown;
    });

    expect(() => plugin.setAsyncValue(0, 1, source)).toThrow(thrown);
    expect(source).toHaveBeenCalledTimes(1);

    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('new A');
    expect(plugin.countPending()).toBe(0);

    destroy();
  });

  it('should start every cell of a batch that restarts a cell whose cancel listener throws', async() => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');
    const calls: number[][] = [];

    plugin.setAsyncValue(1, 1, () => deferred().promise);
    hot.addHook('afterAsyncValueCancel', () => {
      throw thrown;
    });

    expect(() => plugin.setAsyncValuesInBatches('all', 'name', async(cells) => {
      calls.push(cells.map(cell => cell.physicalRow));

      return cells.map(() => 'new');
    })).toThrow(thrown);
    expect(calls).toEqual([[0, 1, 2, 3]]);

    await settle();

    expect(plugin.countPending()).toBe(0);

    destroy();
  });

  it('should disable the plugin when a cancel listener throws while it disables', () => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');

    plugin.setAsyncValue(0, 1, () => deferred().promise);
    hot.addHook('afterAsyncValueCancel', () => {
      throw thrown;
    });

    expect(() => hot.updateSettings({ asyncValues: false })).toThrow(thrown);
    expect(plugin.enabled).toBe(false);
    expect(() => plugin.setAsyncValue(1, 1, async() => 'new')).toThrow('not enabled');

    destroy();
  });

  it('should fire the hooks of the other cells when one cell\'s resolve or cancel listener throws', async() => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');
    const windowErrors = catchWindowErrors(hot.rootWindow);
    const resolved: number[] = [];
    const canceled: number[] = [];

    hot.addHook('afterAsyncValueResolve', (physicalRow) => {
      resolved.push(physicalRow);

      if (physicalRow === 0) {
        throw thrown;
      }
    });
    hot.addHook('afterAsyncValueCancel', (physicalRow) => {
      canceled.push(physicalRow);

      if (physicalRow === 0) {
        throw thrown;
      }
    });

    await plugin.setAsyncValues(0, 1, 2, 1, async() => 'new');
    await settle();

    expect(resolved).toEqual([0, 1, 2]);
    expect(windowErrors.errors).toEqual([thrown]);

    plugin.setAsyncValues(0, 1, 2, 1, () => deferred().promise);

    expect(() => plugin.cancelAll()).toThrow(thrown);
    expect(canceled).toEqual([0, 1, 2]);

    windowErrors.stop();
    destroy();
  });

  it('should write the other values of a flush when a `beforeChange` listener throws', async() => {
    const thrown = new Error('Listener failed');
    const { hot, plugin, destroy } = createGrid({
      trimRows: [3],
      beforeChange() {
        throw thrown;
      },
    });
    const windowErrors = catchWindowErrors(hot.rootWindow);
    const results = Promise.all([
      plugin.setAsyncValue(0, 1, Promise.resolve('new A')),
      plugin.setAsyncValueAt({ physicalRow: 3, prop: 'name' }, Promise.resolve('new D')),
    ]);

    await results;
    await settle();

    expect(hot.getSourceDataAtCell(3, 'name')).toBe('new D');
    expect(windowErrors.errors).toEqual([thrown]);

    windowErrors.stop();
    destroy();
  });

  it('should stop quietly when a resolve listener destroys the grid', async() => {
    const { hot, plugin } = createGrid();
    const windowErrors = catchWindowErrors(hot.rootWindow);

    hot.addHook('afterAsyncValueResolve', () => hot.destroy());

    await plugin.setAsyncValues(0, 1, 2, 1, async() => 'new', { undo: 'record', meta: { className: 'x' } });
    await settle();

    expect(hot.isDestroyed).toBe(true);
    expect(windowErrors.errors).toEqual([]);

    windowErrors.stop();
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
