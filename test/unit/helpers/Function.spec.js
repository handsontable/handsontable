import {
  throttle,
  throttleAfterHits,
  debounce,
  pipe,
  partial,
  curry,
  curryRight,
  isFunction,
} from 'handsontable/helpers/function';

describe('Function helper', () => {
  //
  // Handsontable.helper.throttle
  //
  describe('throttle', () => {
    it('should returns new function with applied throttling functionality', (done) => {
      const spy = jasmine.createSpy();
      const throttled = throttle(spy, 200);

      throttled();
      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.count()).toBe(1);

      setTimeout(() => {
        throttled();
        throttled();

        expect(spy.calls.count()).toBe(1);
      }, 100);

      setTimeout(() => {
        throttled();
        throttled();
        throttled();
        throttled();

        expect(spy.calls.count()).toBe(3);

      }, 400);

      setTimeout(() => {
        expect(spy.calls.count()).toBe(4);
        done();
      }, 900);
    });
  });

  //
  // Handsontable.helper.throttleAfterHits
  //
  describe('throttleAfterHits', () => {
    it('should returns new function with applied throttling functionality', (done) => {
      const spy = jasmine.createSpy();
      const throttled = throttleAfterHits(spy, 200, 5);

      throttled();
      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.count()).toBe(5);

      setTimeout(() => {
        throttled();
        throttled();

        expect(spy.calls.count()).toBe(6);
      }, 100);

      setTimeout(() => {
        throttled();
        throttled();
        throttled();
        throttled();

        expect(spy.calls.count()).toBe(8);
      }, 400);

      setTimeout(() => {
        expect(spy.calls.count()).toBe(9);
        done();
      }, 900);
    });
  });

  //
  // Handsontable.helper.debounce
  //
  describe('debounce', () => {
    it('should returns new function with applied debouncing functionality', (done) => {
      const spy = jasmine.createSpy();
      const debounced = debounce(spy, 200);

      debounced();
      debounced();
      debounced();
      debounced();
      debounced();

      expect(spy.calls.count()).toBe(0);

      setTimeout(() => {
        debounced();
        debounced();

        expect(spy.calls.count()).toBe(0);
      }, 100);

      setTimeout(() => {
        debounced();
        debounced();
        debounced();
        debounced();

        expect(spy.calls.count()).toBe(1);
      }, 400);

      setTimeout(() => {
        expect(spy.calls.count()).toBe(2);
        done();
      }, 900);
    });
  });

  //
  // Handsontable.helper.pipe
  //
  describe('pipe', () => {
    it('should returns new function with piped all passed functions', () => {
      const spy1 = jasmine.createSpyObj('spy', ['test1', 'test2', 'test3', 'test4']);

      spy1.test1.and.callFake(a => a + 1);
      spy1.test2.and.callFake(a => a + 1);
      spy1.test3.and.callFake(a => a + 1);
      spy1.test4.and.callFake(a => a + 1);

      const piped = pipe(spy1.test1, spy1.test2, spy1.test3, spy1.test4);

      const result = piped(1, 2, 'foo');

      expect(spy1.test1).toHaveBeenCalledWith(1, 2, 'foo');
      expect(spy1.test2).toHaveBeenCalledWith(2);
      expect(spy1.test3).toHaveBeenCalledWith(3);
      expect(spy1.test4).toHaveBeenCalledWith(4);
      expect(result).toBe(5);
    });
  });

  //
  // Handsontable.helper.partial
  //
  describe('partial', () => {
    it('should returns new function with cached arguments', () => {
      const spy1 = jasmine.createSpyObj('spy', ['test1', 'test2', 'test3', 'test4']);

      spy1.test1.and.callFake((a, b, c) => (a + b) + c);

      let partialized = partial(spy1.test1, 1, 2);

      expect(partialized('foo')).toBe('3foo');

      partialized = partial(spy1.test1);

      expect(partialized(1, 2, 'foo')).toBe('3foo');

      partialized = partial(spy1.test1, 1, 2, 3);

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
});
