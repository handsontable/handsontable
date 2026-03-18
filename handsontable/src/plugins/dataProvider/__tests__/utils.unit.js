import {
  applyColumnSortingToQueryParameters,
  applyPaginationToQueryParameters,
  DATA_PROVIDER_INCOMPATIBLE_ENTRIES,
  disablePluginsIncompatibleWithDataProvider,
  normalizeExternalPaginationPageSize,
  syncColumnSortingFromQuerySort,
} from '../utils';

describe('dataProvider utils', () => {
  describe('applyPaginationToQueryParameters', () => {
    it('should copy numeric pageSize and initialPage when pagination is enabled', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 25, initialPage: 3 }[key]),
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(25);
      expect(query.page).toBe(3);
    });

    it('should ignore non-numeric pageSize and initialPage below 1', () => {
      const query = { page: 2, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 'auto', initialPage: 0 }[key]),
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(10);
      expect(query.page).toBe(2);
    });

    it('should no-op when plugin is missing or disabled', () => {
      const query = { page: 1, pageSize: 10 };

      applyPaginationToQueryParameters(null, query);
      applyPaginationToQueryParameters({ enabled: false, getSetting: () => 99 }, query);

      expect(query).toEqual({ page: 1, pageSize: 10 });
    });
  });

  describe('applyColumnSortingToQueryParameters', () => {
    it('should set sort from first array entry', () => {
      const query = { sort: null };
      const plugin = {
        enabled: true,
        getSortConfig: () => [{ column: 1, sortOrder: 'asc' }],
      };

      applyColumnSortingToQueryParameters(plugin, query);

      expect(query.sort).toEqual({ column: 1, sortOrder: 'asc' });
    });

    it('should set sort from object with column key when array is empty', () => {
      const query = { sort: null };
      const plugin = {
        enabled: true,
        getSortConfig: () => ({ column: 2, sortOrder: 'desc' }),
      };

      applyColumnSortingToQueryParameters(plugin, query);

      expect(query.sort).toEqual({ column: 2, sortOrder: 'desc' });
    });

    it('should no-op when sorting disabled', () => {
      const query = { sort: null };

      applyColumnSortingToQueryParameters({ enabled: false, getSortConfig: () => [{ column: 0 }] }, query);

      expect(query.sort).toBeNull();
    });
  });

  describe('normalizeExternalPaginationPageSize', () => {
    it('should return fallback for auto and invalid values', () => {
      expect(normalizeExternalPaginationPageSize('auto', 10)).toBe(10);
      expect(normalizeExternalPaginationPageSize(0, 10)).toBe(10);
      expect(normalizeExternalPaginationPageSize(-1, 7)).toBe(7);
      expect(normalizeExternalPaginationPageSize(NaN, 5)).toBe(5);
    });

    it('should return positive numbers unchanged', () => {
      expect(normalizeExternalPaginationPageSize(20, 10)).toBe(20);
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

  describe('disablePluginsIncompatibleWithDataProvider', () => {
    let consoleWarn;

    beforeEach(() => {
      consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it('should warn once and disable plugins for conflicting settings', () => {
      const disabled = [];
      const hot = {
        getPlugin: id => ({
          enabled: true,
          disablePlugin: () => disabled.push(id),
        }),
      };
      const warned = new Set();
      const settings = { trimRows: true, manualRowMove: true };

      disablePluginsIncompatibleWithDataProvider(hot, settings, warned);

      expect(disabled).toEqual(['trimRows', 'manualRowMove']);
      expect(warned.has('trimRows')).toBe(true);
      expect(warned.has('manualRowMove')).toBe(true);
      expect(consoleWarn).toHaveBeenCalledTimes(2);
    });

    it('should skip falsy option values', () => {
      const hot = {
        getPlugin: jest.fn(),
      };
      const warned = new Set();

      disablePluginsIncompatibleWithDataProvider(
        hot,
        { trimRows: false, manualRowMove: null, multiColumnSorting: undefined },
        warned
      );

      expect(hot.getPlugin).not.toHaveBeenCalled();
    });
  });

  describe('DATA_PROVIDER_INCOMPATIBLE_ENTRIES', () => {
    it('should list three known conflicts', () => {
      expect(DATA_PROVIDER_INCOMPATIBLE_ENTRIES).toHaveLength(3);
      expect(DATA_PROVIDER_INCOMPATIBLE_ENTRIES.map(e => e.pluginId).sort()).toEqual(
        ['manualRowMove', 'multiColumnSorting', 'trimRows']
      );
    });
  });
});
