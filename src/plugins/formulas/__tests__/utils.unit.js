import {
  isEscapedFormulaExpression,
  unescapeFormulaExpression,
} from '../utils';

describe('Formulas utils', () => {
  describe('isEscapedFormulaExpression', () => {
    it('should correctly detect escaped formula expressions', () => {
      expect(isEscapedFormulaExpression('12345')).toBe(false);
      expect(isEscapedFormulaExpression('=12345')).toBe(false);
      expect(isEscapedFormulaExpression('\'=12345')).toBe(true);
      expect(isEscapedFormulaExpression('\'=a1:B15')).toBe(true);
      expect(isEscapedFormulaExpression('=SUM(23, A55, "a55")')).toBe(false);
      expect(isEscapedFormulaExpression('\'=SUM(23, A55, "a55")')).toBe(true);
    });
  });

  describe('unescapeFormulaExpression', () => {
    it('should correctly detect escaped formula expressions', () => {
      expect(unescapeFormulaExpression('12345')).toBe('12345');
      expect(unescapeFormulaExpression('=12345')).toBe('=12345');
      expect(unescapeFormulaExpression('\'=12345')).toBe('=12345');
      expect(unescapeFormulaExpression('\'=a1:B15')).toBe('=a1:B15');
      expect(unescapeFormulaExpression('=SUM(23, A55, "a55")')).toBe('=SUM(23, A55, "a55")');
      expect(unescapeFormulaExpression('\'=SUM(23, A55, "a55")')).toBe('=SUM(23, A55, "a55")');
    });
  });
});
