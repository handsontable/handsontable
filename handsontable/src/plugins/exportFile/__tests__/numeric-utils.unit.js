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

      expect(fmt).toBe('#,##0.00"€"');
    });

    it('should place the currency symbol after the number for suffix locales (de-DE / EUR)', () => {
      // de-DE formats EUR as "1.234,56 €" — symbol is a suffix.
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }, 'de-DE');

      expect(fmt).toBe('#,##0.00"€"');
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
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'HKD' }, 'en-US')).toBe('"HK$"#,##0');
    });

    it('should keep a lone dollar sign bare and quote every other one-character symbol', () => {
      // Apple Numbers and Quick Look misread an unquoted euro or pound sign (Numbers showed 1235 for
      // 1234.5, Quick Look 1234,5); the quoted form renders in Numbers, Quick Look, LibreOffice and
      // Excel. The dollar sign is Excel's own bare form, so it stays as it is.
      const options = { style: 'currency', minimumFractionDigits: 2 };

      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'USD' }, 'en-US')).toBe('$#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'EUR' }, 'de-DE')).toBe('#,##0.00"\u20AC"');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'GBP' }, 'en-GB')).toBe('"\u00A3"#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'INR' }, 'en-IN')).toBe('"\u20B9"#,##0.00');
    });

    it('should write minimumIntegerDigits back as zeros in the integer part', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 5, useGrouping: false })).toBe('00000');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 3, useGrouping: false, minimumFractionDigits: 2 }))
        .toBe('000.00');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 2 })).toBe('#,#00');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 5 })).toBe('00,000');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 7 })).toBe('0,000,000');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 1 })).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 3, style: 'percent', useGrouping: false }))
        .toBe('000%');
      // An out-of-range value is ignored, the way Intl would reject it.
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 0, useGrouping: false })).toBe('0');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 22, useGrouping: false })).toBe('0');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 2.5, useGrouping: false })).toBe('0');
    });

    it('should write a symbol several currencies share as a locale token with the currency\'s LCID', () => {
      const options = { style: 'currency', minimumFractionDigits: 2 };

      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'NOK' }, 'nb-NO')).toBe('#,##0.00[$kr-414]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'SEK' }, 'sv-SE')).toBe('#,##0.00[$kr-41D]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'DKK' }, 'da-DK')).toBe('#,##0.00[$kr.-406]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'ISK' }, 'is-IS')).toBe('#,##0.00[$kr.-40F]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'JPY' }, 'en-US')).toBe('[$\u00A5-411]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'CNY' }, 'zh-CN')).toBe('[$\u00A5-804]#,##0.00');
      // The fullwidth yen sign belongs to the yen alone, so it needs no locale token, only quotes.
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'JPY' }, 'ja-JP')).toBe('"\uFFE5"#,##0.00');
    });

    it('should ignore style: currency when no currency code is provided', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'currency' })).toBe('#,##0');
    });
  });
});
