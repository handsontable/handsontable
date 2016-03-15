describe('Interval', function () {

  var Interval = Handsontable.utils.Interval;

  it('should create instance of Interval object', function () {
    var i = Interval.create(function(){}, 10);

    expect(i instanceof Interval).toBe(true);
  });

  it('should create object with delay passed as number', function () {
    var i = Interval.create(function(){}, 15);

    expect(i.delay).toBe(15);
  });

  it('should create object with delay passed as a number of FPS', function () {
    var i = Interval.create(function(){}, '60fps');

    expect(i.delay).toBe(1000/60);
  });

  it('should create interval object which is stopped by default', function () {
    var spy = jasmine.createSpy();
    var i = Interval.create(spy);

    waits(100);
    runs(function() {
      expect(spy).not.toHaveBeenCalled();
    });
  });

  it('should repeatedly invoke callback function after calling `start` method', function () {
    var spy = jasmine.createSpy();
    var i = Interval.create(spy, 100);

    i.start();

    waits(50);
    runs(function() {
      expect(spy).not.toHaveBeenCalled();
    });
    waits(100);
    runs(function() {
      expect(spy.calls.length).toBe(1);
    });
    waits(100);
    runs(function() {
      expect(spy.calls.length).toBe(2);
    });
    waits(100);
    runs(function() {
      expect(spy.calls.length).toBe(3);
      i.stop();
    });
  });

  it('should stop repeatedly invoking callback function after calling `stop` method', function () {
    var spy = jasmine.createSpy();
    var i = Interval.create(spy, 100);

    i.start();

    waits(50);
    runs(function() {
      expect(spy).not.toHaveBeenCalled();
    });
    waits(100);
    runs(function() {
      expect(spy.calls.length).toBe(1);
      i.stop();
    });
    waits(100);
    runs(function() {
      expect(spy.calls.length).toBe(1);
      i.start();
    });
    waits(150);
    runs(function() {
      expect(spy.calls.length).toBe(2);
      i.stop();
    });
  });
});
