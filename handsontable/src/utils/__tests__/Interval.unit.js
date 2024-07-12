import Interval from '../interval';

describe('Interval', () => {

  it('should create instance of Interval object', () => {
    const i = Interval.create(() => {}, 10);

    expect(i instanceof Interval).toBe(true);
  });

  it('should create object with delay passed as number', () => {
    const i = Interval.create(() => {}, 15);

    expect(i.delay).toBe(15);
  });

  it('should create object with delay passed as a number of FPS', () => {
    const i = Interval.create(() => {}, '60fps');

    expect(i.delay).toBe(1000 / 60);
  });

  it('should create interval object which is stopped by default', (done) => {
    const spy = jasmine.createSpy();

    Interval.create(spy);

    setTimeout(() => {
      expect(spy).not.toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should repeatedly invoke callback function after calling `start` method', (done) => {
    const spy = jasmine.createSpy();
    const i = Interval.create(spy, 100);

    i.start();

    setTimeout(() => {
      expect(spy).not.toHaveBeenCalled();
    }, 50);

    setTimeout(() => {
      expect(spy.calls.count()).toBe(1);
    }, 150);

    setTimeout(() => {
      expect(spy.calls.count()).toBe(2);
    }, 250);

    setTimeout(() => {
      expect(spy.calls.count()).toBe(3);
      i.stop();
      done();
    }, 350);
  });

  it('should stop repeatedly invoking callback function after calling `stop` method', (done) => {
    const spy = jasmine.createSpy();
    const i = Interval.create(spy, 100);

    i.start();

    setTimeout(() => {
      expect(spy).not.toHaveBeenCalled();
    }, 50);

    setTimeout(() => {
      expect(spy.calls.count()).toBe(1);
      i.stop();
    }, 150);

    setTimeout(() => {
      expect(spy.calls.count()).toBe(1);
      i.start();
    }, 250);

    setTimeout(() => {
      expect(spy.calls.count()).toBe(2);
      i.stop();
      done();
    }, 400);
  });
});
