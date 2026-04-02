import {
  applyFiltersFromFiltersPluginToQueryParameters,
  cloneDataProviderFiltersPayload,
  conditionsStackToFiltersPayload,
  filtersPayloadToConditionsStack,
  handleBeforeFilterForServer,
} from '../../query/filtering';

describe('dataProvider filtering', () => {
  describe('cloneDataProviderFiltersPayload', () => {
    it('should return null for null', () => {
      expect(cloneDataProviderFiltersPayload(null)).toBeNull();
    });

    it('should deep-clone filter columns and condition args', () => {
      const filters = [{
        prop: 'city',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['warsaw'] }],
      }];
      const clone = cloneDataProviderFiltersPayload(filters);

      expect(clone).toEqual(filters);
      clone[0].conditions[0].args[0] = 'berlin';
      expect(filters[0].conditions[0].args[0]).toBe('warsaw');
    });
  });

  describe('conditionsStackToFiltersPayload', () => {
    it('should map physical columns to prop keys', () => {
      const hot = {
        toVisualColumn: col => col,
        colToProp: visualCol => (visualCol === 0 ? 'id' : 'name'),
      };
      const payload = conditionsStackToFiltersPayload(hot, [{
        column: 0,
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['x'] }],
      }]);

      expect(payload).toEqual([{
        prop: 'id',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['x'] }],
      }]);
    });

    it('should return null for empty stack', () => {
      const hot = { toVisualColumn: () => 0, colToProp: () => 'a' };

      expect(conditionsStackToFiltersPayload(hot, [])).toBeNull();
      expect(conditionsStackToFiltersPayload(hot, null)).toBeNull();
    });
  });

  describe('filtersPayloadToConditionsStack', () => {
    it('should map prop keys back to physical columns', () => {
      const hot = {
        propToCol: prop => (prop === 'id' ? 0 : 1),
        toPhysicalColumn: visual => visual,
      };
      const stack = filtersPayloadToConditionsStack(hot, [{
        prop: 'id',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['x'] }],
      }]);

      expect(stack).toEqual([{
        column: 0,
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['x'] }],
      }]);
    });

    it('should return [] for null or empty payload', () => {
      const hot = { propToCol: () => 0, toPhysicalColumn: c => c };

      expect(filtersPayloadToConditionsStack(hot, null)).toEqual([]);
      expect(filtersPayloadToConditionsStack(hot, [])).toEqual([]);
    });

    it('should round-trip with conditionsStackToFiltersPayload', () => {
      const hot = {
        toVisualColumn: col => col,
        colToProp: visualCol => (visualCol === 0 ? 'id' : 'name'),
        propToCol: prop => (prop === 'id' ? 0 : 1),
        toPhysicalColumn: visual => visual,
      };
      const original = [{
        column: 0,
        operation: 'conjunction',
        conditions: [{ name: 'contains', args: ['foo'] }],
      }];
      const payload = conditionsStackToFiltersPayload(hot, original);
      const back = filtersPayloadToConditionsStack(hot, payload);

      expect(back).toEqual(original);
    });
  });

  describe('applyFiltersFromFiltersPluginToQueryParameters', () => {
    /**
     * @param {object} [filtersPlugin]
     * @returns {object} Minimal `hot` stub.
     */
    function createHotForFiltersPlugin(filtersPlugin = {
      enabled: true,
      exportConditions: () => [{
        column: 0,
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['a'] }],
      }],
    }) {
      return {
        getPlugin: key => (key === 'filters' ? filtersPlugin : null),
        toVisualColumn: col => col,
        colToProp: visualCol => (visualCol === 0 ? 'id' : 'name'),
      };
    }

    it('should leave filters null when fetchRows is not configured', () => {
      const queryParameters = { filters: null };

      applyFiltersFromFiltersPluginToQueryParameters(
        createHotForFiltersPlugin(),
        queryParameters,
        () => undefined
      );

      expect(queryParameters.filters).toBeNull();
    });

    it('should set filters from Filters when fetchRows exists', () => {
      const queryParameters = { filters: null };

      applyFiltersFromFiltersPluginToQueryParameters(
        createHotForFiltersPlugin(),
        queryParameters,
        () => () => {}
      );

      expect(queryParameters.filters).toEqual([{
        prop: 'id',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['a'] }],
      }]);
    });

    it('should leave filters unchanged when Filters plugin is disabled', () => {
      const queryParameters = {
        filters: [{ prop: 'keep', operation: 'conjunction', conditions: [] }],
      };

      applyFiltersFromFiltersPluginToQueryParameters(
        createHotForFiltersPlugin({ enabled: false, exportConditions: () => [] }),
        queryParameters,
        () => () => {}
      );

      expect(queryParameters.filters).toEqual([{
        prop: 'keep',
        operation: 'conjunction',
        conditions: [],
      }]);
    });
  });

  describe('handleBeforeFilterForServer', () => {
    const hot = {
      toVisualColumn: col => col,
      colToProp: visualCol => (visualCol === 2 ? 'city' : 'id'),
    };
    const conditionsStack = [{
      column: 2,
      operation: 'conjunction',
      conditions: [{ name: 'eq', args: ['Warsaw'] }],
    }];

    it('should no-op when fetchRows is not configured', () => {
      const applyFiltersAndRefetch = jasmine.createSpy('applyFiltersAndRefetch');

      const result = handleBeforeFilterForServer(
        {
          hot,
          hasFetchFn: () => false,
          applyFiltersAndRefetch,
        },
        conditionsStack
      );

      expect(result).toBeUndefined();
      expect(applyFiltersAndRefetch).not.toHaveBeenCalled();
    });

    it('should apply filters and return false when fetchRows is configured', () => {
      const applyFiltersAndRefetch = jasmine.createSpy('applyFiltersAndRefetch');

      const result = handleBeforeFilterForServer(
        {
          hot,
          hasFetchFn: () => true,
          applyFiltersAndRefetch,
        },
        conditionsStack
      );

      expect(result).toBe(false);
      expect(applyFiltersAndRefetch).toHaveBeenCalledWith([{
        prop: 'city',
        operation: 'conjunction',
        conditions: [{ name: 'eq', args: ['Warsaw'] }],
      }]);
    });
  });
});
