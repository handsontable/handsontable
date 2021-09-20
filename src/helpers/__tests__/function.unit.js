import {
  throttle,
  throttleAfterHits,
  debounce,
  pipe,
  partial,
  curry,
  curryRight,
  isFunction,
  fastCall,
} from 'handsontable/helpers/function';
import { sleep } from '../../../test/helpers/common';

describe('Function helper', () => {
  //
  // Handsontable.helper.throttle
  //
  describe('throttle', () => {
    it('should returns new function with applied throttling functionality', async() => {
      const spy = jasmine.createSpy();
      const throttled = throttle(spy, 200);

      throttled();
      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.count()).toBe(1);

      await sleep(100);

      throttled();
      throttled();

      expect(spy.calls.count()).toBe(1);

      await sleep(300);

      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.count()).toBe(3);

      await sleep(300);

      expect(spy.calls.count()).toBe(4);
    });
  });

  //
  // Handsontable.helper.throttleAfterHits
  //
  describe('throttleAfterHits', () => {
    it('should returns new function with applied throttling functionality', async() => {
      const spy = jasmine.createSpy();
      const throttled = throttleAfterHits(spy, 200, 5);

      throttled();
      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.count()).toBe(5);

      await sleep(100);

      throttled();
      throttled();

      expect(spy.calls.count()).toBe(6);

      await sleep(300);

      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.count()).toBe(8);

      await sleep(500);

      expect(spy.calls.count()).toBe(9);
    });
  });

  //
  // Handsontable.helper.debounce
  //
  describe('debounce', () => {
    it('should returns new function with applied debouncing functionality', async() => {
      const spy = jasmine.createSpy();
      const debounced = debounce(spy, 200);

      debounced();
      debounced();
      debounced();
      debounced();
      debounced();

      expect(spy.calls.count()).toBe(0);

      await sleep(100);

      debounced();
      debounced();

      expect(spy.calls.count()).toBe(0);

      await sleep(300);

      debounced();
      debounced();
      debounced();
      debounced();

      expect(spy.calls.count()).toBe(1);

      await sleep(500);

      expect(spy.calls.count()).toBe(2);
    });
  });

  //
  // Handsontable.helper.pipe
  //
  describe('pipe', () => {
    it('should returns new function with piped all passed functions', () => {
      const spyObject = {
        test1: a => a + 1,
        test2: a => a + 1,
        test3: a => a + 1,
        test4: a => a + 1,
      };
      const spyTest1 = jest.spyOn(spyObject, 'test1');
      const spyTest2 = jest.spyOn(spyObject, 'test2');
      const spyTest3 = jest.spyOn(spyObject, 'test3');
      const spyTest4 = jest.spyOn(spyObject, 'test4');

      const piped = pipe(spyTest1, spyTest2, spyTest3, spyTest4);

      const result = piped(1, 2, 'foo');

      expect(spyTest1).toHaveBeenCalledWith(1, 2, 'foo');
      expect(spyTest2).toHaveBeenCalledWith(2);
      expect(spyTest3).toHaveBeenCalledWith(3);
      expect(spyTest4).toHaveBeenCalledWith(4);
      expect(result).toBe(5);
    });
  });

  //
  // Handsontable.helper.partial
  //
  describe('partial', () => {
    it('should returns new function with cached arguments', () => {
      const spyObject = {
        test1: (a, b, c) => (a + b) + c,
      };
      const spyTest1 = jest.spyOn(spyObject, 'test1');
      let partialized = partial(spyTest1, 1, 2);

      expect(partialized('foo')).toBe('3foo');

      partialized = partial(spyTest1);

      expect(partialized(1, 2, 'foo')).toBe('3foo');

      partialized = partial(spyTest1, 1, 2, 3);

      expect(partialized('foo')).toBe(6);
    });
  });

  //
  // Handsontable.helper.curry
  //
  describe('curry', () => {
    it('should returns new function with cached arguments (collecting arguments from the left to the right)', () => {
      const fn = (a, b, c) => (a + b) + c;

      const curried = curry(fn);

      expect(curried(1, 2, 'foo')).toBe('3foo');
      expect(curried(1)(2)('foo')).toBe('3foo');
      expect(curried(1, 2)(3)).toBe(6);
    });
  });

  //
  // Handsontable.helper.curryRight
  //
  describe('curryRight', () => {
    it('should returns new function with cached arguments (collecting arguments from the right to the left)', () => {
      const fn = (a, b, c) => (a + b) + c;

      const curried = curryRight(fn);

      expect(curried('foo', 2, 1)).toBe('3foo');
      expect(curried(1, 2, 'foo')).toBe('foo21');
      expect(curried(1)(2)('foo')).toBe('3foo');
      expect(curried(1, 2)(3)).toBe(6);
    });
  });

  //
  // Handsontable.helper.isFunction
  //
  describe('isFunction', () => {
    it('should correctly detect function', () => {
      const toCheck = [
        function() {},
        { id() {} },
        1,
        'text',
        /^\d+$/,
        true
      ];

      function namedFunc() {}

      expect(isFunction(toCheck[0])).toBeTruthy();
      expect(isFunction(toCheck[1].id)).toBeTruthy();
      expect(isFunction(namedFunc)).toBeTruthy();
      expect(isFunction(() => {})).toBeTruthy();

      expect(isFunction(toCheck)).toBeFalsy();
      expect(isFunction(toCheck[1])).toBeFalsy();
      expect(isFunction(toCheck[2])).toBeFalsy();
      expect(isFunction(toCheck[3])).toBeFalsy();
      expect(isFunction(toCheck[4])).toBeFalsy();
      expect(isFunction(toCheck[5])).toBeFalsy();
    });
  });

  //
  // Handsontable.helper.fastCall
  //
  describe('fastCall', () => {
    it('should call the function with a proper context and number of arguments', () => {
      const func = jasmine.createSpy('func');
      const context = {};

      fastCall(func);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBeUndefined();
      expect(func).toHaveBeenCalledWith();

      func.calls.reset();
      fastCall(func, context);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith();

      func.calls.reset();
      fastCall(func, context, 'a');

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a');

      func.calls.reset();
      fastCall(func, context, 'a', 'b');

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a', 'b');

      func.calls.reset();
      fastCall(func, context, 'a', 'b', 'c');

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a', 'b', 'c');

      func.calls.reset();
      fastCall(func, context, 'a', 'b', 'c', 1);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a', 'b', 'c', 1);

      func.calls.reset();
      fastCall(func, context, 'a', 'b', 'c', 1, 2);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a', 'b', 'c', 1, 2);

      func.calls.reset();
      fastCall(func, context, 'a', 'b', 'c', 1, 2, 3);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a', 'b', 'c', 1, 2, 3);
    });

    it('should call the function with all arguments even there are some "undefined" values in-between', () => {
      const func = jasmine.createSpy('func');
      const context = {};

      fastCall(func, context, 'a', void 0, 'c', 1, void 0, 3);

      expect(func).toHaveBeenCalledTimes(1);
      expect(func.calls.first().object).toBe(context);
      expect(func).toHaveBeenCalledWith('a', void 0, 'c', 1, void 0, 3);
    });
  });
});
