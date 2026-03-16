import { numbroPatternToExcelNumFmt } from '../numeric-utils';

describe('numbroPatternToExcelNumFmt', () => {
  it('should convert a currency pattern with thousands grouping', () => {
    expect(numbroPatternToExcelNumFmt('$0,0.00')).toBe('$#,##0.00');
  });

  it('should convert a plain thousands-grouped pattern', () => {
    expect(numbroPatternToExcelNumFmt('0,0.00')).toBe('#,##0.00');
  });

  it('should convert a thousands-grouped pattern without decimals', () => {
    expect(numbroPatternToExcelNumFmt('0,0')).toBe('#,##0');
  });

  it('should leave patterns without thousands grouping unchanged', () => {
    expect(numbroPatternToExcelNumFmt('0.00')).toBe('0.00');
  });

  it('should leave percentage patterns unchanged', () => {
    expect(numbroPatternToExcelNumFmt('0%')).toBe('0%');
    expect(numbroPatternToExcelNumFmt('0.00%')).toBe('0.00%');
  });

  it('should return null for a falsy pattern', () => {
    expect(numbroPatternToExcelNumFmt(null)).toBeNull();
    expect(numbroPatternToExcelNumFmt(undefined)).toBeNull();
    expect(numbroPatternToExcelNumFmt('')).toBeNull();
  });

  it('should return null for a non-string pattern', () => {
    expect(numbroPatternToExcelNumFmt(42)).toBeNull();
  });
});
