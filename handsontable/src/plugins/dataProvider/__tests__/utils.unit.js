import {
  clampDataProviderPageToTotalRows,
  getDataProviderRequestErrorDescription,
  isCompleteDataProviderConfig,
} from '../utils';

describe('dataProvider utils', () => {
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
