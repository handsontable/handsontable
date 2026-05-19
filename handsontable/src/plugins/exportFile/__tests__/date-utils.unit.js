import {
  toExcelDateSerial,
  parseIsoStringToSerial,
  parseTimeStringToSerial,
  getDateNumFmt,
  getTimeNumFmt,
} from '../types/xlsx/date-utils';

describe('toExcelDateSerial', () => {
  it('should convert the Excel epoch origin (1900-01-01) to serial 2', () => {
    // Excel erroneously treats 1900 as a leap year, so 1900-01-01 = serial 2
    // (serial 1 = 1900-01-00 phantom day). The function uses the standard
    // offset from 1899-12-30, which produces the correct result for all real dates.
    expect(toExcelDateSerial(new Date(1900, 0, 1))).toBe(2);
  });

  it('should convert 1900-01-00 anchor (1899-12-31) to serial 1', () => {
    expect(toExcelDateSerial(new Date(1899, 11, 31))).toBe(1);
  });

  it('should convert a known modern date (2024-01-01) to its serial', () => {
    // Verified against Excel / Google Sheets
    expect(toExcelDateSerial(new Date(2024, 0, 1))).toBe(45292);
  });
});

describe('parseIsoStringToSerial', () => {
  it('should parse a valid ISO date string to the correct serial number', () => {
    expect(parseIsoStringToSerial('2024-01-01')).toBe(45292);
  });

  it('should return null for a non-ISO string', () => {
    expect(parseIsoStringToSerial('01/01/2024')).toBeNull();
    expect(parseIsoStringToSerial('January 1 2024')).toBeNull();
  });

  it('should return null for a falsy value', () => {
    expect(parseIsoStringToSerial(null)).toBeNull();
    expect(parseIsoStringToSerial(undefined)).toBeNull();
    expect(parseIsoStringToSerial('')).toBeNull();
  });
});

describe('parseTimeStringToSerial', () => {
  it('should parse a 24-hour HH:mm string to a fractional day', () => {
    expect(parseTimeStringToSerial('12:00')).toBeCloseTo(0.5, 10);
    expect(parseTimeStringToSerial('00:00')).toBe(0);
    expect(parseTimeStringToSerial('06:00')).toBeCloseTo(0.25, 10);
  });

  it('should parse a 24-hour HH:mm:ss string to a fractional day', () => {
    expect(parseTimeStringToSerial('12:00:00')).toBeCloseTo(0.5, 10);
    expect(parseTimeStringToSerial('23:59:59')).toBeCloseTo(((23 * 3600) + (59 * 60) + 59) / 86400, 10);
  });

  it('should parse a 12-hour AM/PM string to a fractional day', () => {
    expect(parseTimeStringToSerial('12:00 PM')).toBeCloseTo(0.5, 10);
    expect(parseTimeStringToSerial('12:00 AM')).toBe(0);
    expect(parseTimeStringToSerial('6:00 AM')).toBeCloseTo(0.25, 10);
    expect(parseTimeStringToSerial('6:00 PM')).toBeCloseTo(0.75, 10);
  });

  it('should parse a 12-hour AM/PM string with seconds', () => {
    expect(parseTimeStringToSerial('1:30:00 PM')).toBeCloseTo(((13 * 3600) + (30 * 60)) / 86400, 10);
  });

  it('should return null for an out-of-range time', () => {
    expect(parseTimeStringToSerial('25:00')).toBeNull();
    expect(parseTimeStringToSerial('12:60')).toBeNull();
  });

  it('should return null for a non-time string', () => {
    expect(parseTimeStringToSerial('not-a-time')).toBeNull();
  });

  it('should return null for a falsy value', () => {
    expect(parseTimeStringToSerial(null)).toBeNull();
    expect(parseTimeStringToSerial(undefined)).toBeNull();
    expect(parseTimeStringToSerial('')).toBeNull();
  });
});

describe('getDateNumFmt', () => {
  it('should return the Excel date format string', () => {
    expect(getDateNumFmt()).toBe('mm-dd-yy');
  });
});

describe('getTimeNumFmt', () => {
  it('should return the Excel time format string', () => {
    expect(getTimeNumFmt()).toBe('h:mm:ss');
  });
});
