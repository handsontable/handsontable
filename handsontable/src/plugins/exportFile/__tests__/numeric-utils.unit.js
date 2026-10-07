import { intlNumFormatToExcelNumFmt } from '../types/xlsx/numeric-utils';

describe('intlNumFormatToExcelNumFmt', () => {
  it('should return null for a falsy argument', () => {
    expect(intlNumFormatToExcelNumFmt(null)).toBeNull();
    expect(intlNumFormatToExcelNumFmt(undefined)).toBeNull();
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

      expect(fmt).toBe('"XYZ"#,##0');
    });

    it('should quote a currency symbol longer than one character, so Excel does not repair the file', () => {
      // Excel for the web repairs a workbook holding an unquoted letter code (`#,##0.00USD`,
      // `CHF#,##0.00`) and drops the format; Numbers and LibreOffice misread the unquoted symbols too.
      const usd = { style: 'currency', currency: 'USD', minimumFractionDigits: 2 };

      expect(intlNumFormatToExcelNumFmt(usd, 'it-IT')).toBe('#,##0.00"USD"');
      expect(intlNumFormatToExcelNumFmt(usd, 'en-AU')).toBe('"USD"#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...usd, currency: 'EUR' }, 'en-AU')).toBe('"EUR"#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...usd, currency: 'CHF' }, 'de-CH')).toBe('"CHF"#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...usd, currency: 'PLN' }, 'pl-PL')).toBe('#,##0.00"z\u0142"');
      expect(intlNumFormatToExcelNumFmt({ ...usd, currency: 'SEK' }, 'sv-SE')).toBe('#,##0.00"kr"');
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'HKD' }, 'en-US')).toBe('"HK$"#,##0');
    });

    it('should keep a lone single-character currency symbol bare', () => {
      const options = { style: 'currency', minimumFractionDigits: 2 };

      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'USD' }, 'en-US')).toBe('$#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'EUR' }, 'de-DE')).toBe('#,##0.00\u20AC');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'GBP' }, 'en-GB')).toBe('\u00A3#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'JPY' }, 'en-US')).toBe('\u00A5#,##0.00');
    });

    it('should ignore style: currency when no currency code is provided', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'currency' })).toBe('#,##0');
    });
  });
});
