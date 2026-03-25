import { PLUGIN_KEY as COLUMN_SORTING_PLUGIN_KEY } from '../../../columnSorting';
import {
  applyColumnSortToQueryFromPlugin,
  handleBeforeColumnSortForServer,
  normalizeSortInFetchParams,
  sortingPayloadToSort,
} from '../../query/sorting';

describe('dataProvider sorting', () => {
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
