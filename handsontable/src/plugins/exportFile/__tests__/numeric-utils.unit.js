import { intlNumFormatToExcelNumFmt } from '../types/xlsx/numeric-utils';

describe('intlNumFormatToExcelNumFmt', () => {
  it('should return null for a falsy argument', () => {
    expect(intlNumFormatToExcelNumFmt(null)).toBeNull();
    expect(intlNumFormatToExcelNumFmt(undefined)).toBeNull();
  });

  describe('Intl.NumberFormat options path', () => {
    it('should write the fraction digits Intl resolves when the format names none', () => {
      // The grid formats with `new Intl.NumberFormat(locale, numericFormat)`, which shows up to three
      // decimals by default. `#,##0` rounded 1234.567 to 1,235 in Excel (GitHub issue #14372).
      expect(intlNumFormatToExcelNumFmt({})).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({ useGrouping: false })).toBe('0.###');
    });

    it('should write the currency\'s own fraction digits when the format names none', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'USD' }, 'en-US')).toBe('$#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'EUR' }, 'de-DE')).toBe('#,##0.00"\u20AC"');
      // The Kuwaiti dinar has three minor digits, the yen none.
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'KWD' }, 'en-US')).toBe('"KWD"#,##0.000');
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'JPY' }, 'en-US')).toBe('[$\u00A5-411]#,##0');
    });

    it('should write no fraction digits for a percent that names none', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'percent' })).toBe('#,##0%');
    });

    it('should write the digits between the minimum and the maximum as optional', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 1, maximumFractionDigits: 3 })).toBe('#,##0.0##');
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 0, maximumFractionDigits: 3 })).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({ maximumFractionDigits: 1 })).toBe('#,##0.#');
      // Intl raises the maximum to its default of three when only a lower minimum is set.
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 2 })).toBe('#,##0.00#');
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 5 })).toBe('#,##0.00000');
    });

    it('should write only required digits when the minimum equals the maximum', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 2, maximumFractionDigits: 2 })).toBe('#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ maximumFractionDigits: 0 })).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, 'en-US'))
        .toBe('$#,##0');
    });

    it('should fall back to the digits the format names when Intl resolves none', () => {
      // Significant-digit rounding has no fraction digits, and an option Intl rejects never reached the grid.
      expect(intlNumFormatToExcelNumFmt({ maximumSignificantDigits: 3 })).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({ maximumSignificantDigits: 3, minimumFractionDigits: 2 })).toBe('#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 2 }, 'not a locale')).toBe('#,##0.00');
    });

    it('should produce an ungrouped format when useGrouping is false', () => {
      expect(intlNumFormatToExcelNumFmt({ useGrouping: false, maximumFractionDigits: 2 })).toBe('0.##');
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
      const fmt = intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'XYZ', maximumFractionDigits: 0 }, 'en-US');

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
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'HKD' }, 'en-US')).toBe('"HK$"#,##0.00');
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

    it('should keep the optional fraction digits of a zero-padded format that names none', () => {
      // A ZIP code column: `Intl` still resolves up to three fraction digits for it.
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 5, useGrouping: false })).toBe('00000.###');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 2 })).toBe('#,#00.###');
    });

    it('should write minimumIntegerDigits back as zeros in the integer part', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 5, useGrouping: false, maximumFractionDigits: 0 }))
        .toBe('00000');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 3, useGrouping: false, minimumFractionDigits: 2 }))
        .toBe('000.00#');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 2, maximumFractionDigits: 0 })).toBe('#,#00');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 5, maximumFractionDigits: 0 })).toBe('00,000');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 7, maximumFractionDigits: 0 })).toBe('0,000,000');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 1, maximumFractionDigits: 0 })).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 3, style: 'percent', useGrouping: false }))
        .toBe('000%');
      // An out-of-range value is ignored, the way Intl would reject it.
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 0, useGrouping: false })).toBe('0');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 22, useGrouping: false })).toBe('0');
      expect(intlNumFormatToExcelNumFmt({ minimumIntegerDigits: 2.5, useGrouping: false, maximumFractionDigits: 0 }))
        .toBe('0');
    });

    it('should write a symbol several currencies share as a locale token with the currency\'s LCID', () => {
      const options = { style: 'currency', minimumFractionDigits: 2 };

      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'NOK' }, 'nb-NO')).toBe('#,##0.00[$kr-414]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'SEK' }, 'sv-SE')).toBe('#,##0.00[$kr-41D]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'DKK' }, 'da-DK')).toBe('#,##0.00[$kr.-406]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'ISK' }, 'is-IS')).toBe('#,##0.00[$kr.-40F]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'JPY' }, 'en-US')).toBe('[$\u00A5-411]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'CNY' }, 'zh-CN')).toBe('[$\u00A5-804]#,##0.00');
      // The fullwidth yen sign is shared too: the raw-value inference reads it as the yuan under a
      // Chinese locale, so it gets the yen's locale token like the halfwidth sign (review round 12).
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'JPY' }, 'ja-JP')).toBe('[$\uFFE5-411]#,##0.00');
    });

    it('should write a dollar currency other than the US dollar as a locale token with its home LCID', () => {
      // A bare `$` reads back as the US dollar, so an AUD, CAD, NZD or MXN column changed currency on
      // its first round trip. Excel's own tokens for them carry the currency's home LCID.
      const options = { style: 'currency', minimumFractionDigits: 2 };

      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'AUD' }, 'en-AU')).toBe('[$$-C09]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'CAD' }, 'en-CA')).toBe('[$$-1009]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'CAD' }, 'fr-CA')).toBe('#,##0.00[$$-1009]');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'NZD' }, 'en-NZ')).toBe('[$$-1409]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'MXN' }, 'es-MX')).toBe('[$$-80A]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'ARS' }, 'es-AR')).toBe('[$$-2C0A]#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'SGD' }, 'en-SG')).toBe('[$$-4809]#,##0.00');
      // The US dollar keeps Excel's bare form, and a dollar composite keeps its quotes.
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'USD' }, 'en-US')).toBe('$#,##0.00');
      expect(intlNumFormatToExcelNumFmt({ ...options, currency: 'AUD' }, 'en-US')).toBe('"A$"#,##0.00');
    });

    it('should ignore style: currency when no currency code is provided', () => {
      expect(intlNumFormatToExcelNumFmt({ style: 'currency' })).toBe('#,##0');
    });
  });

  describe('the format of a value that shows no fraction digit', () => {
    it('should drop the decimal part when every fraction digit is optional', () => {
      // Excel keeps the decimal point of `#,##0.###`, so 1234 showed as `1,234.` where the grid
      // shows `1,234`.
      expect(intlNumFormatToExcelNumFmt({}, undefined, 1234)).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({}, undefined, 1234.5)).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({}, undefined, 0)).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({}, undefined, -7)).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({ useGrouping: false }, undefined, 1234)).toBe('0');
      expect(intlNumFormatToExcelNumFmt({ maximumFractionDigits: 1 }, undefined, 2)).toBe('#,##0');
    });

    it('should keep the leading zeros of a ZIP code', () => {
      const zipCode = { minimumIntegerDigits: 5, useGrouping: false };

      expect(intlNumFormatToExcelNumFmt(zipCode, undefined, 2134)).toBe('00000');
      expect(intlNumFormatToExcelNumFmt(zipCode, undefined, 2134.5)).toBe('00000.###');
    });

    it('should judge the value at the digits the format rounds to', () => {
      // 1.0004 rounds to 1 at three digits, and 1.0006 to 1.001.
      expect(intlNumFormatToExcelNumFmt({}, undefined, 1.0004)).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({}, undefined, 1.0006)).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({ maximumFractionDigits: 1 }, undefined, 2.04)).toBe('#,##0');
      expect(intlNumFormatToExcelNumFmt({ maximumFractionDigits: 1 }, undefined, 2.06)).toBe('#,##0.#');
    });

    it('should judge a percent on the value times 100', () => {
      const percent = { style: 'percent', maximumFractionDigits: 1 };

      expect(intlNumFormatToExcelNumFmt(percent, undefined, 0.12)).toBe('#,##0%');
      expect(intlNumFormatToExcelNumFmt(percent, undefined, 0.07)).toBe('#,##0%');
      expect(intlNumFormatToExcelNumFmt(percent, undefined, 0.125)).toBe('#,##0.#%');
    });

    it('should keep the symbol of a currency whose fraction digits are all optional', () => {
      const dollars = { style: 'currency', currency: 'USD', minimumFractionDigits: 0 };

      expect(intlNumFormatToExcelNumFmt(dollars, 'en-US', 5)).toBe('$#,##0');
      expect(intlNumFormatToExcelNumFmt(dollars, 'en-US', 5.5)).toBe('$#,##0.##');
    });

    it('should keep the decimal part of a format that always shows a fraction digit', () => {
      expect(intlNumFormatToExcelNumFmt({ minimumFractionDigits: 2 }, undefined, 1234)).toBe('#,##0.00#');
      expect(intlNumFormatToExcelNumFmt({ style: 'currency', currency: 'USD' }, 'en-US', 5)).toBe('$#,##0.00');
    });

    it('should keep the decimal part when the cell holds no number', () => {
      // A formula cell passes no value: its result can change in the file.
      expect(intlNumFormatToExcelNumFmt({})).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({}, undefined, null)).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({}, undefined, '1234')).toBe('#,##0.###');
      expect(intlNumFormatToExcelNumFmt({}, undefined, NaN)).toBe('#,##0.###');
    });
  });

  describe('the cache of resolved formats', () => {
    it('should build the Intl formatter once for a format and locale', () => {
      // The export resolves a format per numeric cell. Building a formatter per cell cost about
      // 4 seconds per 100,000 cells.
      const NumberFormat = jest.spyOn(Intl, 'NumberFormat');
      const options = { style: 'currency', currency: 'SEK', minimumFractionDigits: 0 };

      try {
        expect(intlNumFormatToExcelNumFmt(options, 'sv-SE', 1)).toBe('#,##0[$kr-41D]');

        const built = NumberFormat.mock.calls.length;

        expect(built).toBeGreaterThan(0);
        expect(intlNumFormatToExcelNumFmt(options, 'sv-SE', 2.5)).toBe('#,##0.##[$kr-41D]');
        expect(intlNumFormatToExcelNumFmt({ ...options }, 'sv-SE', 3)).toBe('#,##0[$kr-41D]');
        expect(NumberFormat.mock.calls.length).toBe(built);

        // Another locale is another entry.
        intlNumFormatToExcelNumFmt(options, 'nb-NO', 1);

        expect(NumberFormat.mock.calls.length).toBeGreaterThan(built);
      } finally {
        NumberFormat.mockRestore();
      }
    });

    it('should follow a format object changed in place', () => {
      const options = { maximumFractionDigits: 1 };

      expect(intlNumFormatToExcelNumFmt(options)).toBe('#,##0.#');

      options.maximumFractionDigits = 2;

      expect(intlNumFormatToExcelNumFmt(options)).toBe('#,##0.##');
    });
  });
});
