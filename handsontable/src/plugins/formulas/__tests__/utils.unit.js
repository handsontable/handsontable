import {
  isEscapedFormulaExpression,
  unescapeFormulaExpression,
  isDateValid,
  isFormula,
  isDate,
  getDateInHotFormat,
  getDateInHfFormat,
  getDateFromExcelDate,
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
    it('should correctly detect proper date according to handled date format from cell properties', () => {
      expect(isDateValid('13/11/2022', 'DD/MM/YYYY')).toBe(true);
      expect(isDateValid('11/13/2022', 'DD/MM/YYYY')).toBe(false);
      expect(isDateValid('11/13/2022', 'MM/DD/YYYY')).toBe(true);
      expect(isDateValid('13/11/2022', 'MM/DD/YYYY')).toBe(false);

      expect(isDateValid({}, 'DD/MM/YYYY')).toBe(false);
      expect(isDateValid(null, 'DD/MM/YYYY')).toBe(false);
      expect(isDateValid(undefined, 'DD/MM/YYYY')).toBe(false);
      expect(isDateValid('', 'DD/MM/YYYY')).toBe(false);
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
    it('should correctly return whether we handle formula', () => {
      expect(isDate('13/11/2022', 'date')).toBe(true);
      expect(isDate(new Date(), 'date')).toBe(false);
      expect(isDate('13/11/2022', 'text')).toBe(false);
    });
  });

  describe('getDateInHotFormat', () => {
    it('should correctly convert from HF to HOT date', () => {
      expect(getDateInHotFormat('13/11/2022', 'DD/MM/YYYY')).toBe('13/11/2022');
      expect(getDateInHotFormat('13/11/2022', 'MM/DD/YYYY')).toBe('11/13/2022');
      expect(getDateInHotFormat('11/13/2022', 'MM/DD/YYYY')).toBe('Invalid date');
    });
  });

  describe('getDateInHfFormat', () => {
    it('should correctly convert from HOT to HF date', () => {
      expect(getDateInHfFormat('13/11/2022', 'DD/MM/YYYY')).toBe('13/11/2022');
      expect(getDateInHfFormat('11/13/2022', 'MM/DD/YYYY')).toBe('13/11/2022');
      expect(getDateInHfFormat('13/11/2022', 'MM/DD/YYYY')).toBe('Invalid date');
    });
  });

  describe('getDateFromExcelDate', () => {
    it('should correctly convert dates from Excel-like dates to Date objects', () => {
      expect(isNaN(getDateFromExcelDate('13/11/2022', 'DD/MM/YYYY'))).toBe(true);

      // Taking HyperFormula implementation. Excel shows "00.01.1900" while Google Sheets: "12/30/1899"
      expect(getDateFromExcelDate(0, 'DD/MM/YYYY')).toEqual('30/12/1899');
      // Taking HyperFormula implementation. Excel shows "01.01.1900" while Google Sheets: "12/31/1899"
      expect(getDateFromExcelDate(1, 'DD/MM/YYYY')).toEqual('31/12/1899');
      // Taking HyperFormula implementation. Excel shows "29.02.1900" while Google Sheets: "2/28/1900"
      expect(getDateFromExcelDate(60, 'DD/MM/YYYY')).toEqual('28/02/1900');
      // Values are the same for GS, Excel and HF.
      expect(getDateFromExcelDate(365, 'DD/MM/YYYY')).toEqual('30/12/1900');
      // Values are the same for GS, Excel and HF.
      expect(getDateFromExcelDate(366, 'DD/MM/YYYY')).toEqual('31/12/1900');
      // Values are the same for GS, Excel and HF.
      expect(getDateFromExcelDate(366, 'YYYY-MM-DD')).toEqual('1900-12-31');
    });
  });
});
