import {
  rangeEach,
  rangeEachReverse,
  isNumeric,
  isNumericLike,
} from 'handsontable/helpers/number';

describe('Number helper', () => {
  //
  // Handsontable.helper.rangeEach
  //
  describe('rangeEach', () => {
    it('should iterate increasingly, when `from` and `to` arguments are passed and `from` number is lower then `to`', () => {
      const spy = jasmine.createSpy();

      rangeEach(-1, 2, spy);

      expect(spy.calls.count()).toBe(4);
      expect(spy.calls.argsFor(0)).toEqual([-1]);
      expect(spy.calls.argsFor(1)).toEqual([0]);
      expect(spy.calls.argsFor(2)).toEqual([1]);
      expect(spy.calls.argsFor(3)).toEqual([2]);
    });

    it('should iterate only once, when `from` and `to` arguments are equal', () => {
      const spy = jasmine.createSpy();

      rangeEach(10, 10, spy);

      expect(spy.calls.count()).toBe(1);
      expect(spy.calls.argsFor(0)).toEqual([10]);
    });

    it('should iterate only once, when `from` and `to` arguments are equal and from value is zero', () => {
      const spy = jasmine.createSpy();

      rangeEach(0, spy);

      expect(spy.calls.count()).toBe(1);
      expect(spy.calls.argsFor(0)).toEqual([0]);
    });

    it('should iterate increasingly from 0, when only `from` argument is passed', () => {
      const spy = jasmine.createSpy();

      rangeEach(4, spy);

      expect(spy.calls.count()).toBe(5);
      expect(spy.calls.argsFor(0)).toEqual([0]);
      expect(spy.calls.argsFor(4)).toEqual([4]);
    });

    it('should not iterate decreasingly, when `from` and `to` arguments are passed and `from` number is higher then `to`', () => {
      const spy = jasmine.createSpy();

      rangeEach(1, -3, spy);

      expect(spy.calls.count()).toBe(0);
    });
  });

  //
  // Handsontable.helper.rangeEachReverse
  //
  describe('rangeEachReverse', () => {
    it('should iterate decreasingly, when `from` and `to` arguments are passed and `from` number is higher then `to`', () => {
      const spy = jasmine.createSpy();

      rangeEachReverse(2, -1, spy);

      expect(spy.calls.count()).toBe(4);
      expect(spy.calls.argsFor(0)).toEqual([2]);
      expect(spy.calls.argsFor(1)).toEqual([1]);
      expect(spy.calls.argsFor(2)).toEqual([0]);
      expect(spy.calls.argsFor(3)).toEqual([-1]);
    });

    it('should iterate only once, when `from` and `to` arguments are equal', () => {
      const spy = jasmine.createSpy();

      rangeEachReverse(10, 10, spy);

      expect(spy.calls.count()).toBe(1);
      expect(spy.calls.argsFor(0)).toEqual([10]);
    });

    it('should iterate only once, when `from` and `to` arguments are equal and from value is zero', () => {
      const spy = jasmine.createSpy();

      rangeEachReverse(0, spy);

      expect(spy.calls.count()).toBe(1);
      expect(spy.calls.argsFor(0)).toEqual([0]);
    });

    it('should iterate decreasingly to 0, when only `from` argument is passed', () => {
      const spy = jasmine.createSpy();

      rangeEachReverse(4, spy);

      expect(spy.calls.count()).toBe(5);
      expect(spy.calls.argsFor(0)).toEqual([4]);
      expect(spy.calls.argsFor(4)).toEqual([0]);
    });

    it('should not iterate increasingly, when `from` and `to` arguments are passed and `from` number is higher then `to`', () => {
      const spy = jasmine.createSpy();

      rangeEachReverse(1, 5, spy);

      expect(spy.calls.count()).toBe(0);
    });
  });

  //
  // Handsontable.helper.isNumeric
  //
  describe('isNumeric', () => {
    it('should return `false` for non-numeric values', () => {
      expect(isNumeric()).toBeFalsy();
      expect(isNumeric(null)).toBeFalsy();
      expect(isNumeric('')).toBeFalsy();
      expect(isNumeric(' ')).toBeFalsy();
      expect(isNumeric('a')).toBeFalsy();
      expect(isNumeric('abcd')).toBeFalsy();
      expect(isNumeric('a1.22')).toBeFalsy();
      expect(isNumeric('1.22a')).toBeFalsy();
      expect(isNumeric('1,22')).toBeFalsy();
      expect(isNumeric('10.0,00')).toBeFalsy();
      expect(isNumeric('10,0.00')).toBeFalsy();
      expect(isNumeric('e+22')).toBeFalsy();
      expect(isNumeric([1])).toBeFalsy();
      expect(isNumeric({})).toBeFalsy();
      expect(isNumeric(new Date())).toBeFalsy();
    });

    it('should return `true` for numeric values (number type)', () => {
      expect(isNumeric(0.001)).toBeTruthy();
      expect(isNumeric(0)).toBeTruthy();
      expect(isNumeric(1)).toBeTruthy();
      expect(isNumeric(-10000)).toBeTruthy();
      expect(isNumeric(10000)).toBeTruthy();
      expect(isNumeric(-10.000)).toBeTruthy();
      expect(isNumeric(10.000)).toBeTruthy();
      expect(isNumeric(1e+26)).toBeTruthy();
    });

    it('should return `true` for numeric values (string type)', () => {
      expect(isNumeric('.001')).toBeTruthy();
      expect(isNumeric('0.001')).toBeTruthy();
      expect(isNumeric('0')).toBeTruthy();
      expect(isNumeric('1')).toBeTruthy();
      expect(isNumeric('-10000')).toBeTruthy();
      expect(isNumeric('10000')).toBeTruthy();
      expect(isNumeric('-10.000')).toBeTruthy();
      expect(isNumeric('10.000')).toBeTruthy();
      expect(isNumeric('1e+26')).toBeTruthy();
      expect(isNumeric('0.45e+26')).toBeTruthy();
      expect(isNumeric('.45e+26')).toBeTruthy();
    });

    it('should detect hexadecimal values correctly', () => {
      expect(isNumeric('0xA')).toBeTruthy();
      expect(isNumeric('0x1')).toBeTruthy();
      expect(isNumeric('0xabcdef')).toBeTruthy();
      expect(isNumeric('0xABCDEF')).toBeTruthy();
      expect(isNumeric('0xabc123')).toBeTruthy();
      expect(isNumeric('0xABC123')).toBeTruthy();

      expect(isNumeric('0xabcdefghi')).toBeFalsy();
      expect(isNumeric('0xqwerty')).toBeFalsy();
      expect(isNumeric('0x12AH')).toBeFalsy();
      expect(isNumeric('0xABCG')).toBeFalsy();
      expect(isNumeric('0xG')).toBeFalsy();
    });

    it('should return `true` for numeric values with whitespaces (string type)', () => {
      expect(isNumeric('   .020   ')).toBeTruthy();
      expect(isNumeric('   0.020   ')).toBeTruthy();
      expect(isNumeric('   0   ')).toBeTruthy();
      expect(isNumeric('   1   ')).toBeTruthy();
      expect(isNumeric('   -   10000   ')).toBeTruthy();
      expect(isNumeric('   10000   ')).toBeTruthy();
      expect(isNumeric('   -   10.000   ')).toBeTruthy();
      expect(isNumeric('   10.000   ')).toBeTruthy();
      expect(isNumeric('   1e+26   ')).toBeTruthy();
      expect(isNumeric('   1e+26   ')).toBeTruthy();
      expect(isNumeric('   0.2e+26   ')).toBeTruthy();
      expect(isNumeric('   .2e+26   ')).toBeTruthy();
    });
  });

  //
  // Handsontable.helper.isNumericLike
  //
  describe('isNumericLike', () => {
    it('should return `false` for non-numeric values', () => {
      expect(isNumericLike()).toBeFalsy();
      expect(isNumericLike(null)).toBeFalsy();
      expect(isNumericLike('')).toBeFalsy();
      expect(isNumericLike(' ')).toBeFalsy();
      expect(isNumericLike('a')).toBeFalsy();
      expect(isNumericLike('abcd')).toBeFalsy();
      expect(isNumericLike('a1.22')).toBeFalsy();
      expect(isNumericLike('1.22a')).toBeFalsy();
      expect(isNumericLike('1,22a')).toBeFalsy();
      expect(isNumericLike('10.0,00')).toBeFalsy();
      expect(isNumericLike('10,0.00')).toBeFalsy();
      expect(isNumericLike('e+22')).toBeFalsy();
      expect(isNumericLike([1])).toBeFalsy();
      expect(isNumericLike({})).toBeFalsy();
      expect(isNumericLike(new Date())).toBeFalsy();
    });

    it('should return `true` for numeric values (number type)', () => {
      expect(isNumericLike(0.001)).toBeTruthy();
      expect(isNumericLike(0)).toBeTruthy();
      expect(isNumericLike(1)).toBeTruthy();
      expect(isNumericLike(-10000)).toBeTruthy();
      expect(isNumericLike(10000)).toBeTruthy();
      expect(isNumericLike(-10.000)).toBeTruthy();
      expect(isNumericLike(10.000)).toBeTruthy();
      expect(isNumericLike(1e+26)).toBeTruthy();
    });

    it('should return `true` for numeric values (string type)', () => {
      expect(isNumericLike('.001')).toBeTruthy();
      expect(isNumericLike(',001')).toBeTruthy();
      expect(isNumericLike('0.001')).toBeTruthy();
      expect(isNumericLike('0,001')).toBeTruthy();
      expect(isNumericLike('0')).toBeTruthy();
      expect(isNumericLike('1')).toBeTruthy();
      expect(isNumericLike('-10000')).toBeTruthy();
      expect(isNumericLike('10000')).toBeTruthy();
      expect(isNumericLike('-10.000')).toBeTruthy();
      expect(isNumericLike('10.000')).toBeTruthy();
      expect(isNumericLike('-10,000')).toBeTruthy();
      expect(isNumericLike('10,000')).toBeTruthy();
      expect(isNumericLike('1e+26')).toBeTruthy();
      expect(isNumericLike('0.45e+26')).toBeTruthy();
      expect(isNumericLike('.45e+26')).toBeTruthy();
      expect(isNumericLike('0,45e+26')).toBeTruthy();
      expect(isNumericLike(',45e+26')).toBeTruthy();
    });

    it('should detect hexadecimal values correctly', () => {
      expect(isNumericLike('0xA')).toBeTruthy();
      expect(isNumericLike('0x1')).toBeTruthy();
      expect(isNumericLike('0xabcdef')).toBeTruthy();
      expect(isNumericLike('0xABCDEF')).toBeTruthy();
      expect(isNumericLike('0xabc123')).toBeTruthy();
      expect(isNumericLike('0xABC123')).toBeTruthy();

      expect(isNumericLike('0xabcdefghi')).toBeFalsy();
      expect(isNumericLike('0xqwerty')).toBeFalsy();
      expect(isNumericLike('0x12AH')).toBeFalsy();
      expect(isNumericLike('0xABCG')).toBeFalsy();
      expect(isNumericLike('0xG')).toBeFalsy();
    });

    it('should return `true` for numeric values with whitespaces (string type)', () => {
      expect(isNumericLike('   .020   ')).toBeTruthy();
      expect(isNumericLike('   ,020   ')).toBeTruthy();
      expect(isNumericLike('   0.020   ')).toBeTruthy();
      expect(isNumericLike('   0,020   ')).toBeTruthy();
      expect(isNumericLike('   0   ')).toBeTruthy();
      expect(isNumericLike('   1   ')).toBeTruthy();
      expect(isNumericLike('   -   10000   ')).toBeTruthy();
      expect(isNumericLike('   10000   ')).toBeTruthy();
      expect(isNumericLike('   -   10.000   ')).toBeTruthy();
      expect(isNumericLike('   10.000   ')).toBeTruthy();
      expect(isNumericLike('   -   10,000   ')).toBeTruthy();
      expect(isNumericLike('   10,000   ')).toBeTruthy();
      expect(isNumericLike('   1e+26   ')).toBeTruthy();
      expect(isNumericLike('   1e+26   ')).toBeTruthy();
      expect(isNumericLike('   0.2e+26   ')).toBeTruthy();
      expect(isNumericLike('   .2e+26   ')).toBeTruthy();
      expect(isNumericLike('   0,2e+26   ')).toBeTruthy();
      expect(isNumericLike('   ,2e+26   ')).toBeTruthy();
    });
  });
});
