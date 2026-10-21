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

  [
    ['the default source', undefined, undefined],
    ['a source of its own per call', 'first', 'second'],
  ].forEach(([title, firstSource, secondSource]) => {
    it(`should record one step with the last value when the validators answer in reverse order (${title})`, async() => {
      const { answers, validator } = manualValidator();
      const { hot, plugin, destroy } = createGrid({
        undo: true,
        columns: [{ data: 'sku' }, { data: 'name', validator }, { data: 'price' }],
      });
      const undoRedo = hot.getPlugin('undoRedo');

      await plugin.setAsyncValue(0, 1, Promise.resolve('v1'), { undo: 'record', source: firstSource });
      await settle();
      await plugin.setAsyncValue(0, 1, Promise.resolve('v2'), { undo: 'record', source: secondSource });
      await settle();

      answers.reverse().forEach(({ answer }) => answer(true));
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('v2');

      undoRedo.undo();

      expect(hot.getDataAtCell(0, 1)).toBe('old A');
      expect(undoRedo.isUndoAvailable()).toBe(false);

      destroy();
    });

    it(`should record a later call's step after a user edit overtook the value (${title})`, async() => {
      const { answers, validator } = manualValidator();
      const { hot, plugin, destroy } = createGrid({
        undo: true,
        columns: [{ data: 'sku' }, { data: 'name', validator }, { data: 'price' }],
      });
      const undoRedo = hot.getPlugin('undoRedo');

      await plugin.setAsyncValue(0, 1, Promise.resolve('AI 2'), { undo: 'record', source: firstSource });
      await settle();
      hot.setDataAtCell(0, 1, 'user value');
      await settle();

      answers[1].answer(true);
      await settle();
      answers[0].answer(true);
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('user value');

      const third = plugin.setAsyncValue(0, 1, Promise.resolve('AI 3'), { undo: 'record', source: secondSource });

      await third;
      await settle();
      answers[2].answer(true);
      await settle();

      expect(hot.getDataAtCell(0, 1)).toBe('AI 3');

      undoRedo.undo();

      expect(hot.getDataAtCell(0, 1)).toBe('user value');

      undoRedo.undo();

      expect(hot.getDataAtCell(0, 1)).toBe('old A');
      expect(undoRedo.isUndoAvailable()).toBe(false);

      destroy();
    });
  });

  it('should keep a value written after a user edit that waits for its validator, and order the next write', async() => {
    const { answers, validator } = manualValidator();
    const { hot, plugin, destroy } = createGrid({
      undo: true,
      columns: [{ data: 'sku' }, { data: 'name', validator }, { data: 'price' }],
    });
    const undoRedo = hot.getPlugin('undoRedo');

    hot.setDataAtCell(0, 1, 'user value');
    await settle();
    await plugin.setAsyncValue(0, 1, Promise.resolve('AI'), { undo: 'record' });
    await settle();

    answers.forEach(({ answer }) => answer(true));
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('AI');

    await plugin.setAsyncValue(0, 1, Promise.resolve('AI 2'), { undo: 'record' });
    await settle();
    answers[2].answer(true);
    await settle();

    expect(hot.getDataAtCell(0, 1)).toBe('AI 2');

    undoRedo.undo();

    expect(hot.getDataAtCell(0, 1)).toBe('AI');

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

  it('should cancel a request whose row was spliced out of the middle of the data, with row ids', async() => {
    const data = products();
    const { hot, plugin, destroy } = createGrid({ data, rowId: 'id' });
    const request = deferred();
    const result = plugin.setAsyncValueAt({ rowId: 'b', prop: 'name' }, () => request.promise);

    data.splice(1, 1);
    hot.batch(() => hot.rowIndexMapper.removeIndexes([3]));
    await settle();
    request.resolve('new B');

    expect(await result).toEqual({ status: 'canceled', reason: 'rowRemoved' });
    expect(hot.getSourceDataAtCol(1)).toEqual(['old A', 'old C', 'old D']);

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

describe('AsyncValues: write groups, rejected writes, and data replacement', () => {
  it('should keep every write of a group waiting while one of its cells validates', async() => {
    const { answers, validator } = manualValidator();
    const { hot, plugin, destroy } = createGrid({
      undo: true,
      columns: [{ data: 'sku' }, { data: 'name' }, { data: 'price', validator }],
    });
    const undoRedo = hot.getPlugin('undoRedo');

    await plugin.setAsyncValues(0, 1, 0, 2, async({ column }) => (column === 1 ? 'new A' : 10), {
      undo: 'record', meta: { className: 'fromAsync' },
    });
    await settle();

    expect(hot.getDataAtRow(0)).toEqual(['A', 'old A', 1]);

    answers.forEach(({ answer }) => answer(true));
    await settle();

    expect(hot.getDataAtRow(0)).toEqual(['A', 'new A', 10]);
    expect(hot.getCellMeta(0, 1).className).toBe('fromAsync');
    expect(hot.getCellMeta(0, 2).className).toBe('fromAsync');

    undoRedo.undo();

    expect(hot.getDataAtRow(0)).toEqual(['A', 'old A', 1]);

    destroy();
  });

  it('should leave no unhandled rejection for a promise source it never awaited', async() => {
    const { hot, plugin, destroy } = createGrid({ asyncValues: { concurrency: 1 } });
    const unhandled = jest.fn();
    const queued = deferred();
    const vetoed = deferred();

    process.on('unhandledRejection', unhandled);
    plugin.setAsyncValue(0, 1, () => deferred().promise);
    plugin.setAsyncValue(1, 1, queued.promise);
    plugin.cancel(1, 1);
    hot.addHook('beforeAsyncValueStart', () => false);
    plugin.setAsyncValue(2, 1, vetoed.promise);
    queued.reject(new Error('Timeout'));
    vetoed.reject(new Error('Timeout'));
    await settle();
    await settle();

    expect(unhandled).not.toHaveBeenCalled();

    process.off('unhandledRejection', unhandled);
    destroy();
  });

  it('should treat a source write a `sourceDataValidator` rejected as no change', async() => {
    const nameValidator = (value: unknown) => value !== 'bad';
    const { hot, plugin, destroy } = createGrid({
      undo: true,
      maxRows: 3,
      // Grid level: core reads a prop-named source write's meta from the table meta.
      sourceDataValidator: nameValidator,
      allowInvalid: false,
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const price = plugin.setAsyncValueAt({ physicalRow: 3, prop: 'price' }, () => deferred().promise, {
      dependsOn: ['name'],
    });

    // Row 3 is past `maxRows`, so its value is written with `setSourceDataAtCell()`.
    await plugin.setAsyncValueAt({ physicalRow: 3, prop: 'name' }, async() => 'bad', { undo: 'record' });
    await settle();

    expect(hot.getSourceDataAtCell(3, 'name')).toBe('old D');
    expect(plugin.isPendingAt({ physicalRow: 3, prop: 'price' })).toBe(true);
    expect(hot.getPlugin('undoRedo').isUndoAvailable()).toBe(false);

    plugin.cancelAll();

    expect(await price).toEqual({ status: 'canceled', reason: 'manual' });

    warn.mockRestore();
    destroy();
  });

  it('should still record the landed values of a call the plugin was disabled in the middle of', async() => {
    const { hot, plugin, destroy } = createGrid({ undo: true });
    const undoRedo = hot.getPlugin('undoRedo');
    const requests = [deferred(), deferred()];

    plugin.setAsyncValues(0, 1, 1, 1, ({ row }) => requests[row!].promise, { undo: 'record' });
    requests[0].resolve('new A');
    await settle();
    hot.updateSettings({ asyncValues: false });
    await settle();

    expect(undoRedo.isUndoAvailable()).toBe(true);

    undoRedo.undo();

    expect(hot.getDataAtCol(1)).toEqual(['old A', 'old B', 'old C', 'old D']);

    destroy();
  });

  it('should land each write group on its record when a listener sorts the grid between them', async() => {
    const { hot, plugin, destroy } = createGrid({ columnSorting: true });

    hot.addHook('afterChange', (changes, source) => {
      if (source === 'first') {
        hot.getPlugin('columnSorting').sort({ column: 0, sortOrder: 'desc' });
      }
    });

    await Promise.all([
      plugin.setAsyncValue(0, 1, Promise.resolve('new A'), { source: 'first' }),
      plugin.setAsyncValue(1, 1, Promise.resolve('new B'), { source: 'second' }),
    ]);

    expect(hot.getSourceDataAtCol(1)).toEqual(['new A', 'new B', 'old C', 'old D']);

    destroy();
  });

  it('should cancel the request of a row state an early row hook listener released', async() => {
    const { hot, plugin, destroy } = createGrid();

    plugin.setAsyncValue(2, 1, () => deferred().promise);
    // Runs before the plugin's own listener, while the state's row is still the one before the insert.
    hot.addHook('afterCreateRow', () => plugin.cancelAt({ physicalRow: 3, prop: 'name' }), -2);
    hot.alter('insert_row_above', 0);

    const result = plugin.setAsyncValue(3, 1, () => deferred().promise);

    hot.loadData(products());

    expect(await result).toEqual({ status: 'canceled', reason: 'dataReplaced' });

    destroy();
  });

  it('should treat a failed `updateData()` as an update, keeping the requests on their rows', async() => {
    const { hot, plugin } = createGrid();

    plugin.setAsyncValue(1, 1, () => deferred().promise);
    hot.addHook('beforeUpdateData', () => {
      throw new Error('Listener failed');
    });

    expect(() => hot.updateData(products())).toThrow('Listener failed');

    await settle();

    // A load without row ids would have canceled it with `'dataReplaced'`. The grid has no data map
    // after the throw, so only the count is read.
    expect(plugin.countPending()).toBe(1);
  });

});

describe('AsyncValues: remapped columns, cut, and repeated cells', () => {
  /**
   * Builds a grid of array data whose two columns show the source columns in reverse order.
   */
  function createSwappedGrid(settings: Record<string, unknown> = {}) {
    return createGrid({
      data: [['a0', 'b0'], ['a1', 'b1']],
      columns: [{ data: 1 }, { data: 0 }],
      ...settings,
    });
  }

  it('should cancel a request when its cell is written through `setSourceDataAtCell()` with remapped columns', async() => {
    const { hot, plugin, destroy } = createSwappedGrid();
    const result = plugin.setAsyncValueAt({ physicalRow: 0, prop: 1 }, () => deferred().promise);

    // Writes `dataRow[1]`, the cell the request is for.
    hot.setSourceDataAtCell(0, 1, 'typed');

    expect(await result).toEqual({ status: 'canceled', reason: 'edit' });
    expect(hot.getSourceDataAtRow(0)).toEqual(['a0', 'typed']);

    destroy();
  });

  it('should record the old value of the written column with remapped columns', async() => {
    const { hot, plugin, destroy } = createSwappedGrid({ undo: true });

    await plugin.setAsyncValueAt({ physicalRow: 0, prop: 0 }, async() => 'new a0', { undo: 'record' });

    expect(hot.getSourceDataAtRow(0)).toEqual(['new a0', 'b0']);

    hot.getPlugin('undoRedo').undo();

    expect(hot.getSourceDataAtRow(0)).toEqual(['a0', 'b0']);

    destroy();
  });

  it('should cut a pending cell as an empty value with `copyPendingAs: \'empty\'`', () => {
    const { hot, plugin, destroy } = createGrid({ asyncValues: { copyPendingAs: 'empty' } });

    plugin.setAsyncValue(1, 1, () => deferred().promise);

    const data = [['B', 'old B']];

    hot.runHooks('beforeCut', data, [{ startRow: 1, startCol: 0, endRow: 1, endCol: 1 }]);

    expect(data).toEqual([['B', '']]);

    destroy();
  });

  it('should compute a cell listed twice once with `setAsyncValuesForRows()`', async() => {
    const { plugin, destroy } = createGrid({ rowId: 'id' });
    const source = jest.fn(async() => 'new B');
    const results = await plugin.setAsyncValuesForRows([{ physicalRow: 1 }, { rowId: 'b' }], 'name', source);

    expect(source).toHaveBeenCalledTimes(1);
    expect(results).toEqual([{ status: 'resolved', value: 'new B' }, { status: 'resolved', value: 'new B' }]);

    destroy();
  });
});
