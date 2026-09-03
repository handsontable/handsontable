import { isNullishOrNaN, roundFloat } from '../utils';

describe('ColumnSummary utils', () => {
  describe('isNullishOrNaN', () => {
    it('should report nullish values as empty', () => {
      expect(isNullishOrNaN(null)).toBe(true);
      expect(isNullishOrNaN(undefined)).toBe(true);
    });

    it('should report a value that is not a number as empty', () => {
      expect(isNullishOrNaN(NaN)).toBe(true);
      expect(isNullishOrNaN('foo')).toBe(true);
      expect(isNullishOrNaN('2019-03-22')).toBe(true);
    });

    // `Number('')` is `0`, so the global `isNaN('')` is `false`. Without an explicit check an empty
    // cell reads as a real zero: `min` over 10/20/30 returns 0 and `count` counts the blank.
    it('should report an empty string as empty', () => {
      expect(isNullishOrNaN('')).toBe(true);
    });

    it('should report a whitespace-only string as empty', () => {
      expect(isNullishOrNaN(' ')).toBe(true);
      expect(isNullishOrNaN('   ')).toBe(true);
      expect(isNullishOrNaN('\t')).toBe(true);
      expect(isNullishOrNaN('\n')).toBe(true);
    });

    it('should report numbers as not empty, including zero', () => {
      expect(isNullishOrNaN(0)).toBe(false);
      expect(isNullishOrNaN(-1)).toBe(false);
      expect(isNullishOrNaN(1.5)).toBe(false);
    });

    it('should report a string holding a number as not empty', () => {
      expect(isNullishOrNaN('0')).toBe(false);
      expect(isNullishOrNaN('42')).toBe(false);
      expect(isNullishOrNaN(' 42 ')).toBe(false);
      expect(isNullishOrNaN('-1.5')).toBe(false);
    });

    // Booleans keep coercing on purpose. A `checkbox` column stores `true`/`false`, and a `sum`
    // summary over one is how you count the ticked boxes - excluding them would break that.
    it('should report booleans as not empty', () => {
      expect(isNullishOrNaN(true)).toBe(false);
      expect(isNullishOrNaN(false)).toBe(false);
    });
  });

  describe('roundFloat', () => {
    it('should return a non-numeric value untouched', () => {
      expect(roundFloat('foo', 2)).toBe('foo');
      expect(roundFloat(undefined, 2)).toBe(undefined);
    });

    it('should round to the provided number of decimal places', () => {
      expect(roundFloat(1.23456, 2)).toBe('1.23');
      expect(roundFloat(1.23456, 0)).toBe('1');
    });

    it('should round to an integer when the option is `true`', () => {
      expect(roundFloat(1.6, true)).toBe('2');
      expect(roundFloat(1.4, false)).toBe(1.4);
    });

    it('should fit the number into 8 digits when the option is `auto`', () => {
      expect(roundFloat(1.23456789, 'auto')).toBe('1.2345679');
    });
  });
});
