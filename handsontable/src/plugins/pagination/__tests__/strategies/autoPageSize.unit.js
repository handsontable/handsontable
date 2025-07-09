import { AutoPageSizeStrategy } from '../../strategies/autoPageSize';

describe('AutoPageSizeStrategy', () => {
  let strategy;

  beforeEach(() => {
    strategy = new AutoPageSizeStrategy();
  });

  describe('calculate()', () => {
    it('should calculate pages based on item sizes and viewport size', () => {
      const itemSizes = [20, 30, 25, 20, 40];
      const viewportSize = 51;

      strategy.calculate({
        itemsSizeProvider: () => itemSizes,
        viewportSizeProvider: () => viewportSize
      });

      expect(strategy.pages).toEqual([
        { startIndex: 0, endIndex: 0, pageSize: 1 },
        { startIndex: 1, endIndex: 1, pageSize: 1 },
        { startIndex: 2, endIndex: 3, pageSize: 2 },
        { startIndex: 4, endIndex: 4, pageSize: 1 },
      ]);
    });

    it('should handle empty data', () => {
      strategy.calculate({
        itemsSizeProvider: () => [],
        viewportSizeProvider: () => 100,
      });

      expect(strategy.pages).toEqual([
        { startIndex: 0, endIndex: 0, pageSize: 0 },
      ]);
    });

    it('should handle viewport size larger than total items size', () => {
      const itemSizes = [20, 30, 25];
      const viewportSize = 200;

      strategy.calculate({
        itemsSizeProvider: () => itemSizes,
        viewportSizeProvider: () => viewportSize,
      });

      expect(strategy.pages).toEqual([
        { startIndex: 0, endIndex: 2, pageSize: 3 }
      ]);
    });

    it('should handle rows higher than viewport height', () => {
      const itemSizes = [200, 30, 25, 30];
      const viewportSize = 100;

      strategy.calculate({
        itemsSizeProvider: () => itemSizes,
        viewportSizeProvider: () => viewportSize,
      });

      expect(strategy.pages).toEqual([
        { startIndex: 0, endIndex: 0, pageSize: 1 },
        { startIndex: 1, endIndex: 3, pageSize: 3 },
      ]);
    });

    it('should start calculating total height from 1px (border top compensation)', () => {
      const itemSizes = [50, 50, 50, 50];
      const viewportSize = 102; // Just enough for both rows + 2px border compensation

      strategy.calculate({
        itemsSizeProvider: () => itemSizes,
        viewportSizeProvider: () => viewportSize,
      });

      expect(strategy.pages).toEqual([
        { startIndex: 0, endIndex: 1, pageSize: 2 },
        { startIndex: 2, endIndex: 3, pageSize: 2 },
      ]);
    });
  });

  describe('getTotalPages()', () => {
    it('should return total number of pages', () => {
      strategy.pages = [
        { startIndex: 0, endIndex: 2 },
        { startIndex: 3, endIndex: 5 },
      ];

      expect(strategy.getTotalPages()).toBe(2);
    });

    it('should return 0 when no pages exist', () => {
      expect(strategy.getTotalPages()).toBe(0);
    });
  });

  describe('getState()', () => {
    it('should return page info for given page number', () => {
      const page = { startIndex: 0, endIndex: 2, pageSize: 3 };

      strategy.pages = [page];

      expect(strategy.getState(1)).toEqual(page);
    });

    it('should return undefined for invalid page number', () => {
      strategy.pages = [{ startIndex: 0, endIndex: 2, pageSize: 3 }];

      expect(strategy.getState(2)).toBeUndefined();
    });
  });
});
