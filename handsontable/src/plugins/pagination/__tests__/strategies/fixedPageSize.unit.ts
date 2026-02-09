import { FixedPageSizeStrategy } from '../../strategies/fixedPageSize';

describe('FixedPageSizeStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new FixedPageSizeStrategy();
  });

  describe('calculate()', () => {
    it('should calculate pages based on total items and page size', () => {
      strategy.calculate({
        totalItems: 100,
        pageSize: 20,
      });

      expect(strategy.totalPages).toBe(5);
    });

    it('should handle non-divisible total items', () => {
      strategy.calculate({
        totalItems: 95,
        pageSize: 20,
      });

      expect(strategy.totalPages).toBe(5);
    });

    it('should handle zero total items', () => {
      strategy.calculate({
        totalItems: 0,
        pageSize: 20,
      });

      expect(strategy.totalPages).toBe(1);
    });

    it('should handle page size larger than total items', () => {
      strategy.calculate({
        totalItems: 10,
        pageSize: 20,
      });

      expect(strategy.totalPages).toBe(1);
    });

    it('should handle minimum page size of 1', () => {
      strategy.calculate({
        totalItems: 100,
        pageSize: 0,
      });

      expect(strategy.totalPages).toBe(100);
    });
  });

  describe('getTotalPages()', () => {
    it('should return total number of pages', () => {
      strategy.totalPages = 5;

      expect(strategy.getTotalPages()).toBe(5);
    });

    it('should return 0 when no calculation was performed', () => {
      expect(strategy.getTotalPages()).toBe(0);
    });
  });

  describe('getState()', () => {
    it('should return page info for given page number', () => {
      strategy.calculate({
        totalItems: 100,
        pageSize: 20,
      });

      expect(strategy.getState(1)).toEqual({
        startIndex: 0,
        endIndex: 19,
        pageSize: 20
      });

      expect(strategy.getState(3)).toEqual({
        startIndex: 40,
        endIndex: 59,
        pageSize: 20
      });
    });

    it('should handle last page with fewer items', () => {
      strategy.calculate({
        totalItems: 95,
        pageSize: 20,
      });

      expect(strategy.getState(5)).toEqual({
        startIndex: 80,
        endIndex: 94,
        pageSize: 20,
      });
    });

    it('should return undefined for invalid page number', () => {
      strategy.calculate({
        totalItems: 100,
        pageSize: 20,
      });

      expect(strategy.getState(6)).toBeUndefined();
    });
  });
});
