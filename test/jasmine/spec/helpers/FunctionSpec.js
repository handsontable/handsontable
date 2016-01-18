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
});
