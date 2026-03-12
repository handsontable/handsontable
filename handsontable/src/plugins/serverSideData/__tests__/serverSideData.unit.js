import {
  cloneQueryParameters,
  normalizePage,
  normalizePageSize,
} from '../serverSideData';

describe('ServerSideData (unit)', () => {
  describe('normalizePage', () => {
    it('should return a positive integer page number', () => {
      expect(normalizePage('3')).toBe(3);
      expect(normalizePage(2)).toBe(2);
    });

    it('should return fallback for invalid values', () => {
      expect(normalizePage(0, 7)).toBe(7);
      expect(normalizePage(-1, 7)).toBe(7);
      expect(normalizePage('foo', 7)).toBe(7);
    });
  });

  describe('normalizePageSize', () => {
    it('should return a positive integer page size', () => {
      expect(normalizePageSize('25')).toBe(25);
      expect(normalizePageSize(50)).toBe(50);
    });

    it('should return fallback for invalid values', () => {
      expect(normalizePageSize(0, 40)).toBe(40);
      expect(normalizePageSize(-10, 40)).toBe(40);
      expect(normalizePageSize('foo', 40)).toBe(40);
    });
  });

  describe('cloneQueryParameters', () => {
    it('should return a shallow-cloned query object', () => {
      const queryParameters = {
        page: 2,
        pageSize: 50,
        sort: {
          column: 'price',
          direction: 'asc',
        },
        filters: {
          category: {
            operator: 'contains',
            value: 'books',
          },
        },
      };
      const clonedQueryParameters = cloneQueryParameters(queryParameters);

      expect(clonedQueryParameters).toEqual(queryParameters);
      expect(clonedQueryParameters).not.toBe(queryParameters);
      expect(clonedQueryParameters.sort).not.toBe(queryParameters.sort);
      expect(clonedQueryParameters.filters).not.toBe(queryParameters.filters);
    });
  });
});
