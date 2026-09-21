import Core from 'handsontable/core';
import {
  registerPlugin,
  AutoColumnSize,
  AutoRowSize,
  BindRowsWithHeaders,
  ColumnSorting,
  DropdownMenu,
  Filters,
  HiddenRows,
  ManualColumnResize,
  ManualRowResize,
  NestedRows,
  TrimRows,
} from 'handsontable/plugins';
import {
  registerCellType,
  CheckboxCellType,
  TextCellType,
} from 'handsontable/cellTypes';
import { registerRenderer, baseRenderer, textRenderer } from 'handsontable/renderers';
import { _resetDeprecationWarnings } from 'handsontable/helpers/console';
import { staticRegister, resolveWithInstance } from '../../utils/staticRegister';
import { rootInstanceSymbol } from '../../utils/rootInstance';

registerCellType(CheckboxCellType);
registerCellType(TextCellType);

registerRenderer(baseRenderer);
registerRenderer(textRenderer);

registerPlugin(AutoColumnSize);
registerPlugin(AutoRowSize);
registerPlugin(BindRowsWithHeaders);
registerPlugin(ColumnSorting);
registerPlugin(DropdownMenu);
registerPlugin(Filters);
registerPlugin(HiddenRows);
registerPlugin(ManualColumnResize);
registerPlugin(ManualRowResize);
registerPlugin(NestedRows);
registerPlugin(TrimRows);

describe('Core', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
  });

  afterEach(() => {
    container.remove();
  });

  describe('updateData', () => {
    it('should advance the render epoch even when the dataset keeps its size', () => {
      const core = new Core(container, { data: [['a', 'b'], ['c', 'd']] });

      core.init();

      const epochBefore = core.renderChangeTracker.epoch;

      core.updateData([['e', 'f'], ['g', 'h']]);

      expect(core.renderChangeTracker.epoch).toBeGreaterThan(epochBefore);

      core.destroy();
    });
  });

  describe('init', () => {
    it('should be idempotent - a second call is a no-op that does not rebuild the view or overlays DOM', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      // Track how many `ResizeObserver`s are created. A newable subclass is needed - `jest.spyOn` on a class
      // constructor cannot be invoked with `new` in this Jest version.
      const OriginalResizeObserver = window.ResizeObserver;
      const resizeObserverInstances = [];
      const observedTargets = [];

      window.ResizeObserver = class extends OriginalResizeObserver {
        constructor(...args) {
          super(...args);
          resizeObserverInstances.push(this);
        }

        observe(target, ...rest) {
          observedTargets.push(target);

          return super.observe(target, ...rest);
        }
      };

      // Build a ROOT instance (third constructor arg) so the root-only branch of `init()` runs too - it is
      // what sets up the edge-slot `ResizeObserver` the ticket calls out as being orphaned on a re-init.
      const core = new Core(container, {
        data: [['a', 'b'], ['c', 'd']],
        licenseKey: 'non-commercial-and-evaluation',
      }, rootInstanceSymbol);
      let beforeInitCount = 0;

      core.addHook('beforeInit', () => {
        beforeInitCount += 1;
      });

      try {
        core.init();

        const viewAfterFirstInit = core.view;
        // The master table plus the Walkontable overlay clones each carry the `htCore` class, so a single
        // init produces several. What matters is that a second init adds none of them.
        const htCoreCountAfterFirstInit = container.querySelectorAll('table.htCore').length;
        const resizeObserverCountAfterFirstInit = resizeObserverInstances.length;

        expect(beforeInitCount).toBe(1);
        expect(htCoreCountAfterFirstInit).toBeGreaterThan(0);
        expect(resizeObserverCountAfterFirstInit).toBeGreaterThan(0);
        // Pin the ROOT-only edge-slot observer specifically (Walkontable's own `ResizeMonitor` is created
        // on any instance, so counts alone would not prove the root branch ran).
        expect(observedTargets).toContain(core.rootSlotBottomElement);

        // Ignore any unrelated warning the first init may emit (e.g. the theme-name notice).
        warnSpy.mockClear();

        core.init();

        // The guard sits at the very top of `init()`, so `beforeInit` never fires a second time, the
        // original view is kept - no duplicate `.htCore` / overlays DOM - and the root-only edge-slot
        // `ResizeObserver` is not recreated (which would orphan the first one).
        expect(beforeInitCount).toBe(1);
        expect(container.querySelectorAll('table.htCore').length).toBe(htCoreCountAfterFirstInit);
        expect(core.view).toBe(viewAfterFirstInit);
        expect(resizeObserverInstances.length).toBe(resizeObserverCountAfterFirstInit);
        expect(warnSpy).toHaveBeenCalledTimes(1);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('already been initialized'));
      } finally {
        window.ResizeObserver = OriginalResizeObserver;
        warnSpy.mockRestore();
        core.destroy();
      }
    });

    it('should guard a re-entrant init() from `beforeInit` (flag set before any work, not after)', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const core = new Core(container, { data: [['a', 'b'], ['c', 'd']] });
      let beforeInitCount = 0;

      core.addHook('beforeInit', () => {
        beforeInitCount += 1;
        // A nested init() must hit the guard and return. If the flag were set at the END of init()
        // instead of the top, this would re-enter the whole setup and recurse until the stack overflows.
        core.init();
      });

      try {
        expect(() => core.init()).not.toThrow();
        expect(beforeInitCount).toBe(1);
        // `beforeInit` fires before the view is built, so the nested call takes the "did not finish" branch;
        // both guard messages share this phrase.
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Calling `init()` again is a no-op'));
      } finally {
        warnSpy.mockRestore();
        core.destroy();
      }
    });
  });

  describe('batch', () => {
    it.each([
      ['batch', core => [core.isRenderSuspended(), core.isExecutionSuspended()], [false, false]],
      ['batchRender', core => [core.isRenderSuspended()], [false]],
      ['batchExecution', core => [core.isExecutionSuspended()], [false]],
    ])('%s should resume after the wrapped operations throw, and rethrow', (method, probe, resumed) => {
      // Host hooks run inside the callback (`beforeLoadData`, `afterUpdateSettings`), so a throw
      // there used to leave the instance suspended for the rest of its life: it never painted again.
      const core = new Core(container, { data: [['a']] });

      core.init();

      expect(() => core[method](() => {
        throw new Error('hook failed');
      })).toThrow('hook failed');

      expect(probe(core)).toEqual(resumed);

      core.destroy();
    });

    it('should still resume rendering when resuming execution itself throws', () => {
      // `resumeExecution` fires hooks on the flush; a throw there used to replace the callback's
      // error and skip `resumeRender`, the permanent suspension through a narrower door.
      const core = new Core(container, { data: [['a']] });

      core.init();

      const original = core.resumeExecution;

      core.resumeExecution = () => {
        core.resumeExecution = original;
        original.call(core);
        throw new Error('flush failed');
      };

      expect(() => core.batch(() => 'ok')).toThrow('flush failed');
      expect(core.isRenderSuspended()).toBe(false);
      expect(core.isExecutionSuspended()).toBe(false);

      core.destroy();
    });

    it('should not force a flush when the batchExecution callback throws', () => {
      const core = new Core(container, { data: [['a']] });

      core.init();

      const resumeArgs = [];
      const original = core.resumeExecution;

      core.resumeExecution = (...args) => {
        resumeArgs.push(args);

        return original.apply(core, args);
      };

      expect(() => core.batchExecution(() => {
        throw new Error('mid-alter');
      }, true)).toThrow('mid-alter');
      expect(resumeArgs).toEqual([[false]]);

      core.batchExecution(() => {}, true);
      expect(resumeArgs).toEqual([[false], [true]]);

      core.destroy();
    });

    it('should return the callback result when it does not throw', () => {
      const core = new Core(container, { data: [['a']] });

      core.init();

      expect(core.batch(() => 42)).toBe(42);
      expect(core.isRenderSuspended()).toBe(false);
      expect(core.isExecutionSuspended()).toBe(false);

      core.destroy();
    });
  });

  describe('markCellChanged', () => {
    it('should advance the render version of a stored cell meta and create none for an unstored one', () => {
      const core = new Core(container, { data: [['a', 'b'], ['c', 'd']] });

      core.init();

      expect(core.getCellsMeta().length).toBe(0);

      // Nothing is painted from an unstored meta, so there is nothing to mark.
      core.markCellChanged(1, 1);
      expect(core.getCellsMeta().length).toBe(0);

      const cellMeta = core.getCellMeta(1, 1);

      core.markCellChanged(1, 1);
      expect(cellMeta._renderVersion).toBe(1);
      core.markCellChanged(1, 1);
      expect(cellMeta._renderVersion).toBe(2);

      core.destroy();
    });
  });

  it('should reset cache only once after initialization with an Array of Arrays data source', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
      autoRowSize: true,
      autoColumnSize: true,
      bindRowsWithHeaders: 'strict',
      columnSorting: true,
      filters: true,
      manualColumnResize: true,
      manualRowResize: true,
      trimRows: true,
      columns: [{}, {}] // Setting `columns` property at the start shouldn't update the index mappers.
    });

    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    core.rowIndexMapper.addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    core.columnIndexMapper.addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    core.init();

    expect(rowCacheUpdatedCallback.calls.count()).toEqual(1);
    expect(columnCacheUpdatedCallback.calls.count()).toEqual(1);
  });

  it('should reset cache only once after initialization with an Array of Objects data source', () => {
    const core = new Core(container, {
      data: [
        { test: 'a1', foo: 'b1' },
        { test: 'a2', foo: 'b2' }
      ],
      autoRowSize: true,
      autoColumnSize: true,
      bindRowsWithHeaders: 'strict',
      columnSorting: true,
      filters: true,
      manualColumnResize: true,
      manualRowResize: true,
      nestedRows: true,
      trimRows: true,
      columns: [{}, {}] // Setting `columns` property at the start shouldn't update the index mappers.
    });

    const rowCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');
    const columnCacheUpdatedCallback = jasmine.createSpy('cacheUpdated');

    core.rowIndexMapper.addLocalHook('cacheUpdated', rowCacheUpdatedCallback);
    core.columnIndexMapper.addLocalHook('cacheUpdated', columnCacheUpdatedCallback);

    core.init();

    expect(rowCacheUpdatedCallback.calls.count()).toEqual(1);
    expect(columnCacheUpdatedCallback.calls.count()).toEqual(1);
  });

  it('should return -1 from the rendered/visible counting methods when the instance is not initialized yet', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
    });

    expect(core.countRenderedRows()).toBe(-1);
    expect(core.countRenderedCols()).toBe(-1);
    expect(core.countVisibleRows()).toBe(-1);
    expect(core.countVisibleCols()).toBe(-1);
  });

  it('should clear the DI container collection after destroy', () => {
    const core = new Core(container, {
      data: [['a'], ['b'], ['c']],
    });

    core.init();

    const moduleRegisterer = staticRegister(core.guid);

    moduleRegisterer.register('testValue', 'test');

    expect(moduleRegisterer.getNames()).toEqual(['cellRangeMapper', 'testValue']);
    expect(resolveWithInstance(core, 'testValue')).toBe('test');

    core.destroy();

    expect(moduleRegisterer.getNames()).toEqual([]);
    expect(resolveWithInstance(core, 'testValue')).toBeUndefined();
  });

  it('should pass the index sequence change source to public cache-update hooks', () => {
    const afterRowSequenceCacheUpdate = jasmine.createSpy('afterRowSequenceCacheUpdate');
    const afterColumnSequenceCacheUpdate = jasmine.createSpy('afterColumnSequenceCacheUpdate');
    const core = new Core(container, {
      data: [['a', 'b'], ['c', 'd']],
      afterRowSequenceCacheUpdate,
      afterColumnSequenceCacheUpdate,
    });

    core.init();
    afterRowSequenceCacheUpdate.calls.reset();
    afterColumnSequenceCacheUpdate.calls.reset();

    core.rowIndexMapper.insertIndexes(1, 1);
    core.columnIndexMapper.insertIndexes(1, 1);

    expect(afterRowSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
      indexesChangeSource: 'insert',
    }));
    expect(afterColumnSequenceCacheUpdate).toHaveBeenCalledWith(jasmine.objectContaining({
      indexesChangeSource: 'insert',
    }));

    core.destroy();
  });
});

describe('Core.setDataAtCell past the last column', () => {
  let container;
  let warnSpy;

  beforeEach(() => {
    container = document.createElement('div');
    // `deprecatedWarnOnce` records printed warnings module-globally, so without this the
    // assertions below would depend on the order the specs run in.
    _resetDeprecationWarnings();
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    container.remove();
  });

  /**
   * Collects every deprecation warning printed so far that mentions the last-column write.
   *
   * @returns {Array} The matching `console.warn` messages.
   */
  function pastLastColumnWarnings() {
    return warnSpy.mock.calls
      .map(args => String(args[0]))
      .filter(message => message.includes('past the last column of an object data source'));
  }

  /**
   * Builds and initializes a grid.
   *
   * @param {object} settings The grid settings.
   * @returns {object} The initialized instance.
   */
  function build(settings) {
    const core = new Core(container, { licenseKey: 'non-commercial-and-evaluation', ...settings });

    core.init();

    return core;
  }

  it('should warn when the write lands past the last column of an object data source', () => {
    const data = [{ id: 1, name: 'Ted Right' }];
    const core = build({ data, dataSchema: { id: null, name: null } });

    core.setDataAtCell(0, 2, 'x');

    const warnings = pastLastColumnWarnings();

    expect(warnings).toHaveLength(1);
    expect(warnings[0]).toContain('20.0.0');
    expect(warnings[0]).toContain('setDataAtRowProp()');
    // The write still stands while the behavior is only deprecated.
    expect(data[0]).toEqual({ 2: 'x', id: 1, name: 'Ted Right' });

    core.destroy();
  });

  it('should warn for a `dataSchema` given as a function, which is object-rowed too', () => {
    const data = [{ id: 1, name: 'Ted Right' }];
    const core = build({ data, dataSchema: () => ({ id: null, name: null }) });

    core.setDataAtCell(0, 2, 'x');

    // A function `dataSchema` sets `dataType` to 'function', not 'object'. It is just as unable to
    // gain a column, so a predicate naming only 'object' would leave this case writing the key.
    expect(core.dataType).toBe('function');
    expect(pastLastColumnWarnings()).toHaveLength(1);

    core.destroy();
  });

  it('should warn only once across repeated writes', () => {
    const core = build({
      data: [{ id: 1, name: 'Ted Right' }],
      dataSchema: { id: null, name: null },
    });

    core.setDataAtCell(0, 2, 'x');
    core.setDataAtCell(0, 3, 'y');

    expect(pastLastColumnWarnings()).toHaveLength(1);

    core.destroy();
  });

  it('should not warn for an array data source, which can grow a column', () => {
    const core = build({ data: [['A1', 'B1']] });

    core.setDataAtCell(0, 2, 'x');

    expect(pastLastColumnWarnings()).toHaveLength(0);
    expect(core.countCols()).toBe(3);

    core.destroy();
  });

  it('should not warn for an array data source that sets the `columns` option', () => {
    const core = build({ data: [['A1', 'B1']], columns: [{}, {}] });

    core.setDataAtCell(0, 2, 'x');

    // No column is created here either, but the row is an array, so the index names a real array
    // slot rather than a property no schema declared. Nothing is deprecated.
    expect(pastLastColumnWarnings()).toHaveLength(0);

    core.destroy();
  });

  it('should not warn for a grid that declares no columns at all', () => {
    const core = build({ data: [] });

    core.setDataAtCell(0, 0, 'WRITE');

    // An empty `data: []` is duck-typed to 'object' because there is no `data[0]` to inspect, and
    // `countCols()` is 0 - so every index is "past the last column". Writing to such a grid is how
    // an empty dataset gets bootstrapped, and it is deliberately left alone.
    expect(core.dataType).toBe('object');
    expect(pastLastColumnWarnings()).toHaveLength(0);
    expect(core.getDataAtCell(0, 0)).toBe('WRITE');

    core.destroy();
  });
});
