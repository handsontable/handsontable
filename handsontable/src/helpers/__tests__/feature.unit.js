import {
  getComparisonFunction,
  isCSR,
} from 'handsontable/helpers/feature';

describe('Feature helper', () => {
  //
  // Handsontable.helper.getComparisonFunction
  //
  describe('getComparisonFunction', () => {
    it('should correct equals strings', () => {
      const comparisonFunction = getComparisonFunction();

      expect(comparisonFunction('a', 'b')).toBe(-1);
      expect(comparisonFunction('b', 'a')).toBe(1);
      expect(comparisonFunction('b', 'b')).toBe(0);
      // pl
      expect(comparisonFunction('a', 'ł')).toBe(-1);
      expect(comparisonFunction('ł', 'a')).toBe(1);
      expect(comparisonFunction('Ą', 'A')).toBe(1);
      expect(comparisonFunction('Ź', 'Ż')).toBe(-1);
      expect(comparisonFunction('Ż', 'Ź')).toBe(1);
      expect(comparisonFunction('ą', 'ą')).toBe(0);

      expect(comparisonFunction('1', '10')).toBe(-1);
      expect(comparisonFunction('10', '1')).toBe(1);
      expect(comparisonFunction('10', '10')).toBe(0);
      expect(comparisonFunction(1, 10)).toBe(-1);
      expect(comparisonFunction(10, 1)).toBe(1);
      expect(comparisonFunction(10, 10)).toBe(0);
    });
  });

  //
  // Handsontable.helper.isCSR
  //
  describe('isCSR', () => {
    it('should return true when running in a browser environment', () => {
      expect(isCSR()).toBe(true);
    });

    it('should return false when running in a non-browser environment', () => {
      const originalWindow = global.window;

      delete global.window;

      expect(isCSR()).toBe(false);

      global.window = originalWindow;
    });
  });
});
