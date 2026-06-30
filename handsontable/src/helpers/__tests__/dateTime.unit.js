import {
  getNormalizedDate,
  ISO_DATE_REGEX,
  parseToLocalDate,
  isValidISODate,
  TIME_REGEX,
  parseToLocalTime,
  isValidTime,
} from 'handsontable/helpers/dateTime';

describe('Date helper', () => {
  describe('ISO_DATE_REGEX', () => {
    it('should match valid ISO date strings YYYY-MM-DD', () => {
      expect(ISO_DATE_REGEX.test('2020-01-01')).toBe(true);
      expect(ISO_DATE_REGEX.test('2020-12-31')).toBe(true);
      expect(ISO_DATE_REGEX.test('2016-02-29')).toBe(true);
      expect(ISO_DATE_REGEX.test('2000-06-15')).toBe(true);
    });

    it('should not match invalid formats', () => {
      expect(ISO_DATE_REGEX.test('2020/01/01')).toBe(false);
      expect(ISO_DATE_REGEX.test('01-01-2020')).toBe(false);
      expect(ISO_DATE_REGEX.test('2020-1-1')).toBe(false);
      expect(ISO_DATE_REGEX.test('2020-00-01')).toBe(false);
      expect(ISO_DATE_REGEX.test('2020-13-01')).toBe(false);
      expect(ISO_DATE_REGEX.test('2020-01-00')).toBe(false);
      expect(ISO_DATE_REGEX.test('2020-01-32')).toBe(false);
      expect(ISO_DATE_REGEX.test('')).toBe(false);
      expect(ISO_DATE_REGEX.test('2020-12-20T00:00:00')).toBe(false);
    });
  });

  describe('getNormalizedDate', () => {
    it('should return a proper date object, with time set to 00:00, when providing it with a date-only string', () => {
      const date1 = getNormalizedDate('2016-02-02');
      const date2 = getNormalizedDate('2016/02/02');
      const date3 = getNormalizedDate('02/02/2016');

      expect(date1.getDate()).toEqual(2);
      expect(date2.getDate()).toEqual(2);
      expect(date3.getDate()).toEqual(2);

      expect(date1.getMonth()).toEqual(1);
      expect(date2.getMonth()).toEqual(1);
      expect(date3.getMonth()).toEqual(1);

      expect(date1.getFullYear()).toEqual(2016);
      expect(date2.getFullYear()).toEqual(2016);
      expect(date3.getFullYear()).toEqual(2016);

      expect(date1.getFullYear()).toEqual(2016);
      expect(date2.getFullYear()).toEqual(2016);
      expect(date3.getFullYear()).toEqual(2016);

      expect(date1.getHours()).toEqual(0);
      expect(date2.getHours()).toEqual(0);
      expect(date3.getHours()).toEqual(0);

      expect(date1.getMinutes()).toEqual(0);
      expect(date2.getMinutes()).toEqual(0);
      expect(date3.getMinutes()).toEqual(0);
    });
  });

  describe('parseToLocalDate', () => {
    it('should return null for empty value', () => {
      expect(parseToLocalDate(null)).toBe(null);
      expect(parseToLocalDate(undefined)).toBe(null);
      expect(parseToLocalDate('')).toBe(null);
    });

    it('should return null for non-string value', () => {
      expect(parseToLocalDate(123)).toBe(null);
      expect(parseToLocalDate(new Date())).toBe(null);
      expect(parseToLocalDate({})).toBe(null);
    });

    it('should return null for string that does not match ISO date format', () => {
      expect(parseToLocalDate('2020/01/01')).toBe(null);
      expect(parseToLocalDate('01-01-2020')).toBe(null);
      expect(parseToLocalDate('not a date')).toBe(null);
    });

    it('should return Date at local midnight for valid ISO date string', () => {
      const date = parseToLocalDate('2020-12-20');

      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2020);
      expect(date.getMonth()).toBe(11);
      expect(date.getDate()).toBe(20);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });

    it('should parse month and day with leading zeros', () => {
      const date = parseToLocalDate('2016-02-09');

      expect(date.getFullYear()).toBe(2016);
      expect(date.getMonth()).toBe(1);
      expect(date.getDate()).toBe(9);
    });
  });

  describe('isValidISODate', () => {
    it('should return false for non-string value', () => {
      expect(isValidISODate(null)).toBe(false);
      expect(isValidISODate(undefined)).toBe(false);
      expect(isValidISODate(123)).toBe(false);
      expect(isValidISODate(new Date())).toBe(false);
    });

    it('should return false for string that does not match ISO date format', () => {
      expect(isValidISODate('')).toBe(false);
      expect(isValidISODate('2020/01/01')).toBe(false);
      expect(isValidISODate('01-01-2020')).toBe(false);
      expect(isValidISODate('2020-13-01')).toBe(false);
      expect(isValidISODate('2020-01-32')).toBe(false);
    });

    it('should return false for string that matches pattern but is not a valid calendar date', () => {
      expect(isValidISODate('2020-02-30')).toBe(false);
      expect(isValidISODate('2021-02-29')).toBe(false);
      expect(isValidISODate('2020-04-31')).toBe(false);
    });

    it('should return false for the 31st in every 30-day month', () => {
      expect(isValidISODate('2020-04-31')).toBe(false);
      expect(isValidISODate('2020-06-31')).toBe(false);
      expect(isValidISODate('2020-09-31')).toBe(false);
      expect(isValidISODate('2020-11-31')).toBe(false);
    });

    it('should apply Gregorian leap-year rules to February 29', () => {
      // Divisible by 4 (not by 100) - leap.
      expect(isValidISODate('2024-02-29')).toBe(true);
      // Not divisible by 4 - common.
      expect(isValidISODate('2023-02-29')).toBe(false);
      // Divisible by 100 but not 400 - common.
      expect(isValidISODate('1900-02-29')).toBe(false);
      expect(isValidISODate('2100-02-29')).toBe(false);
      // Divisible by 400 - leap.
      expect(isValidISODate('2000-02-29')).toBe(true);
      expect(isValidISODate('2400-02-29')).toBe(true);
    });

    it('should return true for valid ISO date string', () => {
      expect(isValidISODate('2020-01-01')).toBe(true);
      expect(isValidISODate('2020-12-31')).toBe(true);
      expect(isValidISODate('2016-02-29')).toBe(true);
      expect(isValidISODate('2000-01-15')).toBe(true);
    });

    it('should accept the last valid day of 30-day months and the year boundaries', () => {
      expect(isValidISODate('2020-04-30')).toBe(true);
      expect(isValidISODate('2020-06-30')).toBe(true);
      expect(isValidISODate('2020-09-30')).toBe(true);
      expect(isValidISODate('2020-11-30')).toBe(true);
      expect(isValidISODate('0001-01-01')).toBe(true);
      expect(isValidISODate('9999-12-31')).toBe(true);
    });

    it('should return false for ISO-like string with extra characters', () => {
      expect(isValidISODate('2020-01-01T00:00:00')).toBe(false);
      expect(isValidISODate('2020-01-01 ')).toBe(false);
    });
  });

  describe('TIME_REGEX', () => {
    it('should match HH:mm (hours and minutes only)', () => {
      expect(TIME_REGEX.test('00:00')).toBe(true);
      expect(TIME_REGEX.test('23:59')).toBe(true);
      expect(TIME_REGEX.test('12:30')).toBe(true);
      expect(TIME_REGEX.test('09:05')).toBe(true);
    });

    it('should match HH:mm:ss (with seconds)', () => {
      expect(TIME_REGEX.test('00:00:00')).toBe(true);
      expect(TIME_REGEX.test('12:30:00')).toBe(true);
      expect(TIME_REGEX.test('23:59:59')).toBe(true);
      expect(TIME_REGEX.test('14:30:45')).toBe(true);
    });

    it('should match HH:mm:ss.SSS (with milliseconds, 1–3 digits)', () => {
      expect(TIME_REGEX.test('00:00:00.000')).toBe(true);
      expect(TIME_REGEX.test('14:30:45.123')).toBe(true);
      expect(TIME_REGEX.test('14:30:45.1')).toBe(true);
      expect(TIME_REGEX.test('14:30:45.12')).toBe(true);
      expect(TIME_REGEX.test('23:59:59.999')).toBe(true);
    });

    it('should not match invalid formats', () => {
      expect(TIME_REGEX.test('')).toBe(false);
      expect(TIME_REGEX.test('24:00')).toBe(false);
      expect(TIME_REGEX.test('12:60')).toBe(false);
      expect(TIME_REGEX.test('12:30:60')).toBe(false);
      expect(TIME_REGEX.test('9:30')).toBe(false);
      expect(TIME_REGEX.test('12:5')).toBe(false);
      expect(TIME_REGEX.test('12:30:00.1234')).toBe(false);
      expect(TIME_REGEX.test(' 12:30')).toBe(false);
      expect(TIME_REGEX.test('12:30 ')).toBe(false);
    });
  });

  describe('parseToLocalTime', () => {
    it('should return null for empty or non-string values', () => {
      expect(parseToLocalTime(null)).toBe(null);
      expect(parseToLocalTime(undefined)).toBe(null);
      expect(parseToLocalTime('')).toBe(null);
    });

    it('should return null for non-time values', () => {
      expect(parseToLocalTime(123)).toBe(null);
      expect(parseToLocalTime('9:30')).toBe(null);
      expect(parseToLocalTime('25:00')).toBe(null);
    });

    it('should return Date with correct hours and minutes on epoch date', () => {
      const date = parseToLocalTime('14:30');

      expect(date).not.toBe(null);
      expect(date.getFullYear()).toBe(1970);
      expect(date.getMonth()).toBe(0);
      expect(date.getDate()).toBe(1);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(0);
    });

    it('should parse midnight and end of day', () => {
      const midnight = parseToLocalTime('00:00');

      expect(midnight.getHours()).toBe(0);
      expect(midnight.getMinutes()).toBe(0);

      const endOfDay = parseToLocalTime('23:59');

      expect(endOfDay.getHours()).toBe(23);
      expect(endOfDay.getMinutes()).toBe(59);
    });

    it('should parse HH:mm:ss with seconds', () => {
      const date = parseToLocalTime('14:30:45');

      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
      expect(date.getMilliseconds()).toBe(0);
    });

    it('should parse HH:mm:ss.SSS with milliseconds', () => {
      const date = parseToLocalTime('14:30:45.123');

      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(30);
      expect(date.getSeconds()).toBe(45);
      expect(date.getMilliseconds()).toBe(123);
    });

    it('should normalize short fractional part to milliseconds', () => {
      const date = parseToLocalTime('00:00:00.1');

      expect(date.getMilliseconds()).toBe(100);
    });
  });

  describe('isValidTime', () => {
    it('should return false for non-string values', () => {
      expect(isValidTime(null)).toBe(false);
      expect(isValidTime(undefined)).toBe(false);
      expect(isValidTime(123)).toBe(false);
    });

    it('should return false for invalid time strings', () => {
      expect(isValidTime('')).toBe(false);
      expect(isValidTime('24:00')).toBe(false);
      expect(isValidTime('12:60')).toBe(false);
      expect(isValidTime('9:30')).toBe(false);
      expect(isValidTime('12:30 ')).toBe(false);
      expect(isValidTime('12:30:00.1234')).toBe(false);
    });

    it('should return true for valid HH:mm, HH:mm:ss, and HH:mm:ss.SSS strings', () => {
      expect(isValidTime('00:00')).toBe(true);
      expect(isValidTime('23:59')).toBe(true);
      expect(isValidTime('12:30')).toBe(true);
      expect(isValidTime('12:30:00')).toBe(true);
      expect(isValidTime('14:30:45.123')).toBe(true);
    });
  });
});
