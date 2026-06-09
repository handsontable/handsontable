import { numbroPatternToExcelNumFmt, intlNumFormatToExcelNumFmt } from '../types/xlsx/numeric-utils';

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

describe('intlNumFormatToExcelNumFmt', () => {
  it('should return null for a falsy argument', () => {
    expect(intlNumFormatToExcelNumFmt(null)).toBeNull();
    expect(intlNumFormatToExcelNumFmt(undefined)).toBeNull();
  });

  describe('legacy numbro pattern path', () => {
    it('should delegate to numbroPatternToExcelNumFmt when a pattern property is present', () => {
      expect(intlNumFormatToExcelNumFmt({ pattern: '0,0.00' })).toBe('#,##0.00');
    });
  });

  describe('Intl.NumberFormat options path', () => {
    it('should produce a grouped decimal format by default', () => {
      expect(intlNumFormatToExcelNumFmt({})).toBe('#,##0');
    });

    it('should include decimal places when minimumFractionDigits is set', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 2 })).toBe('#,##0.00');
    });

    it('should prefer maximumFractionDigits over minimumFractionDigits for decimal places', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 0, maximumFractionDigits: 3 })).toBe('#,##0.000');
    });

    it('should produce an ungrouped format when useGrouping is false', () => {
      expect(intlNumFormatToExcelNumFmt({ useGrouping: false, minimumFractionDigits: 2 })).toBe('0.00');
    });

    it('should produce a percent format', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'percent', minimumFractionDigits: 1 })).toBe('#,##0.0%');
    });

    it('should produce a currency format with the resolved symbol', () => {
      // USD with locale en-US resolves to '$'
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'USD', minimumFractionDigits: 2 }, 'en-US');

      expect(fmt).toBe('$#,##0.00');
    });

    it('should place the currency symbol after the number for suffix locales (fr-FR / EUR)', () => {
      // fr-FR formats EUR as "1 234,56 €" — symbol is a suffix.
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }, 'fr-FR');

      expect(fmt).toBe('#,##0.00€');
    });

    it('should place the currency symbol after the number for suffix locales (de-DE / EUR)', () => {
      // de-DE formats EUR as "1.234,56 €" — symbol is a suffix.
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }, 'de-DE');

      expect(fmt).toBe('#,##0.00€');
    });

    it('should keep the currency symbol before the number for prefix locales (en-US / USD)', () => {
      // Regression: ensure prefix placement is unchanged after the fix.
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'USD', minimumFractionDigits: 2 }, 'en-US');

      expect(fmt).toBe('$#,##0.00');
    });

    it('should fall back to the currency code when the currency is unrecognised', () => {
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'XYZ', minimumFractionDigits: 0 }, 'en-US');

      expect(fmt).toBe('XYZ#,##0');
    });

    it('should ignore style: currency when no currency code is provided', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'currency' })).toBe('#,##0');
    });
  });
});
