import { registerAllModules } from 'handsontable/registry';
import { createGrid, deferred, products, settle } from './helpers/grid';

registerAllModules();

/**
 * A validator the test answers by hand, as a remote validator answers tasks later.
 */
function manualValidator() {
  const answers: Array<{ value: unknown; answer: (valid: boolean) => void }> = [];

  return {
    answers,
    validator(value: unknown, callback: (valid: boolean) => void) {
      answers.push({ value, answer: callback });
    },
  };
}

describe('AsyncValues: writes, flights, and rows', () => {
  it('should cancel a value for the cell the user is editing, and keep the typed text', async() => {
    const { hot, plugin, destroy } = createGrid();
    const request = deferred();
    const result = plugin.setAsyncValue(0, 1, () => request.promise);

    hot.selectCell(0, 1);
    hot.getActiveEditor()!.beginEditing();
    hot.getActiveEditor()!.setValue('typing');
    request.resolve('new A');

    expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
    expect(hot.getActiveEditor()!.isOpened()).toBe(true);
    expect(hot.getActiveEditor()!.getValue()).toBe('typing');
    expect(hot.getDataAtCell(0, 1)).toBe('old A');

    destroy();
  });

  it('should write a row past `maxRows` to its source data, with no visual row in the context', async() => {
    const { hot, plugin, destroy } = createGrid({ maxRows: 2 });
    const rows: Array<number | null> = [];

    const results = await plugin.setAsyncValuesForRows('all', 'name', async({ row, physicalRow }) => {
      rows.push(row);

      return `new ${physicalRow}`;
    });

    expect(rows).toEqual([0, 1, null, null]);
    expect(results.map(result => result.status)).toEqual(['resolved', 'resolved', 'resolved', 'resolved']);
    expect(hot.getSourceDataAtCol(1)).toEqual(['new 0', 'new 1', 'new 2', 'new 3']);

    destroy();
  });

  it('should cancel a value computed from an input the same flush writes', async() => {
    const { hot, plugin, destroy } = createGrid();
    const name = plugin.setAsyncValue(0, 1, Promise.resolve('new A'));
    const price = plugin.setAsyncValue(0, 2, Promise.resolve(99), { dependsOn: ['name'] });

    expect(await name).toEqual({ status: 'resolved', value: 'new A' });
    expect(await price).toEqual({ status: 'canceled', reason: 'dependency' });
    expect(hot.getDataAtCell(0, 2)).toBe(1);

    destroy();
  });

  it('should record one step with the last value when two calls write one validated cell', async() => {
    const { answers, validator } = manualValidator();
    const { hot, plugin, destroy } = createGrid({
      undo: true,
      columns: [{ data: 'sku' }, { data: 'name', validator }, { data: 'price' }],
    });
    const undoRedo = hot.getPlugin('undoRedo');

    await plugin.setAsyncValue(0, 1, Promise.resolve('v1'), { undo: 'record' });
    await settle();
    await plugin.setAsyncValue(0, 1, Promise.resolve('v2'), { undo: 'record' });
    await settle();

    answers.forEach(({ answer }) => answer(true));
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('v2');

    undoRedo.undo();

    expect(hot.getDataAtCell(0, 1)).toBe('old A');
    expect(undoRedo.isUndoAvailable()).toBe(false);

    destroy();
  });

  it('should not apply `meta` for a value a later write replaced while both waited for the validator', async() => {
    const { answers, validator } = manualValidator();
    const { hot, plugin, destroy } = createGrid({
      columns: [{ data: 'sku' }, { data: 'name', validator }, { data: 'price' }],
    });

    await plugin.setAsyncValue(0, 1, Promise.resolve('v1'), { meta: { className: 'fromFirst' } });
    await settle();
    await plugin.setAsyncValue(0, 1, Promise.resolve('v2'));
    await settle();

    answers.forEach(({ answer }) => answer(true));
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('v2');
    expect(hot.getCellMeta(0, 1).className).toBeUndefined();

    destroy();
  });

  it('should record the value a validator corrected through a `*Validator` source', async() => {
    const { hot, plugin, destroy } = createGrid({ undo: true });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.updateSettings({
      columns: [
        { data: 'sku' },
        {
          data: 'name',
          validator(this: { visualRow: number; prop: string }, value: unknown, callback: (valid: boolean) => void) {
            if (typeof value === 'string' && value !== value.trim()) {
              hot.setDataAtRowProp(this.visualRow, this.prop, value.trim(), 'trimValidator');
            }

            callback(true);
          },
        },
        { data: 'price' },
      ],
    });

    await plugin.setAsyncValue(0, 1, Promise.resolve('  new A  '), { undo: 'record' });
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('new A');
    expect(undoRedo.isUndoAvailable()).toBe(true);

    undoRedo.undo();

    expect(hot.getDataAtCell(0, 1)).toBe('old A');

    destroy();
  });

  it('should use the default source in place of a reserved one, with a warning', async() => {
    const { hot, plugin, destroy } = createGrid();
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const sources: unknown[] = [];

    hot.addHook('afterChange', (changes, source) => sources.push(source));

    await plugin.setAsyncValue(0, 1, Promise.resolve('a'), { source: 'auto' });
    await plugin.setAsyncValue(1, 1, Promise.resolve('b'), { source: 'myValidator' });

    expect(sources).toEqual(['AsyncValues.resolve', 'AsyncValues.resolve']);
    expect(warn).toHaveBeenCalledTimes(2);

    warn.mockRestore();
    destroy();
  });

  it('should cancel every cell an edit changes when a cancel listener throws', async() => {
    const { hot, plugin, destroy } = createGrid();
    const thrown = new Error('Listener failed');
    const requests = [deferred(), deferred()];
    const results = plugin.setAsyncValues(0, 1, 1, 1, ({ row }) => requests[row!].promise);

    hot.addHook('afterAsyncValueCancel', () => {
      throw thrown;
    });

    expect(() => hot.setDataAtCell([[0, 1, 'typed A'], [1, 1, 'typed B']])).toThrow(thrown);

    requests.forEach(request => request.resolve('stale'));

    expect(await results).toEqual([
      { status: 'canceled', reason: 'edit' },
      { status: 'canceled', reason: 'edit' },
    ]);
    expect(hot.getDataAtCol(1)).toEqual(['typed A', 'typed B', 'old C', 'old D']);

    destroy();
  });

  it('should not call `beforeAsyncValueResolve` for a cell an earlier listener call canceled', async() => {
    const { hot, plugin, destroy } = createGrid();
    const asked: number[] = [];

    hot.addHook('beforeAsyncValueResolve', (value, physicalRow) => {
      asked.push(physicalRow);

      if (physicalRow === 0) {
        plugin.cancel(1, 1);
      }
    });

    await plugin.setAsyncValues(0, 1, 1, 1, async() => 'new');

    expect(asked).toEqual([0]);

    destroy();
  });

  it('should reject a batch cell whose element is a hole or `undefined`', async() => {
    const { plugin, destroy } = createGrid();
    // eslint-disable-next-line no-sparse-arrays
    const results = await plugin.setAsyncValuesInBatches('all', 'name', async() => [, undefined, 'c', null]);

    expect(results.map(result => result.status)).toEqual(['rejected', 'rejected', 'resolved', 'resolved']);

    destroy();
  });

  it('should clear `asyncState` from an off-screen cell\'s meta when the plugin is disabled', () => {
    const data = Array.from({ length: 200 }, (_, index) => ({ id: index, sku: `S${index}`, name: null }));
    // Without the auto-size samplers, nothing reads the off-screen cell's meta while the plugin turns off.
    const { hot, plugin, destroy } = createGrid({ data, autoColumnSize: false, autoRowSize: false });

    plugin.setAsyncValue(150, 1, () => deferred().promise);

    expect(hot.getCell(150, 1)).toBeNull();
    expect(hot.getCellMeta(150, 1).asyncState).toBe('pending');

    hot.updateSettings({ asyncValues: false });

    expect(hot.getCellMeta(150, 1).asyncState).toBeNull();

    destroy();
  });

  it('should add hidden loading text to a pending cell, and a marker bar to a failed one', async() => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setAsyncValue(0, 1, () => deferred().promise);
    await plugin.setAsyncValue(1, 1, Promise.reject(new Error('Timeout')));
    hot.render();

    expect(hot.getCell(0, 1)!.querySelector('.htAsyncPendingMessage')!.textContent).toBe('Loading...');
    expect(hot.getCell(1, 1)!.querySelector('.htAsyncErrorMarker')).not.toBeNull();

    destroy();
  });

  it('should check a pending cell by row id with `isPendingAt()`', async() => {
    const { plugin, destroy } = createGrid({ rowId: 'id' });

    plugin.setAsyncValueAt({ rowId: 'c', prop: 'name' }, () => deferred().promise);
    await plugin.setAsyncValueAt({ rowId: 'a', prop: 'name' }, Promise.reject(new Error('Timeout')));

    expect(plugin.isPendingAt({ rowId: 'c', prop: 'name' })).toBe(true);
    expect(plugin.isPendingAt({ rowId: 'b', prop: 'name' })).toBe(false);
    expect(plugin.isPendingAt({ rowId: 'a', prop: 'name' })).toBe(false);

    destroy();
  });

  it('should drop a kept write keyed by a column index that a column insert shifts', async() => {
    const { answers, validator } = manualValidator();
    const { hot, plugin, destroy } = createGrid({
      undo: true,
      data: [['A', 'old A'], ['B', 'old B']],
      columns: undefined,
      validator,
    });
    const undoRedo = hot.getPlugin('undoRedo');

    await plugin.setAsyncValue(0, 1, Promise.resolve('new A'), { undo: 'record' });
    await settle();
    hot.alter('insert_col_start', 0);
    answers.forEach(({ answer }) => answer(true));
    await settle();

    // The only step is the column insert.
    undoRedo.undo();

    expect(undoRedo.isUndoAvailable()).toBe(false);

    destroy();
  });
});

describe('AsyncValues: rows the index mapper resizes without row hooks', () => {
  it('should follow a row id when the data array changes in place, as the Vue wrapper reports it', async() => {
    const data = products();
    const { hot, plugin, destroy } = createGrid({ data, rowId: 'id' });
    const request = deferred();
    const result = plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, () => request.promise);
    const mapper = hot.rowIndexMapper;

    data.unshift({ id: 'z', sku: 'Z', name: 'old Z', price: 0 });
    hot.batch(() => mapper.insertIndexes(mapper.getNumberOfIndexes() - 1, 1));
    await settle();
    request.resolve('new B');

    expect(await result).toEqual({ status: 'resolved', value: 'new B' });
    expect(hot.getSourceDataAtRow(2)).toEqual({ id: 'b', sku: 'B', name: 'new B', price: 2 });

    destroy();
  });

  it('should cancel a request whose row the index mapper drops from its end', async() => {
    const data = products();
    const { hot, plugin, destroy } = createGrid({ data });
    const result = plugin.setAsyncValue(3, 1, () => deferred().promise);

    data.pop();
    hot.batch(() => hot.rowIndexMapper.removeIndexes([3]));
    await settle();

    expect(await result).toEqual({ status: 'canceled', reason: 'rowRemoved' });
    expect(plugin.countPending()).toBe(0);

    destroy();
  });
});

describe('AsyncValues: rendering', () => {
  it('should render once per animation frame for flushes in separate tasks', async() => {
    const { hot, plugin, destroy } = createGrid();
    const frames: FrameRequestCallback[] = [];
    const requestFrame = jest.spyOn(hot.rootWindow, 'requestAnimationFrame').mockImplementation((callback) => {
      frames.push(callback);

      return frames.length;
    });
    const requests = [deferred(), deferred(), deferred()];
    const results = plugin.setAsyncValues(0, 1, 2, 1, ({ row }) => requests[row!].promise);
    let renders = 0;

    hot.addHook('afterRender', () => {
      renders += 1;
    });

    for (const request of requests) {
      request.resolve('new');
      await settle();
    }

    await results;

    expect(renders).toBe(1);
    expect(hot.getDataAtCol(1)).toEqual(['new', 'new', 'new', 'old D']);

    frames.splice(0).forEach(callback => callback(0));

    expect(renders).toBe(2);

    requestFrame.mockRestore();
    destroy();
  });
});

describe('AsyncValues: settings', () => {
  it('should run every source at once with `concurrency: Infinity`, and fall back to 6 for an invalid one', () => {
    const data = Array.from({ length: 10 }, (_, index) => ({ id: index, sku: `S${index}`, name: null }));
    const unlimited = createGrid({ data, asyncValues: { concurrency: Infinity } });
    const source = jest.fn(() => deferred().promise);

    unlimited.plugin.setAsyncValuesForRows('all', 'name', source);

    expect(source).toHaveBeenCalledTimes(10);

    unlimited.destroy();

    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const invalid = createGrid({ data, asyncValues: { concurrency: 0 } });
    const limited = jest.fn(() => deferred().promise);

    invalid.plugin.setAsyncValuesForRows('all', 'name', limited);

    expect(limited).toHaveBeenCalledTimes(6);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
    invalid.destroy();
  });
});
