import {
  DEFAULT_QUERY_PARAMETERS,
  createDefaultQueryParameters,
  resolveDataProviderRequestQueryParameters,
  normalizeDataProviderResponse,
} from '../dataProvider';

describe('dataProvider helpers', () => {
  describe('createDefaultQueryParameters', () => {
    it('should create default query parameters', () => {
      expect(createDefaultQueryParameters()).toEqual({
        page: 1,
        pageSize: 20,
        sort: null,
        filters: null,
      });
    });

    it('should return a fresh object', () => {
      const queryParameters = createDefaultQueryParameters();

      queryParameters.page = 10;

      expect(DEFAULT_QUERY_PARAMETERS.page).toBe(1);
    });
  });

  describe('resolveDataProviderRequestQueryParameters', () => {
    it('should return false when the request was blocked by hook', () => {
      expect(resolveDataProviderRequestQueryParameters({ page: 1 }, false)).toBe(false);
    });

    it('should return hook override when object was returned', () => {
      const nextQueryParameters = { page: 5, pageSize: 10, sort: null, filters: null };

      expect(resolveDataProviderRequestQueryParameters({ page: 1 }, nextQueryParameters)).toBe(nextQueryParameters);
    });

    it('should clone current query parameters when hook does not override them', () => {
      const currentQueryParameters = { page: 1, pageSize: 20, sort: null, filters: null };
      const resolvedQueryParameters = resolveDataProviderRequestQueryParameters(currentQueryParameters);

      expect(resolvedQueryParameters).toEqual(currentQueryParameters);
      expect(resolvedQueryParameters).not.toBe(currentQueryParameters);
    });
  });

  describe('normalizeDataProviderResponse', () => {
    it('should keep provided rows and total rows', () => {
      expect(normalizeDataProviderResponse({
        rows: [['A1']],
        totalRows: 100,
      })).toEqual({
        rows: [['A1']],
        totalRows: 100,
      });
    });

    it('should fallback total rows to rows length', () => {
      expect(normalizeDataProviderResponse({
        rows: [['A1'], ['A2'], ['A3']],
      })).toEqual({
        rows: [['A1'], ['A2'], ['A3']],
        totalRows: 3,
      });
    });

    it('should throw an error when rows are missing', () => {
      expect(() => normalizeDataProviderResponse({
        totalRows: 1,
      })).toThrowError('`dataProvider` must resolve to an object containing a `rows` array.');
    });
  });
});
