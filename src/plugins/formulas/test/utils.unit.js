import {isFormulaExpression, isFormulaExpressionEscaped, unescapeFormulaExpression, toUpperCaseFormula} from 'handsontable-pro/plugins/formulas/utils';

describe('Formulas utils', function() {
  describe('isFormulaExpression', function() {
    it('should correctly detect formula expression', function() {
      expect(isFormulaExpression()).toBe(false);
      expect(isFormulaExpression('')).toBe(false);
      expect(isFormulaExpression('=')).toBe(false);
      expect(isFormulaExpression('=1')).toBe(true);
      expect(isFormulaExpression(null)).toBe(false);
      expect(isFormulaExpression(void 0)).toBe(false);
      expect(isFormulaExpression('SUM(A1)')).toBe(false);
      expect(isFormulaExpression('A1')).toBe(false);
      expect(isFormulaExpression('=A1')).toBe(true);
      expect(isFormulaExpression('=SUM(A1:A5, SUM(12345))')).toBe(true);
    });
  });

  describe('toUpperCaseFormula', function() {
    it('should correctly upper case formula expression', function() {
      expect(function() {
        toUpperCaseFormula();
      }).toThrow();
      expect(function() {
        toUpperCaseFormula(null);
      }).toThrow();
      expect(function() {
        toUpperCaseFormula(12345);
      }).toThrow();
      expect(toUpperCaseFormula('12345')).toBe('12345');
      expect(toUpperCaseFormula('=12345')).toBe('=12345');
      expect(toUpperCaseFormula('=a1:B15')).toBe('=A1:B15');
      expect(toUpperCaseFormula('=Sum(23, a55, "a55")')).toBe('=SUM(23, A55, "a55")');
      expect(toUpperCaseFormula('=COUNTifs(dates, ">="&date(e5, 1, 1), dates, "<="&DATE(E5, 12, 31))'))
        .toBe('=COUNTIFS(DATES, ">="&DATE(E5, 1, 1), DATES, "<="&DATE(E5, 12, 31))');
      expect(toUpperCaseFormula('=SumIf(range, "text*", SUM_range)'))
        .toBe('=SUMIF(RANGE, "text*", SUM_RANGE)');
      expect(toUpperCaseFormula('=SumIf(range, \'text*\', SUM_range)'))
        .toBe('=SUMIF(RANGE, \'text*\', SUM_RANGE)');
    });
  });

  describe('isFormulaExpressionEscaped', function() {
    it('should correctly detect escaped formula expressions', function() {
      expect(isFormulaExpressionEscaped('12345')).toBe(false);
      expect(isFormulaExpressionEscaped('=12345')).toBe(false);
      expect(isFormulaExpressionEscaped('\'=12345')).toBe(true);
      expect(isFormulaExpressionEscaped('\'=a1:B15')).toBe(true);
      expect(isFormulaExpressionEscaped('=SUM(23, A55, "a55")')).toBe(false);
      expect(isFormulaExpressionEscaped('\'=SUM(23, A55, "a55")')).toBe(true);
    });
  });

  describe('unescapeFormulaExpression', function() {
    it('should correctly detect escaped formula expressions', function() {
      expect(unescapeFormulaExpression('12345')).toBe('12345');
      expect(unescapeFormulaExpression('=12345')).toBe('=12345');
      expect(unescapeFormulaExpression('\'=12345')).toBe('=12345');
      expect(unescapeFormulaExpression('\'=a1:B15')).toBe('=a1:B15');
      expect(unescapeFormulaExpression('=SUM(23, A55, "a55")')).toBe('=SUM(23, A55, "a55")');
      expect(unescapeFormulaExpression('\'=SUM(23, A55, "a55")')).toBe('=SUM(23, A55, "a55")');
    });
  });
});
