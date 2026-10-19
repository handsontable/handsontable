import Handsontable from 'handsontable/base';

/**
 * Builds a grid.
 *
 * @returns {Handsontable} The instance.
 */
function buildGrid() {
  return new Handsontable(document.createElement('div'), {
    startRows: 2,
    startCols: 2,
    licenseKey: 'non-commercial-and-evaluation',
  });
}

describe('Core#_registerTimeout', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should drop a callback\'s handle once the timeout fired', () => {
    const hot = buildGrid();
    const before = hot.timeouts.length;
    const callback = jest.fn();

    hot._registerTimeout(callback, 10);
    hot._registerTimeout(callback, 20);

    expect(hot.timeouts.length).toBe(before + 2);

    jest.advanceTimersByTime(10);

    expect(callback).toHaveBeenCalledTimes(1);
    expect(hot.timeouts.length).toBe(before + 1);

    jest.advanceTimersByTime(10);

    expect(callback).toHaveBeenCalledTimes(2);
    expect(hot.timeouts.length).toBe(before);

    hot.destroy();
  });

  it('should still cancel a pending callback when the grid is destroyed', () => {
    const hot = buildGrid();
    const callback = jest.fn();

    hot._registerTimeout(callback, 10);
    hot.destroy();
    jest.advanceTimersByTime(10);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should keep a handle that was passed in, as it cannot tell when that one fires', () => {
    const hot = buildGrid();
    const before = hot.timeouts.length;
    // A handle made outside, by any timer API; the number itself is all the method keeps.
    const handle = 987654;

    expect(hot._registerTimeout(handle)).toBe(handle);

    jest.advanceTimersByTime(10);

    expect(hot.timeouts.length).toBe(before + 1);

    hot.destroy();
  });
});
