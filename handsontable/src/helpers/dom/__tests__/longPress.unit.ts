import { LongPressDetector, LONG_PRESS_DELAY } from 'handsontable/helpers/dom/longPress';

/**
 * Builds a detector on Jest's fake timers.
 *
 * @returns {{ detector: LongPressDetector, onLongPress: jest.Mock }} The detector and its callback.
 */
function createDetector() {
  const onLongPress = jest.fn();
  const detector = new LongPressDetector({
    timers: {
      setTimeout: (callback, delay) => setTimeout(callback, delay) as unknown as number,
      clearTimeout: handle => clearTimeout(handle),
    },
    onLongPress,
  });

  return { detector, onLongPress };
}

describe('LongPressDetector', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('fires once a press is held still for the delay', () => {
    const { detector, onLongPress } = createDetector();

    detector.start(10, 10);
    jest.advanceTimersByTime(LONG_PRESS_DELAY - 1);

    expect(onLongPress).not.toHaveBeenCalled();
    expect(detector.isTracking()).toBe(true);

    jest.advanceTimersByTime(1);

    expect(onLongPress).toHaveBeenCalledTimes(1);
    expect(detector.hasFired()).toBe(true);
    expect(detector.isTracking()).toBe(false);
  });

  it('keeps timing a press that drifts within the threshold', () => {
    const { detector, onLongPress } = createDetector();

    detector.start(10, 10);

    expect(detector.move(20, 0)).toBe(false);

    jest.advanceTimersByTime(LONG_PRESS_DELAY);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('cancels a press that drifts past the threshold on either axis', () => {
    const horizontal = createDetector();
    const vertical = createDetector();

    horizontal.detector.start(10, 10);
    vertical.detector.start(10, 10);

    expect(horizontal.detector.move(21, 10)).toBe(true);
    expect(vertical.detector.move(10, -1)).toBe(true);
    expect(horizontal.detector.move(40, 10)).toBe(false);

    jest.advanceTimersByTime(LONG_PRESS_DELAY);

    expect(horizontal.onLongPress).not.toHaveBeenCalled();
    expect(vertical.onLongPress).not.toHaveBeenCalled();
    expect(horizontal.detector.hasFired()).toBe(false);
  });

  it('keeps a fired press fired across cancel and forgets it on reset', () => {
    const { detector } = createDetector();

    detector.start(0, 0);
    jest.advanceTimersByTime(LONG_PRESS_DELAY);
    detector.cancel();

    expect(detector.hasFired()).toBe(true);

    detector.reset();

    expect(detector.hasFired()).toBe(false);
  });

  it('drops the previous press when a new one starts', () => {
    const { detector, onLongPress } = createDetector();

    detector.start(0, 0);
    jest.advanceTimersByTime(LONG_PRESS_DELAY - 100);
    detector.start(50, 50);
    jest.advanceTimersByTime(LONG_PRESS_DELAY - 1);

    expect(onLongPress).not.toHaveBeenCalled();

    jest.advanceTimersByTime(1);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('honors a custom delay and threshold', () => {
    const onLongPress = jest.fn();
    const detector = new LongPressDetector({
      timers: {
        setTimeout: (callback, delay) => setTimeout(callback, delay) as unknown as number,
        clearTimeout: handle => clearTimeout(handle),
      },
      onLongPress,
      delay: 100,
      threshold: 2,
    });

    detector.start(0, 0);

    expect(detector.move(3, 0)).toBe(true);

    detector.start(0, 0);
    jest.advanceTimersByTime(100);

    expect(onLongPress).toHaveBeenCalledTimes(1);
  });
});
