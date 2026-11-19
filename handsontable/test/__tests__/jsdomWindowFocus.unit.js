import Handsontable from '../../src/base';
import { TEST_LICENSE_KEY } from '../helpers/licenseKey';

/**
 * Pins the Jest-only `window.focus` stub (see `test/jsdomWindowFocus.js`).
 */
describe('jsdom window.focus stub', () => {
  it('should not report jsdom\'s "Not implemented" error', () => {
    // eslint-disable-next-line no-console
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.focus();

    const calls = spy.mock.calls.slice();

    spy.mockRestore();

    expect(calls).toEqual([]);
  });

  it('should let a mousedown on a cell focus the window without console errors', () => {
    const container = document.createElement('div');
    // eslint-disable-next-line no-console
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const focusSpy = jest.spyOn(window, 'focus');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: [['a', 'b'], ['c', 'd']],
      licenseKey: TEST_LICENSE_KEY,
    });

    hot.getCell(0, 0).dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    const focusCalls = focusSpy.mock.calls.length;
    const notImplemented = errorSpy.mock.calls.filter(([message]) => String(message).includes('Not implemented'));

    hot.destroy();
    container.remove();
    errorSpy.mockRestore();
    focusSpy.mockRestore();

    expect(focusCalls).toBeGreaterThan(0);
    expect(notImplemented).toEqual([]);
  });
});
