import { colIndexToLetter, colLetterToIndex, parseMultiRangeRef, parseRangeRef, toRangeRef } from '../cellRef';

describe('cellRef', () => {
  it('should convert 1-based column indexes to letters and back', () => {
    expect(colIndexToLetter(1)).toBe('A');
    expect(colIndexToLetter(26)).toBe('Z');
    expect(colIndexToLetter(27)).toBe('AA');
    expect(colIndexToLetter(702)).toBe('ZZ');
    expect(colLetterToIndex('A')).toBe(1);
    expect(colLetterToIndex('AA')).toBe(27);
    expect(colLetterToIndex('zz')).toBe(702);
  });

  it('should build and parse 1-based range references', () => {
    expect(toRangeRef(2, 2, 7, 5)).toBe('B2:E7');
    expect(parseRangeRef('B2:E7')).toEqual({ startRow: 2, startCol: 2, endRow: 7, endCol: 5 });
    expect(parseRangeRef('C3')).toEqual({ startRow: 3, startCol: 3, endRow: 3, endCol: 3 });
    expect(parseRangeRef('$A$1:$B$4')).toEqual({ startRow: 1, startCol: 1, endRow: 4, endCol: 2 });
  });

  it('should return null for a reference it cannot parse', () => {
    expect(parseRangeRef('')).toBeNull();
    expect(parseRangeRef('1A')).toBeNull();
    expect(parseRangeRef('Sheet1!A1:B2')).toEqual({ startRow: 1, startCol: 1, endRow: 2, endCol: 2 });
  });

  it('should split a multi-range reference into one range per part', () => {
    expect(parseMultiRangeRef('A1:B2 D1:E2')).toEqual([
      { startRow: 1, startCol: 1, endRow: 2, endCol: 2 },
      { startRow: 1, startCol: 4, endRow: 2, endCol: 5 },
    ]);
    expect(parseMultiRangeRef('C3')).toEqual([{ startRow: 3, startCol: 3, endRow: 3, endCol: 3 }]);
    expect(parseMultiRangeRef('  $A$1  ')).toEqual([{ startRow: 1, startCol: 1, endRow: 1, endCol: 1 }]);
    expect(parseMultiRangeRef('')).toEqual([]);
    // A part that is not a reference is skipped, not fatal: the rest of the ref still applies.
    expect(parseMultiRangeRef('A1 nonsense B2')).toEqual([
      { startRow: 1, startCol: 1, endRow: 1, endCol: 1 },
      { startRow: 2, startCol: 2, endRow: 2, endCol: 2 },
    ]);
  });
});
