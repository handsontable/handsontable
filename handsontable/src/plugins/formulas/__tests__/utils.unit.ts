import {
  coalesceIndexesToSpans,
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
  colIndexToLetter,
  colLetterToIndex,
  parseCellReferenceToken,
  referencesFromFormula,
  printRangeReferenceFromHyperFormula,
  printReferenceFromVisualSelection,
  insertOrReplaceReferenceInFormula,
  getActiveFormulaReferenceTokenAtCaret,
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
      expect(isDateValid({} as unknown as string)).toBe(false);
      expect(isDateValid(null as unknown as string)).toBe(false);
      expect(isDateValid(undefined as unknown as string)).toBe(false);
      expect(isDateValid('' as unknown as string)).toBe(false);
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

  describe('coalesceIndexesToSpans', () => {
    it('should return an empty list for an empty input', () => {
      expect(coalesceIndexesToSpans([])).toEqual([]);
    });

    it('should wrap a single index in a single span', () => {
      expect(coalesceIndexesToSpans([5])).toEqual([[5, 1]]);
    });

    it('should merge contiguous indexes into one span', () => {
      expect(coalesceIndexesToSpans([2, 3, 4])).toEqual([[2, 3]]);
    });

    it('should keep non-contiguous indexes in separate ascending spans', () => {
      expect(coalesceIndexesToSpans([0, 2, 4])).toEqual([[0, 1], [2, 1], [4, 1]]);
    });

    it('should sort unordered input before coalescing', () => {
      expect(coalesceIndexesToSpans([5, 1, 2, 3, 9])).toEqual([[1, 3], [5, 1], [9, 1]]);
      expect(coalesceIndexesToSpans([10, 9, 8, 0])).toEqual([[0, 1], [8, 3]]);
    });

    it('should count duplicate indexes once', () => {
      expect(coalesceIndexesToSpans([1, 1, 2, 2, 3])).toEqual([[1, 3]]);
      expect(coalesceIndexesToSpans([4, 4])).toEqual([[4, 1]]);
    });

    it('should not mutate the input list', () => {
      const indexes = [3, 1, 2];

      coalesceIndexesToSpans(indexes);

      expect(indexes).toEqual([3, 1, 2]);
    });
  });

  describe('colIndexToLetter', () => {
    it('should convert 1-based column indexes to letters', () => {
      expect(colIndexToLetter(1)).toBe('A');
      expect(colIndexToLetter(26)).toBe('Z');
      expect(colIndexToLetter(27)).toBe('AA');
    });
  });

  describe('colLetterToIndex', () => {
    it('should convert column letters to 1-based indexes', () => {
      expect(colLetterToIndex('A')).toBe(1);
      expect(colLetterToIndex('Z')).toBe(26);
      expect(colLetterToIndex('AA')).toBe(27);
    });
  });

  describe('parseCellReferenceToken', () => {
    it('should parse single-cell and range references into 0-based indexes', () => {
      expect(parseCellReferenceToken('B2')).toEqual({
        sheetName: null,
        fromRow: 1,
        fromCol: 1,
        toRow: 1,
        toCol: 1,
      });

      expect(parseCellReferenceToken('A1:C3')).toEqual({
        sheetName: null,
        fromRow: 0,
        fromCol: 0,
        toRow: 2,
        toCol: 2,
      });

      expect(parseCellReferenceToken('Sheet1!D4')).toEqual({
        sheetName: 'Sheet1',
        fromRow: 3,
        fromCol: 3,
        toRow: 3,
        toCol: 3,
      });
    });

    it('should parse whole-column and whole-row references', () => {
      expect(parseCellReferenceToken('A:A')).toEqual({
        sheetName: null,
        fromRow: 0,
        fromCol: 0,
        toRow: Number.POSITIVE_INFINITY,
        toCol: 0,
      });

      expect(parseCellReferenceToken('A:C')).toEqual({
        sheetName: null,
        fromRow: 0,
        fromCol: 0,
        toRow: Number.POSITIVE_INFINITY,
        toCol: 2,
      });

      expect(parseCellReferenceToken('1:3')).toEqual({
        sheetName: null,
        fromRow: 0,
        fromCol: 0,
        toRow: 2,
        toCol: Number.POSITIVE_INFINITY,
      });

      expect(parseCellReferenceToken('Sheet1!$A:$A')).toEqual({
        sheetName: 'Sheet1',
        fromRow: 0,
        fromCol: 0,
        toRow: Number.POSITIVE_INFINITY,
        toCol: 0,
      });
    });

    it('should return null for non-cell tokens', () => {
      expect(parseCellReferenceToken('TOTAL_SALES')).toBeNull();
    });
  });

  describe('referencesFromFormula', () => {
    it('should extract basic cell coordinates', () => {
      const formula = 'A1 + $B$12 * C$5';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['A1', '$B$12', 'C$5']);
    });

    it('should extract lowercase cell coordinates', () => {
      const formula = 'a1 + $b$12 * c$5';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['a1', '$b$12', 'c$5']);
    });

    it('should extract cell bounding ranges', () => {
      const formula = 'SUM(A1:B10, $C$1:$D$5)';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['A1:B10', '$C$1:$D$5']);
    });

    it('should extract whole-column and whole-row references', () => {
      const formula = 'SUM(A:A) + AVERAGE(1:3)';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['A:A', '1:3']);
    });

    it('should extract standard and quoted cross-sheet references', () => {
      const formula = 'Sheet1!A1 + \'Sales Data\'!$B$5';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['Sheet1!A1', '\'Sales Data\'!$B$5']);
    });

    it('should ignore words hidden inside quoted text strings', () => {
      const formula = 'IF(A1="TOTAL_SALES", "Ignore Sheet1!A1 text", B2)';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['A1', 'B2']);
    });

    it('should return every occurrence of identical formula tokens', () => {
      const formula = 'A1 + TOTAL_SALES - A1 + TOTAL_SALES';
      const ranges = referencesFromFormula(formula);

      expect(ranges.map(({ start, end }) => formula.slice(start, end))).toEqual(['A1', 'A1']);
    });

    it('should assign stable color indexes per unique reference text', () => {
      const formula = 'A1 + TOTAL_SALES - A1 + B2';
      const tokens = referencesFromFormula(formula);

      expect(tokens.map(({ start, end, colorIndex }) => ({
        text: formula.slice(start, end),
        colorIndex,
      }))).toEqual([
        { text: 'A1', colorIndex: 1 },
        { text: 'A1', colorIndex: 1 },
        { text: 'B2', colorIndex: 2 },
      ]);
    });
  });

  describe('printRangeReferenceFromHyperFormula', () => {
    it('should format single cells and rectangular ranges', () => {
      expect(printRangeReferenceFromHyperFormula(1, 1, 1, 1)).toBe('B2');
      expect(printRangeReferenceFromHyperFormula(0, 0, 2, 2)).toBe('A1:C3');
      expect(printRangeReferenceFromHyperFormula(2, 2, 0, 0)).toBe('A1:C3');
    });

    it('should format whole-column and whole-row references', () => {
      expect(printRangeReferenceFromHyperFormula(0, 0, Number.POSITIVE_INFINITY, 0)).toBe('A:A');
      expect(printRangeReferenceFromHyperFormula(0, 0, Number.POSITIVE_INFINITY, 2)).toBe('A:C');
      expect(printRangeReferenceFromHyperFormula(0, 0, 2, Number.POSITIVE_INFINITY)).toBe('1:3');
      expect(printRangeReferenceFromHyperFormula(4, 0, 4, Number.POSITIVE_INFINITY)).toBe('5:5');
    });
  });

  describe('insertOrReplaceReferenceInFormula', () => {
    it('should insert a reference at the caret when not inside a token', () => {
      expect(insertOrReplaceReferenceInFormula('=SUM(', 5, 'B2')).toEqual({
        value: '=SUM(B2',
        caretIndex: 7,
        insertedStart: 5,
        insertedEnd: 7,
      });
    });

    it('should replace the active reference token under the caret', () => {
      expect(insertOrReplaceReferenceInFormula('=SUM(A1)+B2', 6, 'C3')).toEqual({
        value: '=SUM(C3)+B2',
        caretIndex: 7,
        insertedStart: 5,
        insertedEnd: 7,
      });
    });

    it('should replace the active reference token when the caret is at its end', () => {
      expect(insertOrReplaceReferenceInFormula('=SUM(A1)', 7, 'B2')).toEqual({
        value: '=SUM(B2)',
        caretIndex: 7,
        insertedStart: 5,
        insertedEnd: 7,
      });
    });
  });

  describe('getActiveFormulaReferenceTokenAtCaret', () => {
    it('should return the reference token when the caret is at its end', () => {
      expect(getActiveFormulaReferenceTokenAtCaret('=SUM(B1:C3)', 10)).toEqual({
        start: 5,
        end: 10,
        colorIndex: 1,
      });
    });
  });

  describe('printReferenceFromVisualSelection', () => {
    it('should format a visual cell selection through the formulas axis syncers', () => {
      const targetHot = {
        getPlugin: () => ({
          isEnabled: () => true,
          sheetName: 'Sheet1',
          rowAxisSyncer: {
            getHfIndexFromVisualIndex: (index: number) => index,
          },
          columnAxisSyncer: {
            getHfIndexFromVisualIndex: (index: number) => index,
          },
        }),
      } as unknown as import('../../../core/types').HotInstance;

      expect(printReferenceFromVisualSelection(targetHot, 1, 1, 1, 1)).toBe('B2');
      expect(printReferenceFromVisualSelection(targetHot, 0, 0, 2, 2)).toBe('A1:C3');
      expect(printReferenceFromVisualSelection(targetHot, -1, 0, -1, 2)).toBe('A:C');
      expect(printReferenceFromVisualSelection(targetHot, -1, 0, 2, 0)).toBe('A:A');
      expect(printReferenceFromVisualSelection(targetHot, 0, -1, 2, -1)).toBe('1:3');
      expect(printReferenceFromVisualSelection(targetHot, 0, -1, 0, 2)).toBe('1:1');
      expect(printReferenceFromVisualSelection(targetHot, -1, -1, -1, -1)).toBeNull();
    });
  });
});
