import {
  captureCurrency,
  classifyTemporalFormat,
  isTemporalFormatCode,
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
