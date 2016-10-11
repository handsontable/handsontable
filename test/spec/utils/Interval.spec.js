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

  it('should create interval object which is stopped by default', function (done) {
    var spy = jasmine.createSpy();
    var i = Interval.create(spy);

    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should repeatedly invoke callback function after calling `start` method', function (done) {
    var spy = jasmine.createSpy();
    var i = Interval.create(spy, 100);

    i.start();

    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
    }, 50);

    setTimeout(function () {
      expect(spy.calls.count()).toBe(1);
    }, 150);

    setTimeout(function () {
      expect(spy.calls.count()).toBe(2);
    }, 250);

    setTimeout(function () {
      expect(spy.calls.count()).toBe(3);
      i.stop();
      done();
    }, 350);
  });

  it('should stop repeatedly invoking callback function after calling `stop` method', function (done) {
    var spy = jasmine.createSpy();
    var i = Interval.create(spy, 100);

    i.start();

    setTimeout(function () {
      expect(spy).not.toHaveBeenCalled();
    }, 50);

    setTimeout(function () {
      expect(spy.calls.count()).toBe(1);
      i.stop();
    }, 150);

    setTimeout(function () {
      expect(spy.calls.count()).toBe(1);
      i.start();
    }, 250);

    setTimeout(function () {
      expect(spy.calls.count()).toBe(2);
      i.stop();
      done();
    }, 400);
  });
});
