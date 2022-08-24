import {
  getComparisonFunction,
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
});
