import {
  isEscapedFormulaExpression,
  unescapeFormulaExpression,
  isDateValid,
  isFormula,
  isDate,
  getDateInHotFormat,
  getDateInHfFormat,
  getDateFromExcelDate,
  getTimeFromHfTimeFraction,
  normalizeValueForFormulaEngine,
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

  describe('isDateValid', () => {
    it('should return true for valid ISO 8601 date strings', () => {
      expect(isDateValid('2022-11-13')).toBe(true);
      expect(isDateValid('2023-01-01')).toBe(true);
      expect(isDateValid('1899-12-30')).toBe(true);
      expect(isDateValid('2000-02-29')).toBe(true); // leap year
    });

    it('should return false for non-ISO date strings', () => {
      expect(isDateValid('13/11/2022')).toBe(false);
      expect(isDateValid('11/13/2022')).toBe(false);
      expect(isDateValid('2022-13-01')).toBe(false); // invalid month
      expect(isDateValid('2022-01-32')).toBe(false); // invalid day
    });

    it('should return false for empty/null/undefined values', () => {
      expect(isDateValid({} as any)).toBe(false);
      expect(isDateValid(null as any)).toBe(false);
      expect(isDateValid(undefined as any)).toBe(false);
      expect(isDateValid('' as any)).toBe(false);
    });
  });

  describe('isFormula', () => {
    it('should correctly return whether we handle formula', () => {
      expect(isFormula('=A1')).toBe(true);
      expect(isFormula('\'=A1')).toBe(false);
      expect(isFormula('A1')).toBe(false);
    });
  });

  describe('isDate', () => {
    it('should correctly return whether we handle a date cell type', () => {
      expect(isDate('2022-11-13', 'date')).toBe(true);
      expect(isDate(new Date(), 'date')).toBe(false);
      expect(isDate('2022-11-13', 'text')).toBe(false);
    });
  });

  describe('getDateInHotFormat', () => {
    it('should return the date string unchanged (ISO 8601 passthrough)', () => {
      expect(getDateInHotFormat('2022-11-13')).toBe('2022-11-13');
      expect(getDateInHotFormat('2023-05-15')).toBe('2023-05-15');
    });
  });

  describe('getDateInHfFormat', () => {
    it('should return the date string unchanged (ISO 8601 passthrough)', () => {
      expect(getDateInHfFormat('2022-11-13')).toBe('2022-11-13');
      expect(getDateInHfFormat('2023-05-15')).toBe('2023-05-15');
    });
  });

  describe('getDateFromExcelDate', () => {
    it('should correctly convert Excel-like numeric dates to ISO 8601 strings', () => {
      // Non-numeric input returns NaN-based string
      expect(getDateFromExcelDate('2022-11-13')).toBe('NaN-NaN-NaN');

      // Taking HyperFormula implementation. Excel shows "00.01.1900" while Google Sheets: "12/30/1899"
      expect(getDateFromExcelDate(0)).toEqual('1899-12-30');
      // Taking HyperFormula implementation. Excel shows "01.01.1900" while Google Sheets: "12/31/1899"
      expect(getDateFromExcelDate(1)).toEqual('1899-12-31');
      // Taking HyperFormula implementation. Excel shows "29.02.1900" while Google Sheets: "2/28/1900"
      expect(getDateFromExcelDate(60)).toEqual('1900-02-28');
      // Values are the same for GS, Excel and HF.
      expect(getDateFromExcelDate(365)).toEqual('1900-12-30');
      // Values are the same for GS, Excel and HF.
      expect(getDateFromExcelDate(366)).toEqual('1900-12-31');
    });
  });

  describe('getTimeFromHfTimeFraction', () => {
    it('should format a day-fraction time as HH:mm (no seconds when zero)', () => {
      expect(getTimeFromHfTimeFraction(0)).toBe('00:00');
      expect(getTimeFromHfTimeFraction(0.25)).toBe('06:00');
      expect(getTimeFromHfTimeFraction(0.5)).toBe('12:00');
      expect(getTimeFromHfTimeFraction(0.75)).toBe('18:00');
    });

    it('should include seconds in HH:mm:ss format when seconds are non-zero', () => {
      // 06:00:30 = (6*3600 + 30) / 86400
      expect(getTimeFromHfTimeFraction(21630 / 86400)).toBe('06:00:30');
      // 12:30:45 = (12*3600 + 30*60 + 45) / 86400
      expect(getTimeFromHfTimeFraction(45045 / 86400)).toBe('12:30:45');
    });

    it('should ignore the integer day part and only format the fractional time part', () => {
      expect(getTimeFromHfTimeFraction(1.5)).toBe('12:00');
      expect(getTimeFromHfTimeFraction(43891.75)).toBe('18:00');
    });
  });

  describe('normalizeValueForFormulaEngine', () => {
    it('should convert array values to comma-separated strings', () => {
      expect(normalizeValueForFormulaEngine([])).toBe('');
      expect(normalizeValueForFormulaEngine(['A', 'B'])).toBe('A, B');
      expect(normalizeValueForFormulaEngine([{ key: 'a', value: 'Alpha' }])).toBe('Alpha');
      expect(normalizeValueForFormulaEngine([
        { key: 'a', value: 'Alpha' },
        { key: 'b', value: 'Beta' },
      ])).toBe('Alpha, Beta');
    });

    it('should keep non-array values unchanged', () => {
      const objectValue = { key: 'A', value: 'Alpha' };

      expect(normalizeValueForFormulaEngine('A')).toBe('A');
      expect(normalizeValueForFormulaEngine(123)).toBe(123);
      expect(normalizeValueForFormulaEngine(null)).toBeNull();
      expect(normalizeValueForFormulaEngine(objectValue)).toBe(objectValue);
    });
  });
});
