import Handsontable from '../../../base';
import { registerPlugin } from '../../registry';
import { DataProvider } from '../dataProvider';
import { ColumnSorting } from '../../columnSorting/columnSorting';
import { Notification } from '../../notification/notification';
import { Pagination } from '../../pagination/pagination';
import { Filters } from '../../filters/filters';
import { EmptyDataState } from '../../emptyDataState/emptyDataState';
import { DropdownMenu } from '../../dropdownMenu/dropdownMenu';
import { HiddenRows } from '../../hiddenRows/hiddenRows';
import { AutoColumnSize } from '../../autoColumnSize/autoColumnSize';
import { registerCellType } from '../../../cellTypes/registry';
import { CheckboxCellType } from '../../../cellTypes/checkboxType/checkboxType';

const flush = () => new Promise(resolve => queueMicrotask(resolve));

/**
 * Lets every queued microtask chain (the mutation queue, validation, fetch landing) run to its end.
 *
 * @returns {Promise<void>}
 */
async function settle() {
  for (let i = 0; i < 20; i++) {
    await flush();
  }
}

/**
 * @returns {object} A `dataProvider` config whose `fetchRows` calls and mutations wait until the test settles them.
 */
function createDeferredProvider() {
  const pending = [];
  const mutations = [];
  const parkMutation = () => new Promise((resolve, reject) => mutations.push({ resolve, reject }));
  const config = {
    rowId: 'id',
    fetchRows: jest.fn((queryParameters, { signal }) => new Promise((resolve, reject) => {
      pending.push({ queryParameters, resolve, reject });
      signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
    })),
    onRowsCreate: jest.fn(parkMutation),
    onRowsUpdate: jest.fn(parkMutation),
    onRowsRemove: jest.fn(parkMutation),
  };

  return {
    config,
    pending,
    lastQuery: () => config.fetchRows.mock.calls.at(-1)[0],
    async settleLast(rows, totalRows = rows.length) {
      pending.pop().resolve({ rows, totalRows });
      await settle();
    },
    async failLast(error) {
      pending.pop().reject(error);
      await settle();
    },
    async settleMutation() {
      mutations.shift().resolve();
      await settle();
    },
    async failMutation(error) {
      mutations.shift().reject(error);
      await settle();
    },
  };
}

/**
 * @param {object} initial The context the owner reports first.
 * @returns {object} A context owner the test switches by assigning `current`.
 */
function createOwner(initial) {
  return {
    current: initial,
    getContext() {
      return this.current;
    },
    onDetachedRequest: jest.fn(),
    onShownResponse: jest.fn(),
  };
}

describe('DataProvider context owner contract', () => {
  let container;
  let hot;

  beforeAll(() => {
    registerPlugin(DataProvider);
    registerPlugin(ColumnSorting);
    registerPlugin(Notification);
    registerPlugin(Pagination);
    registerPlugin(Filters);
    registerPlugin(EmptyDataState);
    registerPlugin(DropdownMenu);
    registerPlugin(HiddenRows);
    registerPlugin(AutoColumnSize);
    registerCellType(CheckboxCellType);
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    hot?.destroy();
    hot = null;
    container.remove();
    jest.restoreAllMocks();
  });

  /**
   * @param {object} provider The deferred provider.
   * @param {object} [options] Options.
   * @param {object} [options.owner] A context owner to register once the first fetch has landed.
   * @param {object} [options.settings] Extra settings.
   * @returns {Promise<void>}
   */
  async function createGrid(provider, { owner, settings = {} } = {}) {
    hot = new Handsontable(container, {
      columns: [{ data: 'id' }, { data: 'name' }],
      dataProvider: provider.config,
      licenseKey: 'non-commercial-and-evaluation',
      ...settings,
    });

    await provider.settleLast([{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]);

    if (owner) {
      hot.getPlugin('dataProvider')._setContextOwner(owner);
    }
  }

  describe('_runWithoutFetching()', () => {
    it('applies a new dataProvider without a refetch while the callback runs', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const next = createDeferredProvider();

      hot.getPlugin('dataProvider')._runWithoutFetching(() => hot.updateSettings({ dataProvider: next.config }));

      expect(next.config.fetchRows).not.toHaveBeenCalled();
      expect(hot.getSettings().dataProvider).toBe(next.config);
    });

    it('returns the callback\'s value', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      expect(hot.getPlugin('dataProvider')._runWithoutFetching(() => 42)).toBe(42);
    });

    it('leaves the passive state when the callback throws', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const plugin = hot.getPlugin('dataProvider');

      expect(() => plugin._runWithoutFetching(() => {
        throw new Error('switch failed');
      })).toThrowError('switch failed');

      const next = createDeferredProvider();

      hot.updateSettings({ dataProvider: next.config });

      expect(next.config.fetchRows).toHaveBeenCalledTimes(1);
    });

    it('stays passive until the outermost of nested calls returns', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const plugin = hot.getPlugin('dataProvider');
      const inner = createDeferredProvider();
      const outer = createDeferredProvider();

      plugin._runWithoutFetching(() => {
        plugin._runWithoutFetching(() => hot.updateSettings({ dataProvider: inner.config }));
        hot.updateSettings({ dataProvider: outer.config });
      });

      expect(inner.config.fetchRows).not.toHaveBeenCalled();
      expect(outer.config.fetchRows).not.toHaveBeenCalled();

      hot.updateSettings({ dataProvider: inner.config });

      expect(inner.config.fetchRows).toHaveBeenCalledTimes(1);
    });

    it('keeps a running fetch alive and takes over its query when the plugin is re-enabled', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const plugin = hot.getPlugin('dataProvider');

      void plugin.fetchData({ page: 3 });

      plugin._runWithoutFetching(() => hot.updateSettings({ dataProvider: { ...provider.config } }));

      expect(provider.pending).toHaveLength(1);
      expect(plugin.getQueryParameters().page).toBe(3);
    });

    it('cancels applying a sort or a filter and runs a clear locally, without fetching', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: { columnSorting: true } });

      const plugin = hot.getPlugin('dataProvider');
      const setSortConfig = jest.spyOn(hot.getPlugin('columnSorting'), 'setSortConfig');
      const answers = plugin._runWithoutFetching(() => ({
        sort: hot.runHooks('beforeColumnSort', [], [{ column: 0, sortOrder: 'asc' }], true),
        sortClear: hot.runHooks('beforeColumnSort', [{ column: 0, sortOrder: 'asc' }], [], true),
        filter: hot.runHooks('beforeFilter', [{ column: 0, operation: 'conjunction', conditions: [] }]),
        filterClear: hot.runHooks('beforeFilter', []),
      }));

      expect(answers.sort).toBe(false);
      expect(answers.sortClear).toBe(false);
      expect(answers.filter).toBe(false);
      expect(answers.filterClear).not.toBe(false);
      expect(setSortConfig).toHaveBeenCalledWith([]);
      expect(provider.config.fetchRows).toHaveBeenCalledTimes(1);
    });
  });

  describe('_runContextChange()', () => {
    const viewSettings = { pagination: { pageSize: 5 }, filters: true, emptyDataState: true };

    it('resets the pager total before the change, and syncs the overlay and the filter rollback after it', async() => {
      const provider = createDeferredProvider();
      const owner = createOwner({ name: 'first' });

      await createGrid(provider, { owner, settings: viewSettings });

      const calls = [];

      jest.spyOn(Pagination.prototype, '_resetDataProviderTotal').mockImplementation(() => calls.push('total'));
      jest.spyOn(EmptyDataState.prototype, '_syncDataProviderLoading')
        .mockImplementation(isLoading => calls.push(`loading:${isLoading}`));
      jest.spyOn(Filters.prototype, '_resetDataProviderRollback').mockImplementation(() => calls.push('rollback'));

      const result = hot.getPlugin('dataProvider')._runContextChange(() => {
        calls.push('change');
        owner.current = { name: 'second' };

        return 'done';
      });

      expect(result).toBe('done');
      expect(calls).toEqual(['total', 'change', 'loading:false', 'rollback']);
    });

    it('reports loading after the change when the arriving context still has a fetch in flight', async() => {
      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner, settings: viewSettings });

      const plugin = hot.getPlugin('dataProvider');
      const sync = jest.spyOn(EmptyDataState.prototype, '_syncDataProviderLoading');

      void plugin.fetchData();
      plugin._runContextChange(() => {
        owner.current = { name: 'second' };
      });
      plugin._runContextChange(() => {
        owner.current = first;
      });

      expect(sync.mock.calls).toEqual([[false], [true]]);
    });

    it('still syncs the plugins and leaves the passive state when the change throws', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: viewSettings });

      const rollback = jest.spyOn(Filters.prototype, '_resetDataProviderRollback');
      const plugin = hot.getPlugin('dataProvider');

      expect(() => plugin._runContextChange(() => {
        throw new Error('switch failed');
      })).toThrowError('switch failed');
      expect(rollback).toHaveBeenCalledTimes(1);

      const next = createDeferredProvider();

      hot.updateSettings({ dataProvider: next.config });

      expect(next.config.fetchRows).toHaveBeenCalledTimes(1);
    });

    it('makes the replayed conditions the filter rollback target after _restoreFetchResult()', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: viewSettings });

      const rollback = jest.spyOn(Filters.prototype, '_resetDataProviderRollback');

      hot.getPlugin('dataProvider')._restoreFetchResult({ totalRows: 2, queryParameters: undefined });

      expect(rollback).toHaveBeenCalledTimes(1);
    });
  });

  describe('per-view entry points of the driven plugins', () => {
    it('forget the server total and show and hide the loading overlay', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: { pagination: { pageSize: 1 }, filters: true, emptyDataState: true } });
      void hot.getPlugin('dataProvider').fetchData();
      await provider.settleLast([{ id: 'a' }], 40);

      const pagination = hot.getPlugin('pagination');
      const emptyDataState = hot.getPlugin('emptyDataState');

      expect(pagination.getPaginationData().totalPages).toBe(40);

      pagination._resetDataProviderTotal();
      pagination.setPage(1);

      expect(pagination.getPaginationData().totalPages).toBe(1);

      emptyDataState._syncDataProviderLoading(true);

      expect(emptyDataState.isVisible()).toBe(true);

      emptyDataState._syncDataProviderLoading(false);

      expect(emptyDataState.isVisible()).toBe(false);
    });

    it('make the conditions on screen the ones a failed server filter fetch rolls back to', async() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const provider = createDeferredProvider();

      await createGrid(provider, { settings: { filters: true } });

      const filters = hot.getPlugin('filters');

      filters.addCondition(0, 'contains', ['a']);
      filters.filter();

      const onScreen = filters.exportConditions();

      filters._resetDataProviderRollback();
      await provider.failLast(new Error('offline'));

      expect(onScreen).toHaveLength(1);
      expect(filters.exportConditions()).toEqual(onScreen);
    });

    it('leave a disabled EmptyDataState hidden', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const emptyDataState = hot.getPlugin('emptyDataState');

      expect(() => emptyDataState._syncDataProviderLoading(true)).not.toThrow();
      expect(emptyDataState.isVisible()).toBe(false);
    });

    it('leave a disabled EmptyDataState alone on a context change with a fetch in flight', async() => {
      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner });

      const plugin = hot.getPlugin('dataProvider');

      void plugin.fetchData();

      expect(() => plugin._runContextChange(() => {
        owner.current = first;
      })).not.toThrow();
      expect(hot.getPlugin('emptyDataState').isVisible()).toBe(false);
    });
  });

  describe('contexts', () => {
    it('hands a response for a context the grid no longer shows to the owner, and loads nothing', async() => {
      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner });

      const loaded = jest.fn();

      hot.addHook('afterDataProviderFetch', loaded);
      void hot.getPlugin('dataProvider').fetchData();
      owner.current = { name: 'second' };
      await provider.settleLast([{ id: 'late' }]);

      expect(loaded).not.toHaveBeenCalled();
      expect(owner.onDetachedRequest).toHaveBeenCalledTimes(1);
      expect(owner.onDetachedRequest.mock.calls[0][0]).toBe('fetch');
      expect(owner.onDetachedRequest.mock.calls[0][1].result).toEqual(jasmine.objectContaining({
        rows: [{ id: 'late' }],
        totalRows: 1,
        queryParameters: jasmine.objectContaining({ page: 1 }),
      }));
      expect(owner.onDetachedRequest.mock.calls[0][2]).toBe(first);
      expect(hot.getDataAtCol(0)).toEqual(['a', 'b']);
    });

    it('supersedes only a fetch of the same context', async() => {
      const provider = createDeferredProvider();
      const owner = createOwner({ name: 'first' });

      await createGrid(provider, { owner });

      const aborted = jest.fn();

      hot.addHook('afterDataProviderFetchAbort', aborted);

      const plugin = hot.getPlugin('dataProvider');

      void plugin.fetchData();
      owner.current = { name: 'second' };
      void plugin.fetchData();
      await settle();

      expect(aborted).not.toHaveBeenCalled();

      void plugin.fetchData();
      await settle();

      expect(aborted).toHaveBeenCalledTimes(1);
    });

    it('resolves an off-context failure, passes isVisible as false, and hands the failure to the owner', async() => {
      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner, settings: { notification: true } });

      const fetchError = jest.fn();
      const showMessage = jest.spyOn(hot.getPlugin('notification'), 'showMessage');

      hot.addHook('afterDataProviderFetchError', fetchError);

      const request = hot.getPlugin('dataProvider').fetchData();
      const error = new Error('offline');

      owner.current = { name: 'second' };
      await provider.failLast(error);

      await expect(request).resolves.toBeNull();
      expect(fetchError.mock.calls[0][0]).toBe(error);
      expect(fetchError.mock.calls[0][2]).toBe(false);
      expect(owner.onDetachedRequest).toHaveBeenCalledWith('fetch', { error }, first);
      expect(showMessage).not.toHaveBeenCalled();
    });

    it('passes the two base arguments and shows the toast for a failure without an owner', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: { notification: true } });

      const fetchError = jest.fn();
      const showMessage = jest.spyOn(hot.getPlugin('notification'), 'showMessage');

      hot.addHook('afterDataProviderFetchError', fetchError);

      const request = hot.getPlugin('dataProvider').fetchData();
      const error = new Error('offline');

      await provider.failLast(error);

      await expect(request).rejects.toBe(error);
      expect(fetchError.mock.calls[0]).toHaveLength(2);
      expect(showMessage).toHaveBeenCalledTimes(1);
    });
  });

  describe('mutations of a context the grid no longer shows', () => {
    it('refetch with the query the update was queued with, and hand the result to the owner', async() => {
      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner });

      const plugin = hot.getPlugin('dataProvider');

      void plugin.fetchData({ page: 3 });
      await provider.settleLast([{ id: 'c', name: 'C' }], 100);
      hot.setDataAtCell(0, 1, 'edited');
      await settle();

      owner.current = { name: 'second' };
      void plugin.fetchData({ page: 5 });
      await provider.settleLast([{ id: 'z', name: 'Z' }], 100);
      await provider.settleMutation();

      expect(provider.lastQuery().page).toBe(3);

      await provider.settleLast([{ id: 'c', name: 'saved' }], 100);

      expect(owner.onDetachedRequest).toHaveBeenLastCalledWith('fetch', {
        result: jasmine.objectContaining({ rows: [{ id: 'c', name: 'saved' }] }),
      }, first);
      expect(hot.getDataAtCell(0, 1)).toBe('Z');
    });

    it('reload their context instead of reverting cells when an update fails', async() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner });

      const plugin = hot.getPlugin('dataProvider');

      hot.setDataAtCell(0, 1, 'edited');
      await settle();
      owner.current = { name: 'second' };
      void plugin.fetchData();
      await provider.settleLast([{ id: 'z', name: 'Z' }]);

      const fetchesBefore = provider.config.fetchRows.mock.calls.length;
      const error = new Error('rejected');

      await provider.failMutation(error);

      expect(hot.getDataAtCell(0, 1)).toBe('Z');
      expect(owner.onDetachedRequest).toHaveBeenCalledWith('update', { error }, first);
      expect(provider.config.fetchRows.mock.calls.length).toBe(fetchesBefore + 1);
    });

    it('decide a remove\'s page fallback from the page and row count captured at queue time', async() => {
      const provider = createDeferredProvider();
      const owner = createOwner({ name: 'first' });

      await createGrid(provider, { owner });

      const plugin = hot.getPlugin('dataProvider');

      void plugin.fetchData({ page: 2 });
      await provider.settleLast([{ id: 'c' }, { id: 'd' }], 100);
      void plugin.removeRows(['c', 'd']);
      await settle();

      owner.current = { name: 'second' };
      void plugin.fetchData({ page: 5 });
      await provider.settleLast([{ id: 'z' }], 100);
      await provider.settleMutation();

      expect(provider.lastQuery().page).toBe(1);
    });

    it('drop the refetch, the revert, and the report once their context is released', async() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner });

      const plugin = hot.getPlugin('dataProvider');
      const mutationError = jest.fn();

      hot.addHook('afterRowsMutationError', mutationError);
      hot.setDataAtCell(0, 1, 'edited');
      await settle();
      owner.current = { name: 'second' };
      plugin._releaseContext(first);

      const fetchesBefore = provider.config.fetchRows.mock.calls.length;

      await provider.failMutation(new Error('rejected'));

      expect(mutationError).toHaveBeenCalledTimes(1);
      expect(provider.config.fetchRows.mock.calls.length).toBe(fetchesBefore);
      expect(owner.onDetachedRequest).not.toHaveBeenCalled();
    });

    it('drop a default-context update still pending when an owner shows a context of its own', async() => {
      jest.spyOn(console, 'error').mockImplementation(() => {});

      const provider = createDeferredProvider();

      await createGrid(provider);

      const mutationError = jest.fn();

      hot.addHook('afterRowsMutationError', mutationError);
      hot.setDataAtCell(0, 1, 'edited');
      await settle();

      const owner = createOwner({ name: 'sheet' });

      hot.getPlugin('dataProvider')._setContextOwner(owner);

      const fetchesBefore = provider.config.fetchRows.mock.calls.length;

      await provider.failMutation(new Error('rejected'));

      expect(mutationError).toHaveBeenCalledTimes(1);
      expect(hot.getDataAtCell(0, 1)).toBe('edited');
      expect(provider.config.fetchRows.mock.calls.length).toBe(fetchesBefore);
      expect(owner.onDetachedRequest).not.toHaveBeenCalled();
    });
  });

  describe('destroying the grid while a mutation is running', () => {
    const updateA = [{ id: 'a', changes: { name: 'X' } }];
    const cases = [
      ['a successful edit', async(provider) => {
        hot.setDataAtCell(0, 1, 'edited');
        await settle();

        return { finish: () => provider.settleMutation() };
      }],
      ['a failed edit', async(provider) => {
        hot.setDataAtCell(0, 1, 'edited');
        await settle();

        return { finish: () => provider.failMutation(new Error('rejected')) };
      }],
      ['an edit queued behind another mutation', async(provider, plugin) => {
        const first = plugin.removeRows(['b']);

        await settle();
        hot.setDataAtCell(0, 1, 'edited');
        await settle();

        return { finish: () => provider.settleMutation(), outcome: first };
      }],
      ['a create', async(provider, plugin) => {
        const outcome = plugin.createRows({ position: 'below', referenceRowId: 'a' });

        await settle();

        return { finish: () => provider.settleMutation(), outcome };
      }],
      ['a remove', async(provider, plugin) => {
        const outcome = plugin.removeRows(['a']);

        await settle();

        return { finish: () => provider.settleMutation(), outcome };
      }],
      ['a successful updateRows()', async(provider, plugin) => {
        const outcome = plugin.updateRows(updateA);

        await settle();

        return { finish: () => provider.settleMutation(), outcome };
      }],
      ['a failed updateRows()', async(provider, plugin) => {
        const outcome = plugin.updateRows(updateA);

        await settle();

        return { finish: () => provider.failMutation(new Error('rejected')), outcome };
      }],
      ['an updateRows() queued behind another mutation', async(provider, plugin) => {
        void plugin.removeRows(['b']);
        await settle();

        const outcome = plugin.updateRows(updateA);

        await settle();

        return { finish: () => provider.settleMutation(), outcome };
      }],
    ];

    cases.forEach(([name, start]) => {
      it(`settles ${name} without errors`, async() => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        const provider = createDeferredProvider();

        await createGrid(provider);

        const { finish, outcome } = await start(provider, hot.getPlugin('dataProvider'));
        const settled = outcome?.then(() => 'resolved', error => error);
        const destroyed = hot;

        hot.destroy();
        hot = null;

        const postMortemCalls = [jest.spyOn(destroyed, 'runHooks'), jest.spyOn(destroyed, 'render')];

        await finish();
        await settle();
        await new Promise(resolve => setTimeout(resolve, 0));

        if (settled) {
          expect(await settled).toBe('resolved');
        }

        expect(provider.config.onRowsUpdate.mock.calls.length + provider.config.onRowsCreate.mock.calls.length
          + provider.config.onRowsRemove.mock.calls.length).toBe(1);
        expect(postMortemCalls.map(spy => spy.mock.calls.length)).toEqual([0, 0]);
        const unexpectedErrors = errorSpy.mock.calls.flat()
          .filter(arg => arg instanceof Error && arg.message !== 'rejected');

        expect(unexpectedErrors).toEqual([]);
      });
    });
  });

  describe('_releaseContext()', () => {
    it('aborts the context\'s fetch and drops its response', async() => {
      const provider = createDeferredProvider();
      const first = { name: 'first' };
      const owner = createOwner(first);

      await createGrid(provider, { owner });

      const aborted = jest.fn();

      hot.addHook('afterDataProviderFetchAbort', aborted);

      const plugin = hot.getPlugin('dataProvider');

      void plugin.fetchData();
      owner.current = { name: 'second' };
      plugin._releaseContext(first);
      await settle();

      expect(aborted).toHaveBeenCalledTimes(1);
      expect(owner.onDetachedRequest).not.toHaveBeenCalled();
    });

    it('keeps the default context usable after releasing it', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const plugin = hot.getPlugin('dataProvider');

      plugin._releaseContext(null);

      void plugin.fetchData();
      await provider.settleLast([{ id: 'after' }]);

      expect(hot.getDataAtCol(0)).toEqual(['after']);
    });
  });

  describe('_restoreFetchResult()', () => {
    it('makes the response\'s query current and replays it, marked as restored, with the grid\'s rows', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const loaded = jest.fn();

      hot.addHook('afterDataProviderFetch', loaded);

      const queryParameters = { page: 2, pageSize: 5, sort: { prop: 'id', order: 'desc' }, filters: null };

      hot.getPlugin('dataProvider')._restoreFetchResult({ rows: [{ id: 'ignored' }], totalRows: 12, queryParameters });

      expect(provider.config.fetchRows).toHaveBeenCalledTimes(1);
      expect(hot.getPlugin('dataProvider').getQueryParameters()).toEqual(queryParameters);
      expect(loaded).toHaveBeenCalledTimes(1);
      expect(loaded.mock.calls[0][0]).toEqual(jasmine.objectContaining({
        rows: [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }],
        totalRows: 12,
        queryParameters,
        columnSortConfig: { column: 0, sortOrder: 'desc' },
        isRestored: true,
      }));
    });

    it('does nothing while the plugin is disabled', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);
      hot.updateSettings({ dataProvider: null });

      const loaded = jest.fn();

      hot.addHook('afterDataProviderFetch', loaded);
      hot.getPlugin('dataProvider')._restoreFetchResult({ totalRows: 3, queryParameters: undefined });

      expect(loaded).not.toHaveBeenCalled();
    });

    it('leaves a network response without the restored marker', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      const loaded = jest.fn();

      hot.addHook('afterDataProviderFetch', loaded);
      void hot.getPlugin('dataProvider').fetchData();
      await provider.settleLast([{ id: 'x' }]);

      expect('isRestored' in loaded.mock.calls[0][0]).toBe(false);
    });
  });

  describe('_showRequestError()', () => {
    it('does nothing without the Notification plugin', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider);

      expect(() => hot.getPlugin('dataProvider')._showRequestError('update', new Error('failed'))).not.toThrow();
    });

    it('shows a fetch error with a Refetch action that fetches again', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: { notification: true } });

      const notification = hot.getPlugin('notification');
      const showMessage = jest.spyOn(notification, 'showMessage');
      const hide = jest.spyOn(notification, 'hide');

      hot.getPlugin('dataProvider')._showRequestError('fetch', new Error('offline'));

      const options = showMessage.mock.calls[0][0];

      expect(options.variant).toBe('error');
      expect(options.duration).toBe(0);
      expect(options.actions).toHaveLength(1);

      options.actions[0].callback();

      expect(hide).toHaveBeenCalledWith(showMessage.mock.results[0].value);
      expect(provider.config.fetchRows).toHaveBeenCalledTimes(2);
    });

    it('shows a mutation error without actions', async() => {
      const provider = createDeferredProvider();

      await createGrid(provider, { settings: { notification: true } });

      const showMessage = jest.spyOn(hot.getPlugin('notification'), 'showMessage');

      hot.getPlugin('dataProvider')._showRequestError('remove', new Error('rejected'));

      expect(showMessage.mock.calls[0][0].actions).toBeUndefined();
    });
  });
});
