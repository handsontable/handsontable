import {
  captureCurrency,
  classifyTemporalFormat,
  isGeneralFormatCode,
  isNegativeSectionShowable,
  isTemporalFormatCode,
  isZeroSectionShowable,
  positiveFormatSection,
  stripFormatDecorations,
} from '../numFmtCode';

describe('stripFormatDecorations', () => {
  it('should drop bracket sections, quoted literals and backslash-escaped characters', () => {
    expect(stripFormatDecorations('[$-409][Red]0.0"days"\\h')).toBe('0.0');
  });

  it('should keep an elapsed-time section when asked, and drop every other bracket section', () => {
    expect(stripFormatDecorations('[Red][h]:mm', { keepElapsed: true })).toBe('[h]:mm');
    expect(stripFormatDecorations('[mm]:ss', { keepElapsed: true })).toBe('[mm]:ss');
    expect(stripFormatDecorations('[h]:mm')).toBe(':mm');
  });

  it('should strip a long run of unclosed brackets in linear time', () => {
    const hostile = '['.repeat(100000);
    const startedAt = performance.now();

    stripFormatDecorations(hostile, { keepElapsed: true });
    stripFormatDecorations(hostile);

    expect(performance.now() - startedAt).toBeLessThan(200);
  });
});

describe('positiveFormatSection', () => {
  it('should cut at the first unquoted `;` and drop `_x` padding and `*x` fill', () => {
    expect(positiveFormatSection('#,##0;[Red]-#,##0')).toBe('#,##0');
    expect(positiveFormatSection('_("$"* #,##0.00_);_("$"* \\(#,##0.00\\)')).toBe('"$"#,##0.00');
    expect(positiveFormatSection('0" a;b";0')).toBe('0" a;b"');
    expect(positiveFormatSection('0\\;0;-0')).toBe('0\\;0');
    expect(positiveFormatSection('0.00')).toBe('0.00');
    expect(positiveFormatSection('"unterminated')).toBe('"unterminated');
  });

  it('should stay linear on a long hostile code', () => {
    const start = Date.now();

    positiveFormatSection(`${'"'.repeat(100000)}${'_'.repeat(100000)}`);

    expect(Date.now() - start).toBeLessThan(1000);
  });
});

describe('captureCurrency', () => {
  it('should read a quoted currency literal at either end of the pattern', () => {
    // `"$"#,##0.00` is what Excel's en-US Currency style writes.
    expect(captureCurrency('"$"#,##0.00')).toEqual({ currency: 'USD', rest: '#,##0.00' });
    expect(captureCurrency('#,##0.00" €"')).toEqual({ currency: 'EUR', rest: '#,##0.00' });
    expect(captureCurrency('"CHF "#,##0')).toEqual({ currency: 'CHF', rest: '#,##0' });
  });

  it('should not read a quoted literal that is not a known symbol as a currency', () => {
    expect(captureCurrency('0" units"')).toEqual({ currency: null, rest: '0" units"' });
    expect(captureCurrency('"Total "0')).toEqual({ currency: null, rest: '"Total "0' });
    expect(captureCurrency('"ABCD"0')).toEqual({ currency: null, rest: '"ABCD"0' });
  });

  it('should read a quoted ISO code or dollar composite next to the number, the way the export writes it', () => {
    expect(captureCurrency('#,##0.00"USD"')).toEqual({ currency: 'USD', rest: '#,##0.00' });
    expect(captureCurrency('"EUR"#,##0.00')).toEqual({ currency: 'EUR', rest: '#,##0.00' });
    expect(captureCurrency('"HK$"#,##0')).toEqual({ currency: 'HKD', rest: '#,##0' });
    expect(captureCurrency('#,##0" US$"')).toEqual({ currency: 'USD', rest: '#,##0' });
    // Not next to a digit placeholder: a label, not a currency.
    expect(captureCurrency('"USD" @')).toEqual({ currency: null, rest: '"USD" @' });
    // An unknown dollar composite is no currency.
    expect(captureCurrency('"ZZ$"#,##0').currency).toBeNull();
  });

  it('should read a currency escaped one character at a time at either end of the pattern', () => {
    // Excel saves an unquoted multi-letter symbol with a backslash before every character.
    expect(captureCurrency('#,##0.00\\z\\\u0142')).toEqual({ currency: 'PLN', rest: '#,##0.00' });
    expect(captureCurrency('\\C\\H\\F#,##0.00')).toEqual({ currency: 'CHF', rest: '#,##0.00' });
    expect(captureCurrency('\\C\\H\\F\\ #,##0.00')).toEqual({ currency: 'CHF', rest: '#,##0.00' });
    // Excel's re-save of the koruna and the forint, one backslash per character.
    expect(captureCurrency('#,##0.00\\K\\\u010D')).toEqual({ currency: 'CZK', rest: '#,##0.00' });
    expect(captureCurrency('#,##0.00\\ \\F\\t')).toEqual({ currency: 'HUF', rest: '#,##0.00' });
    expect(captureCurrency('#,##0.00\\ \\U\\S\\D')).toEqual({ currency: 'USD', rest: '#,##0.00' });
    expect(captureCurrency('\\H\\K\\$#,##0')).toEqual({ currency: 'HKD', rest: '#,##0' });
    // An escaped literal that is not a currency stays in the pattern.
    expect(captureCurrency('0.0\\%')).toEqual({ currency: null, rest: '0.0\\%' });
    expect(captureCurrency('0\\p\\c')).toEqual({ currency: null, rest: '0\\p\\c' });
  });
});

describe('classifyTemporalFormat', () => {
  it('should classify an elapsed-time section as a time, whatever the rest of the code reads like', () => {
    // Stripped first, `[h]:mm` left `:mm`, a bare month - a timesheet column imported as 1899 dates.
    expect(classifyTemporalFormat('[h]:mm')).toBe('time');
    expect(classifyTemporalFormat('[hh]:mm')).toBe('time');
    expect(classifyTemporalFormat('[m]')).toBe('time');
    expect(classifyTemporalFormat('[mm]:ss')).toBe('time');
    expect(classifyTemporalFormat('[s]')).toBe('time');
  });

  it('should classify dates, times and date-times and leave numbers alone', () => {
    expect(classifyTemporalFormat('yyyy-mm-dd')).toBe('date');
    expect(classifyTemporalFormat('h:mm AM/PM')).toBe('time');
    expect(classifyTemporalFormat('mm-dd-yy h:mm')).toBe('datetime');
    expect(classifyTemporalFormat('#,##0.00')).toBeNull();
    expect(classifyTemporalFormat('General')).toBeNull();
  });

  it('should not read a currency code or an escaped letter as a date or time code', () => {
    expect(classifyTemporalFormat('CHF #,##0')).toBeNull();
    expect(classifyTemporalFormat('SEK#,##0')).toBeNull();
    expect(classifyTemporalFormat('HK$#,##0')).toBeNull();
    expect(classifyTemporalFormat('0.0\\h')).toBeNull();
    expect(classifyTemporalFormat('0 "days"')).toBeNull();
    expect(classifyTemporalFormat('\\C\\H\\F#,##0.00')).toBeNull();
    expect(classifyTemporalFormat('#,##0.00\\S\\E\\K')).toBeNull();
  });

  it('should not classify a format code longer than Excel accepts', () => {
    expect(classifyTemporalFormat(`yyyy${'0'.repeat(300)}`)).toBeNull();
  });
});

describe('isTemporalFormatCode', () => {
  it('should answer the question the date1904 shift asks, the same way the import types the column', () => {
    // The native reader shifts a 1904 workbook's serial by 1462 days when the format reads as a
    // date or time. A format the import types as numeric must not be shifted, or `5` under `0.0\h`
    // imports as 1467.
    expect(isTemporalFormatCode('0.0\\h')).toBe(false);
    expect(isTemporalFormatCode('CHF #,##0')).toBe(false);
    expect(isTemporalFormatCode(null)).toBe(false);
    expect(isTemporalFormatCode('yyyy-mm-dd')).toBe(true);
    expect(isTemporalFormatCode('[h]:mm')).toBe(true);
    expect(isTemporalFormatCode('[$-409]mmm d, yyyy')).toBe(true);
  });
});

describe('classifyTemporalFormat (review round 5)', () => {
  it('should not classify a code with a condition section as temporal', () => {
    // ExcelJS strips LibreOffice's `\M`, so the code reads a bare `M`.
    expect(classifyTemporalFormat('[>=1000000]0.0,,M;[>=1000]0.0,K;0')).toBeNull();
    expect(isTemporalFormatCode('[>=1000000]0.0,,M;[>=1000]0.0,K;0')).toBe(false);
    expect(classifyTemporalFormat('[<1]0.0d;0')).toBeNull();
    // A single-section condition is not a split, so a date stays a date.
    expect(classifyTemporalFormat('[Red]yyyy-mm-dd')).toBe('date');
  });
});

describe('captureCurrency (review round 5)', () => {
  it('should map an ambiguous symbol in a locale token by its LCID', () => {
    expect(captureCurrency('#,##0.00[$kr-414]')).toEqual({ currency: 'NOK', rest: '#,##0.00' });
    expect(captureCurrency('#,##0.00[$kr-0414]').currency).toBe('NOK');
    expect(captureCurrency('#,##0.00[$kr-41d]').currency).toBe('SEK');
    expect(captureCurrency('#,##0.00[$kr.-406]').currency).toBe('DKK');
    expect(captureCurrency('[$\u00A5-804]#,##0').currency).toBe('CNY');
    expect(captureCurrency('[$kr-constructor]0').currency).toBe('SEK');
    expect(captureCurrency('[$constructor-414]0').currency).toBeNull();
  });
});

describe('captureCurrency (review round 7)', () => {
  it('should read a three-letter label that is no ISO 4217 code as a label, padded or not', () => {
    expect(captureCurrency('#,##0" PCS"').currency).toBeNull();
    expect(captureCurrency('0" DAY"').currency).toBeNull();
    expect(captureCurrency('0.00"MPH"').currency).toBeNull();
    expect(captureCurrency('"QTY "0').currency).toBeNull();
    expect(captureCurrency('0 "RPM"').currency).toBeNull();
    expect(captureCurrency('0.0"ABC"').currency).toBeNull();
    expect(captureCurrency('#,##0.0\\ \\P\\C\\S').currency).toBeNull();
    expect(captureCurrency('#,##0.0 PCS').currency).toBeNull();
    expect(captureCurrency('#,##0.00"NIS"').currency).toBeNull();
  });

  it('should keep reading the codes, symbols and composites the export writes', () => {
    expect(captureCurrency('"USD"#,##0.00')).toEqual({ currency: 'USD', rest: '#,##0.00' });
    expect(captureCurrency('#,##0.00"CHF"')).toEqual({ currency: 'CHF', rest: '#,##0.00' });
    expect(captureCurrency('#,##0.00"RON"')).toEqual({ currency: 'RON', rest: '#,##0.00' });
    expect(captureCurrency('CHF#,##0.00').currency).toBe('CHF');
    expect(captureCurrency('SEK#,##0').currency).toBe('SEK');
    expect(captureCurrency('"CHF "#,##0').currency).toBe('CHF');
    expect(captureCurrency('#,##0.00" kr"').currency).toBe('SEK');
    expect(captureCurrency('#,##0" US$"').currency).toBe('USD');
    // Padded real codes are currencies: Excel re-saves `#,##0.00 USD` escaped, LibreOffice pads RON.
    expect(captureCurrency('#,##0.00\\ \\U\\S\\D').currency).toBe('USD');
    expect(captureCurrency('#,##0.00" RON"').currency).toBe('RON');
    expect(captureCurrency('#,##0.00 PLN').currency).toBe('PLN');
    // A label that is also a real code stays ambiguous and reads as the currency (the Kyrgyz som).
    expect(captureCurrency('0.0"KGS"').currency).toBe('KGS');
    expect(captureCurrency('0.0" KGS"').currency).toBe('KGS');
    expect(captureCurrency('#,##0.0\\ \\K\\G\\S').currency).toBe('KGS');
  });

  it('should map a dollar locale token by its LCID, and keep any other dollar token the US dollar', () => {
    expect(captureCurrency('[$$-C09]#,##0.00')).toEqual({ currency: 'AUD', rest: '#,##0.00' });
    expect(captureCurrency('[$$-1009]#,##0.00').currency).toBe('CAD');
    expect(captureCurrency('#,##0.00[$$-C0C]').currency).toBe('CAD');
    expect(captureCurrency('[$$-1409]#,##0.00').currency).toBe('NZD');
    expect(captureCurrency('[$$-80A]#,##0.00').currency).toBe('MXN');
    expect(captureCurrency('[$$-409]#,##0.00').currency).toBe('USD');
    expect(captureCurrency('[$$-414]#,##0.00').currency).toBe('USD');
    expect(captureCurrency('$#,##0.00').currency).toBe('USD');
  });
});

describe('isNegativeSectionShowable (review round 7)', () => {
  it('should read a negative section padded with an escaped space as a plain minus', () => {
    // Excel writes `0.00_ ;\-0.00\ `: the `_ ` pads the positive section, `\ ` the negative one.
    expect(isNegativeSectionShowable('0.00_ ;\\-0.00\\ ')).toBe(true);
    expect(isNegativeSectionShowable('0.00;\\-0.00\\ ')).toBe(true);
    expect(isNegativeSectionShowable('#,##0.00_ ;[Red]\\-#,##0.00\\ ')).toBe(true);
    expect(isNegativeSectionShowable('[$$-409]#,##0_ ;[Red]\\-[$$-409]#,##0\\ ')).toBe(true);
    expect(isNegativeSectionShowable('0.00;[Red]0.00')).toBe(false);
  });
});

describe('isZeroSectionShowable', () => {
  it('should answer false for a zero section that shows text or nothing', () => {
    expect(isZeroSectionShowable('#,##0.00;-#,##0.00;"zero"')).toBe(false);
    expect(isZeroSectionShowable('0;-0;;@')).toBe(false);
    expect(isZeroSectionShowable('#,##0;-#,##0;"-"')).toBe(false);
    expect(isZeroSectionShowable('0.0;-0.0;"n/a"')).toBe(false);
    expect(isZeroSectionShowable('0;-0;\\-')).toBe(false);
  });

  it('should answer true for a code with no zero section or a zero section that shows digits', () => {
    expect(isZeroSectionShowable('#,##0.00')).toBe(true);
    expect(isZeroSectionShowable('#,##0;-#,##0')).toBe(true);
    expect(isZeroSectionShowable('#,##0;-#,##0;0')).toBe(true);
    expect(isZeroSectionShowable('[Blue]0.00;[Red]-0.00;[Green]0.00')).toBe(true);
    expect(isZeroSectionShowable('0;-0;0;"text: "@')).toBe(true);
  });
});

describe('isGeneralFormatCode', () => {
  it('should read General in any case', () => {
    expect(isGeneralFormatCode('General')).toBe(true);
    expect(isGeneralFormatCode('GENERAL')).toBe(true);
    expect(isGeneralFormatCode('general')).toBe(true);
    expect(isGeneralFormatCode('General;-General')).toBe(false);
    expect(isGeneralFormatCode('0')).toBe(false);
    expect(isGeneralFormatCode(null)).toBe(false);
  });
});

describe('stripFormatDecorations (review round 7)', () => {
  it('should leave a separator where a literal was when asked, so the codes around it stay apart', () => {
    // Deleted, `dddd\,\ d` fused into `ddddd`, one weekday run, and the day of the month was lost.
    expect(stripFormatDecorations('dddd\\,\\ d\\ mmmm', { separateLiterals: true })).toBe('dddd  d mmmm');
    expect(stripFormatDecorations('d"x"d[Red]d', { separateLiterals: true })).toBe('d d d');
    expect(stripFormatDecorations('[h]:mm"x"', { keepElapsed: true, separateLiterals: true })).toBe('[h]:mm ');
    expect(stripFormatDecorations('dddd\\,\\ d')).toBe('ddddd');
  });
});

describe('captureCurrency without Intl.supportedValuesOf', () => {
  it('should fall back to a built-in list of ISO 4217 codes', () => {
    const original = Intl.supportedValuesOf;

    Intl.supportedValuesOf = undefined;

    try {
      jest.isolateModules(() => {
        // eslint-disable-next-line global-require
        const { captureCurrency: isolated } = require('../numFmtCode');

        expect(isolated('#,##0.00" RON"').currency).toBe('RON');
        expect(isolated('"USD"#,##0.00').currency).toBe('USD');
        expect(isolated('0" DAY"').currency).toBeNull();
      });
    } finally {
      Intl.supportedValuesOf = original;
    }
  });
});

describe('captureCurrency (review round 12)', () => {
  it('should map the full-width yen sign in a locale token by its LCID, like the half-width one', () => {
    expect(captureCurrency('[$￥-804]#,##0.00')).toEqual({ currency: 'CNY', rest: '#,##0.00' });
    expect(captureCurrency('[$￥-411]#,##0').currency).toBe('JPY');
    expect(captureCurrency('[$¥-804]#,##0').currency).toBe('CNY');
  });

  it('should read the symbol behind a leading color, condition-free locale or color index section', () => {
    expect(captureCurrency('[Red]"$"#,##0.00').currency).toBe('USD');
    expect(captureCurrency('[Color10]"€"#,##0.00').currency).toBe('EUR');
    expect(captureCurrency('[$-409]"$"#,##0.00').currency).toBe('USD');
    expect(captureCurrency('[Blue][$-409]#,##0.00"zł"').currency).toBe('PLN');
  });

  it('should keep the leading sections in the rest, so the pattern reads as before', () => {
    expect(captureCurrency('[Red]"$"#,##0.00')).toEqual({ currency: 'USD', rest: '[Red]#,##0.00' });
  });

  it('should read an ISO code written as the symbol of a locale token', () => {
    expect(captureCurrency('[$USD] #,##0.00')).toEqual({ currency: 'USD', rest: ' #,##0.00' });
    expect(captureCurrency('#,##0.00 [$EUR]').currency).toBe('EUR');
    expect(captureCurrency('[$ABC] #,##0.00').currency).toBeNull();
  });

  it('should leave a color or locale section without a currency as no currency', () => {
    expect(captureCurrency('[Red]#,##0.00').currency).toBeNull();
    expect(captureCurrency('[$-409]#,##0.00').currency).toBeNull();
    expect(captureCurrency('[$-F800]dddd, mmmm dd, yyyy').currency).toBeNull();
  });
});
