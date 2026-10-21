import Interval from '../interval';

// Fake timers drive the whole loop deterministically: `Interval` ticks on `requestAnimationFrame`
// (read from `window` at call time, so the mocked one) and gates on `Date.now()` elapsed time,
// both of which `advanceTimersByTime()` moves in lockstep. The previous real-`setTimeout`
// checkpoints raced the event loop - a 50 ms stall on a loaded runner flipped them (DEV-2746,
// from DEV-2668's flake data).
describe('Interval', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should create instance of Interval object', () => {
    const i = Interval.create(() => {}, 10);

    expect(i instanceof Interval).toBe(true);
  });

  it('should create object with delay passed as number', () => {
    const i = Interval.create(() => {}, 15);

    expect(i.delay).toBe(15);
  });

  it('should create object with delay passed as a number of FPS', () => {
    const i = Interval.create(() => {}, '60fps' as unknown as number);

    expect(i.delay).toBe(1000 / 60);
  });

  it('should create interval object which is stopped by default', () => {
    const spy = jest.fn();

    Interval.create(spy, 100);

    jest.advanceTimersByTime(1000);

    expect(spy).not.toHaveBeenCalled();
  });

  it('should repeatedly invoke callback function after calling `start` method', () => {
    const spy = jest.fn();
    const i = Interval.create(spy, 100);

    i.start();

    jest.advanceTimersByTime(50);

    expect(spy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // t = 150

    expect(spy).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(100); // t = 250

    expect(spy).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(100); // t = 350

    expect(spy).toHaveBeenCalledTimes(3);

    i.stop();
  });

  it('should stop repeatedly invoking callback function after calling `stop` method', () => {
    const spy = jest.fn();
    const i = Interval.create(spy, 100);

    i.start();

    jest.advanceTimersByTime(50);

    expect(spy).not.toHaveBeenCalled();

    jest.advanceTimersByTime(100); // t = 150

    expect(spy).toHaveBeenCalledTimes(1);

    i.stop();
    jest.advanceTimersByTime(100); // t = 250: stopped, so nothing may fire

    expect(spy).toHaveBeenCalledTimes(1);

    i.start();
    jest.advanceTimersByTime(150); // t = 400: one full 100 ms interval since the restart

    expect(spy).toHaveBeenCalledTimes(2);

    i.stop();
  });
});
