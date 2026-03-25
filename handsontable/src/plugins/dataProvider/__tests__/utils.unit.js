import {
  applyColumnSortingToQueryParameters,
  applyPaginationToQueryParameters,
  clampDataProviderPageToTotalRows,
  getDataProviderRequestErrorDescription,
  getIncompleteDataProviderWarningMessage,
  isCompleteDataProviderConfig,
  normalizeExternalPaginationPageSize,
  normalizeSortToQueryFormat,
  querySortToPluginSort,
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

    it('should prefer getCurrentPage over initialPage', () => {
      const query = { page: 1, pageSize: 10 };
      const pagination = {
        enabled: true,
        getSetting: key => ({ pageSize: 5, initialPage: 1 }[key]),
        getCurrentPage: () => 4,
      };

      applyPaginationToQueryParameters(pagination, query);

      expect(query.pageSize).toBe(5);
      expect(query.page).toBe(4);
    });

    it('should no-op when plugin is missing or disabled', () => {
      const query = { page: 1, pageSize: 10 };

      applyPaginationToQueryParameters(null, query);
      applyPaginationToQueryParameters({ enabled: false, getSetting: () => 99 }, query);

      expect(query).toEqual({ page: 1, pageSize: 10 });
    });
  });

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

  describe('isCompleteDataProviderConfig', () => {
    it('should return false for incomplete or invalid configs', () => {
      expect(isCompleteDataProviderConfig(undefined)).toBe(false);
      expect(isCompleteDataProviderConfig(null)).toBe(false);
      expect(isCompleteDataProviderConfig(false)).toBe(false);
      expect(isCompleteDataProviderConfig({})).toBe(false);
      expect(isCompleteDataProviderConfig({ rowId: 'id', fetchRows: () => {} })).toBe(false);
    });

    it('should return true when all required callbacks and rowId are present', () => {
      const noop = () => {};
      const c = {
        rowId: 'id',
        fetchRows: noop,
        onRowsCreate: noop,
        onRowsUpdate: noop,
        onRowsRemove: noop,
      };

      expect(isCompleteDataProviderConfig(c)).toBe(true);
      expect(isCompleteDataProviderConfig({ ...c, rowId: () => 'x' })).toBe(true);
    });
  });

  describe('getIncompleteDataProviderWarningMessage', () => {
    it('should return null when the option is absent or disabled', () => {
      expect(getIncompleteDataProviderWarningMessage(undefined)).toBeNull();
      expect(getIncompleteDataProviderWarningMessage(null)).toBeNull();
      expect(getIncompleteDataProviderWarningMessage(false)).toBeNull();
    });

    it('should return a message for non-object values', () => {
      expect(getIncompleteDataProviderWarningMessage(true)).toContain('plain object');
      expect(getIncompleteDataProviderWarningMessage('x')).toContain('plain object');
    });

    it('should return a message for arrays', () => {
      expect(getIncompleteDataProviderWarningMessage([])).toContain('plain object');
    });

    it('should list invalid or missing keys for incomplete objects', () => {
      const msg = getIncompleteDataProviderWarningMessage({ rowId: 'id' });

      expect(msg).toContain('fetchRows');
      expect(msg).toContain('onRowsCreate');
      expect(msg).toContain('onRowsUpdate');
      expect(msg).toContain('onRowsRemove');
    });

    it('should mention rowId when it has the wrong type', () => {
      const msg = getIncompleteDataProviderWarningMessage({
        rowId: 1,
        fetchRows: () => {},
        onRowsCreate: () => {},
        onRowsUpdate: () => {},
        onRowsRemove: () => {},
      });

      expect(msg).toContain('rowId');
    });

    it('should return null for a complete config', () => {
      const noop = () => {};

      expect(getIncompleteDataProviderWarningMessage({
        rowId: 'id',
        fetchRows: noop,
        onRowsCreate: noop,
        onRowsUpdate: noop,
        onRowsRemove: noop,
      })).toBeNull();
    });
  });

  describe('getDataProviderRequestErrorDescription', () => {
    it('should prefer response.data message over bare status in Error#message', () => {
      const err = new Error('500');

      err.response = {
        data: {
          error: 'Simulated 500 error after 2 request(s)',
          message: 'Simulated 500 error after 2 request(s)',
        },
      };

      expect(getDataProviderRequestErrorDescription(err)).toBe('Simulated 500 error after 2 request(s)');
    });

    it('should parse JSON string body on data', () => {
      const err = new Error('500');

      err.data = '{"message":"From JSON string","error":"From JSON string"}';

      expect(getDataProviderRequestErrorDescription(err)).toBe('From JSON string');
    });

    it('should prefer data object over bare status when response is absent', () => {
      const err = new Error('500');

      err.data = {
        message: 'From err.data',
        error: 'From err.data',
      };

      expect(getDataProviderRequestErrorDescription(err)).toBe('From err.data');
    });

    it('should use plain object payload when thrown without Error', () => {
      const err = {
        error: 'Server said no',
        message: 'Server said no',
      };

      expect(getDataProviderRequestErrorDescription(err)).toBe('Server said no');
    });

    it('should fall back to bare status when no richer text exists', () => {
      expect(getDataProviderRequestErrorDescription(new Error('500'))).toBe('500');
    });

    it('should return Unknown error for null', () => {
      expect(getDataProviderRequestErrorDescription(null)).toBe('Unknown error');
    });
  });

  describe('clampDataProviderPageToTotalRows', () => {
    it('should return page 1 when totalRows fits on one page but page was 2', () => {
      expect(clampDataProviderPageToTotalRows(2, 2, 2)).toBe(1);
    });

    it('should leave page unchanged when it is within range', () => {
      expect(clampDataProviderPageToTotalRows(2, 2, 4)).toBe(2);
    });

    it('should use DEFAULT_PAGE_SIZE when pageSize is invalid', () => {
      expect(clampDataProviderPageToTotalRows(5, 0, 25)).toBe(3);
    });

    it('should treat totalRows 0 as a single page', () => {
      expect(clampDataProviderPageToTotalRows(3, 10, 0)).toBe(1);
    });
  });
});
