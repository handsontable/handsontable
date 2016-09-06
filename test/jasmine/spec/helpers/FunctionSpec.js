describe('Function helper', function() {
  //
  // Handsontable.helper.proxy
  //
  describe('proxy', function() {
    it('should returns new function with corrected binded context', function() {
      var proxy = Handsontable.helper.proxy;
      var proxied = function(context) {
        return proxy(function() {
          return this;
        }, context)();
      }
      var object = {};
      var func = function(){};

      expect(proxied(1).valueOf()).toBe(1);
      expect(proxied('foo').valueOf()).toBe('foo');
      expect(proxied(func)).toBe(func);
    });
  });

  //
  // Handsontable.helper.throttle
  //
  describe('throttle', function() {
    it('should returns new function with applied throttling functionality', function() {
      var spy = jasmine.createSpy();
      var throttle = Handsontable.helper.throttle;
      var throttled = throttle(spy, 200);

      throttled();
      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.length).toBe(1);

      waits(100);
      runs(function() {
        throttled();
        throttled();

        expect(spy.calls.length).toBe(1);
      });
      waits(300);
      runs(function() {
        throttled();
        throttled();
        throttled();
        throttled();

        expect(spy.calls.length).toBe(3);
      });
      waits(500);
      runs(function() {
        expect(spy.calls.length).toBe(4);
      });
    });
  });

  //
  // Handsontable.helper.throttleAfterHits
  //
  describe('throttleAfterHits', function() {
    it('should returns new function with applied throttling functionality', function() {
      var spy = jasmine.createSpy();
      var throttle = Handsontable.helper.throttleAfterHits;
      var throttled = throttle(spy, 200, 5);

      throttled();
      throttled();
      throttled();
      throttled();
      throttled();

      expect(spy.calls.length).toBe(5);

      waits(100);
      runs(function() {
        throttled();
        throttled();

        expect(spy.calls.length).toBe(6);
      });
      waits(300);
      runs(function() {
        throttled();
        throttled();
        throttled();
        throttled();

        expect(spy.calls.length).toBe(8);
      });
      waits(500);
      runs(function() {
        expect(spy.calls.length).toBe(9);
      });
    });
  });

  //
  // Handsontable.helper.debounce
  //
  describe('debounce', function() {
    it('should returns new function with applied debouncing functionality', function() {
      var spy = jasmine.createSpy();
      var debounce = Handsontable.helper.debounce;
      var debounced = debounce(spy, 200);

      debounced();
      debounced();
      debounced();
      debounced();
      debounced();

      expect(spy.calls.length).toBe(0);

      waits(100);
      runs(function() {
        debounced();
        debounced();

        expect(spy.calls.length).toBe(0);
      });
      waits(300);
      runs(function() {
        debounced();
        debounced();
        debounced();
        debounced();

        expect(spy.calls.length).toBe(1);
      });
      waits(500);
      runs(function() {
        expect(spy.calls.length).toBe(2);
      });
    });
  });

  //
  // Handsontable.helper.pipe
  //
  describe('pipe', function() {
    it('should returns new function with piped all passed functions', function() {
      var spy1 = jasmine.createSpyObj('spy', ['test1', 'test2', 'test3', 'test4']);
      var pipe = Handsontable.helper.pipe;

      spy1.test1.andCallFake(function(a) { return a + 1 });
      spy1.test2.andCallFake(function(a) { return a + 1 });
      spy1.test3.andCallFake(function(a) { return a + 1 });
      spy1.test4.andCallFake(function(a) { return a + 1 });

      var piped = pipe(spy1.test1, spy1.test2, spy1.test3, spy1.test4);

      var result = piped(1, 2, 'foo');

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
  describe('partial', function() {
    it('should returns new function with cached arguments', function() {
      var spy1 = jasmine.createSpyObj('spy', ['test1', 'test2', 'test3', 'test4']);
      var partial = Handsontable.helper.partial;

      spy1.test1.andCallFake(function(a, b, c) { return (a + b) + c });

      var partialized = partial(spy1.test1, 1, 2);

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
  describe('curry', function() {
    it('should returns new function with cached arguments (collecting arguments from the left to the right)', function() {
      var curry = Handsontable.helper.curry;
      var fn = function(a, b, c) { return (a + b) + c };

      var curried = curry(fn);

      expect(curried(1, 2, 'foo')).toBe('3foo');
      expect(curried(1)(2)('foo')).toBe('3foo');
      expect(curried(1, 2)(3)).toBe(6);
    });
  });

  //
  // Handsontable.helper.curryRight
  //
  describe('curryRight', function() {
    it('should returns new function with cached arguments (collecting arguments from the right to the left)', function() {
      var curry = Handsontable.helper.curryRight;
      var fn = function(a, b, c) { return (a + b) + c };

      var curried = curry(fn);

      expect(curried('foo', 2, 1)).toBe('3foo');
      expect(curried(1, 2, 'foo')).toBe('foo21');
      expect(curried(1)(2)('foo')).toBe('3foo');
      expect(curried(1, 2)(3)).toBe(6);
    });
  });

  //
  // Handsontable.helper.isFunction
  //
  describe('isFunction', function() {
    it('should correctly detect function', function() {
      var isFunction = Handsontable.helper.isFunction;
      var toCheck = [
        function() {},
        {id: function() {}},
        1,
        'text',
        /^\d+$/,
        true
      ];

      function namedFunc() {}

      expect(isFunction(toCheck[0])).toBeTruthy();
      expect(isFunction(toCheck[1].id)).toBeTruthy();
      expect(isFunction(namedFunc)).toBeTruthy();
      expect(isFunction(function() {})).toBeTruthy();

      expect(isFunction(toCheck)).toBeFalsy();
      expect(isFunction(toCheck[1])).toBeFalsy();
      expect(isFunction(toCheck[2])).toBeFalsy();
      expect(isFunction(toCheck[3])).toBeFalsy();
      expect(isFunction(toCheck[4])).toBeFalsy();
      expect(isFunction(toCheck[5])).toBeFalsy();
    });
  });
});
