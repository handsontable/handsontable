import {
  rangeEach,
  rangeEachReverse,
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
});
