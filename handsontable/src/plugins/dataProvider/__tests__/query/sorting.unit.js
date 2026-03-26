import { PLUGIN_KEY as COLUMN_SORTING_PLUGIN_KEY } from '../../../columnSorting';
import {
  applyColumnSortToQueryFromPlugin,
  applyColumnSortingToQueryParameters,
  handleBeforeColumnSortForServer,
  normalizeSortInFetchParams,
  normalizeSortToQueryFormat,
  querySortToPluginSort,
  sortingPayloadToSort,
  syncColumnSortingFromQuerySort,
} from '../../query/sorting';

describe('dataProvider sorting', () => {
  describe('applyColumnSortingToQueryParameters', () => {
    const colToProp = col => (`col_${col}`);

    it('should set sort with prop from first array entry', () => {
      const query = { sort: null };
      const plugin = {
        enabled: true,
        getSortConfig: () => [{ column: 1, sortOrder: 'asc' }],
      };

      applyColumnSortingToQueryParameters(plugin, query, colToProp);

      expect(query.sort).toEqual({ prop: 'col_1', order: 'asc' });
    });

    it('should set sort with prop from object when array is empty', () => {
      const query = { sort: null };
      const plugin = {
        enabled: true,
        getSortConfig: () => ({ column: 2, sortOrder: 'desc' }),
      };

      applyColumnSortingToQueryParameters(plugin, query, colToProp);

      expect(query.sort).toEqual({ prop: 'col_2', order: 'desc' });
    });

    it('should no-op when sorting disabled or colToProp missing', () => {
      const query = { sort: null };

      applyColumnSortingToQueryParameters({ enabled: false, getSortConfig: () => [{ column: 0 }] }, query, colToProp);
      expect(query.sort).toBeNull();

      applyColumnSortingToQueryParameters(
        { enabled: true, getSortConfig: () => [{ column: 0, sortOrder: 'asc' }] },
        query,
        undefined
      );
      expect(query.sort).toBeNull();
    });
  });

  describe('normalizeSortToQueryFormat', () => {
    const colToProp = col => (`col_${col}`);

    it('should return null for null or non-object sort', () => {
      expect(normalizeSortToQueryFormat(null, colToProp)).toBeNull();
      expect(normalizeSortToQueryFormat(undefined, colToProp)).toBeNull();
      expect(normalizeSortToQueryFormat('asc', colToProp)).toBeNull();
    });

    it('should convert plugin format (column index) to query format (prop)', () => {
      expect(normalizeSortToQueryFormat(
        { column: 1, sortOrder: 'asc' },
        colToProp
      )).toEqual({ prop: 'col_1', order: 'asc' });

      expect(normalizeSortToQueryFormat(
        { column: 0, sortOrder: 'desc' },
        colToProp
      )).toEqual({ prop: 'col_0', order: 'desc' });
    });

    it('should return query format unchanged when prop and order present', () => {
      const sort = { prop: 'name', order: 'asc' };

      expect(normalizeSortToQueryFormat(sort, colToProp)).toEqual({ prop: 'name', order: 'asc' });
    });

    it('should accept sortOrder as alias for order when prop is set', () => {
      expect(normalizeSortToQueryFormat(
        { prop: 'name', sortOrder: 'desc' },
        colToProp
      )).toEqual({ prop: 'name', order: 'desc' });
    });

    it('should return null when colToProp missing for column-index format', () => {
      expect(normalizeSortToQueryFormat(
        { column: 0, sortOrder: 'asc' },
        undefined
      )).toBeNull();
    });

    it('should return null when sort has no valid column or prop', () => {
      expect(normalizeSortToQueryFormat({ order: 'asc' }, colToProp)).toBeNull();
      expect(normalizeSortToQueryFormat({ prop: 'x' }, colToProp)).toBeNull();
    });
  });

  describe('querySortToPluginSort', () => {
    const propToCol = (prop) => {
      if (prop === 'name') {
        return 1;
      }
      if (prop === 'id') {
        return 0;
      }

      return -1;
    };

    it('should return null for null or invalid sort', () => {
      expect(querySortToPluginSort(null, propToCol)).toBeNull();
      expect(querySortToPluginSort(undefined, propToCol)).toBeNull();
      expect(querySortToPluginSort({ prop: 'name' }, propToCol)).toBeNull();
      expect(querySortToPluginSort({ order: 'asc' }, propToCol)).toBeNull();
    });

    it('should convert query format to plugin format (column index)', () => {
      expect(querySortToPluginSort(
        { prop: 'name', order: 'asc' },
        propToCol
      )).toEqual({ column: 1, sortOrder: 'asc' });

      expect(querySortToPluginSort(
        { prop: 'id', order: 'desc' },
        propToCol
      )).toEqual({ column: 0, sortOrder: 'desc' });
    });

    it('should return null when propToCol missing', () => {
      expect(querySortToPluginSort(
        { prop: 'name', order: 'asc' },
        undefined
      )).toBeNull();
    });

    it('should return null when propToCol returns non-number', () => {
      const propToColStub = () => undefined;

      expect(querySortToPluginSort(
        { prop: 'unknown', order: 'asc' },
        propToColStub
      )).toBeNull();
    });
  });

  describe('syncColumnSortingFromQuerySort', () => {
    it('should pass sort object to setSortConfig', () => {
      const calls = [];
      const plugin = {
        enabled: true,
        setSortConfig: c => calls.push(c),
      };

      syncColumnSortingFromQuerySort(plugin, { column: 0, sortOrder: 'asc' });

      expect(calls).toEqual([{ column: 0, sortOrder: 'asc' }]);
    });

    it('should clear with empty array when sort is null', () => {
      const calls = [];
      const plugin = {
        enabled: true,
        setSortConfig: c => calls.push(c),
      };

      syncColumnSortingFromQuerySort(plugin, null);

      expect(calls).toEqual([[]]);
    });

    it('should no-op when plugin disabled', () => {
      const plugin = {
        enabled: false,
        setSortConfig: jest.fn(),
      };

      syncColumnSortingFromQuerySort(plugin, { column: 0 });

      expect(plugin.setSortConfig).not.toHaveBeenCalled();
    });
  });

  describe('applyColumnSortToQueryFromPlugin', () => {
    it('should write query sort from ColumnSorting plugin state', () => {
      const queryParameters = { sort: null };
      const hot = {
        getPlugin: key => (key === COLUMN_SORTING_PLUGIN_KEY ? {
          enabled: true,
          getSortConfig: () => [{ column: 1, sortOrder: 'asc' }],
        } : null),
        colToProp: col => (`c${col}`),
      };

      applyColumnSortToQueryFromPlugin(hot, queryParameters);

      expect(queryParameters.sort).toEqual({ prop: 'c1', order: 'asc' });
    });
  });

  describe('normalizeSortInFetchParams', () => {
    it('should normalize plugin-format sort in params using hot.colToProp', () => {
      const params = { sort: { column: 0, sortOrder: 'desc' } };
      const hot = { colToProp: col => (col === 0 ? 'id' : 'x') };

      normalizeSortInFetchParams(params, hot);

      expect(params.sort).toEqual({ prop: 'id', order: 'desc' });
    });
  });

  describe('sortingPayloadToSort', () => {
    it('should map prop keys back to a ColumnSorting config object', () => {
      const hot = {
        propToCol: prop => (prop === 'name' ? 2 : 0),
      };

      expect(sortingPayloadToSort(hot, { prop: 'name', order: 'asc' })).toEqual({
        column: 2,
        sortOrder: 'asc',
      });
    });

    it('should return [] for null, undefined, or invalid payload', () => {
      const hot = { propToCol: () => 0 };

      expect(sortingPayloadToSort(hot, null)).toEqual([]);
      expect(sortingPayloadToSort(hot, undefined)).toEqual([]);
      expect(sortingPayloadToSort(hot, { prop: 'x' })).toEqual([]);
    });

    it('should round-trip with applyColumnSortToQueryFromPlugin', () => {
      const queryParameters = { sort: null };
      const hot = {
        getPlugin: key => (key === COLUMN_SORTING_PLUGIN_KEY ? {
          enabled: true,
          getSortConfig: () => [{ column: 1, sortOrder: 'desc' }],
        } : null),
        colToProp: col => (col === 1 ? 'name' : 'id'),
        propToCol: prop => (prop === 'name' ? 1 : 0),
      };

      applyColumnSortToQueryFromPlugin(hot, queryParameters);

      expect(sortingPayloadToSort(hot, queryParameters.sort)).toEqual({
        column: 1,
        sortOrder: 'desc',
      });
    });
  });

  describe('handleBeforeColumnSortForServer', () => {
    it('should apply destination sort, refresh query, fetch, and return false', () => {
      const setSortConfig = jest.fn();
      const applyQueryParametersFromPlugins = jest.fn();
      const fetchData = jest.fn().mockResolvedValue(undefined);
      const hot = {
        getPlugin: key => (key === COLUMN_SORTING_PLUGIN_KEY ? {
          setSortConfig,
        } : null),
      };
      const ctx = {
        hot,
        isEnabled: () => true,
        hasFetchFn: () => true,
        applyQueryParametersFromPlugins,
        fetchData,
      };
      const dest = [{ column: 0, sortOrder: 'asc' }];

      const out = handleBeforeColumnSortForServer(ctx, [], dest, true);

      expect(out).toBe(false);
      expect(setSortConfig).toHaveBeenCalledWith(dest);
      expect(applyQueryParametersFromPlugins).toHaveBeenCalled();
      expect(fetchData).toHaveBeenCalledWith({ skipLoading: true });
    });

    it('should no-op when sort is not possible', () => {
      const ctx = {
        hot: { getPlugin: () => ({ setSortConfig: jest.fn() }) },
        isEnabled: () => true,
        hasFetchFn: () => true,
        applyQueryParametersFromPlugins: jest.fn(),
        fetchData: jest.fn(),
      };

      handleBeforeColumnSortForServer(ctx, [], [], false);

      expect(ctx.applyQueryParametersFromPlugins).not.toHaveBeenCalled();
      expect(ctx.fetchData).not.toHaveBeenCalled();
    });
  });
});
