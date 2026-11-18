import Handsontable from 'handsontable/base';
import { TEST_LICENSE_KEY } from '../../../test/helpers/licenseKey';

/**
 * Builds a grid.
 *
 * @returns {Handsontable} The instance.
 */
function buildGrid() {
  return new Handsontable(document.createElement('div'), {
    startRows: 2,
    startCols: 2,
    licenseKey: TEST_LICENSE_KEY,
  });
}

/**
 * Lets every queued microtask run. A macrotask runs only after the microtask queue is empty, so
 * this also covers microtasks queued by other microtasks.
 *
 * @returns {Promise<void>}
 */
function flushMicrotasks() {
  return new Promise(resolve => setTimeout(resolve, 0));
}

// Real microtasks on purpose: Jest's modern fake timers also fake `queueMicrotask`.
describe('Core#_registerMicrotask', () => {
  it('should run every registered callback and drop each entry once it ran', async() => {
    const hot = buildGrid();

    await flushMicrotasks();

    const before = hot.microtasks.size;
    const calls = [];

    hot._registerMicrotask(() => calls.push(1));
    hot._registerMicrotask(() => calls.push(2));
    hot._registerMicrotask(() => calls.push(3));

    expect(hot.microtasks.size).toBe(before + 3);

    await flushMicrotasks();

    expect(calls).toEqual([1, 2, 3]);
    expect(hot.microtasks.size).toBe(before);

    hot.destroy();
  });

  it('should drop an entry registered from inside a running callback once that one ran too', async() => {
    const hot = buildGrid();

    await flushMicrotasks();

    const before = hot.microtasks.size;
    const nested = jest.fn();

    hot._registerMicrotask(() => {
      hot._registerMicrotask(nested);
    });

    await flushMicrotasks();

    expect(nested).toHaveBeenCalledTimes(1);
    expect(hot.microtasks.size).toBe(before);

    hot.destroy();
  });

  it('should not run a callback that was cleared, and should drop its entry', async() => {
    const hot = buildGrid();
    const callback = jest.fn();

    hot._registerMicrotask(callback);
    hot._clearMicrotasks();

    expect(hot.microtasks.size).toBe(0);

    await flushMicrotasks();

    expect(callback).not.toHaveBeenCalled();

    hot.destroy();
  });

  // `destroy()` nulls the instance's fields, so a pending entry that was not cancelled would throw on
  // them instead of returning. jsdom only reports that error, so the tests listen for it.
  describe('during destroy()', () => {
    let errors;

    /**
     * Records an error a microtask reported.
     *
     * @param {ErrorEvent} event The error event.
     */
    function onError(event) {
      errors.push(event.error);
      event.preventDefault();
    }

    beforeEach(() => {
      errors = [];
      window.addEventListener('error', onError);
    });

    afterEach(() => {
      window.removeEventListener('error', onError);
    });

    it('should not run a pending callback after the grid is destroyed', async() => {
      const hot = buildGrid();
      const callback = jest.fn();

      hot._registerMicrotask(callback);
      hot.destroy();

      await flushMicrotasks();

      expect(callback).not.toHaveBeenCalled();
      expect(errors).toEqual([]);
    });

    it('should not run the callbacks queued after one that destroys the grid', async() => {
      const hot = buildGrid();
      const before = jest.fn();
      const after = jest.fn();

      hot._registerMicrotask(before);
      hot._registerMicrotask(() => hot.destroy());
      hot._registerMicrotask(after);

      await flushMicrotasks();

      expect(before).toHaveBeenCalledTimes(1);
      expect(after).not.toHaveBeenCalled();
      expect(errors).toEqual([]);
    });
  });
});
