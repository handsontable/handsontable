import Handsontable from '../../src/base';

/**
 * Pins the Jest-only `window.scrollTo` stub (see `test/jsdomWindowScroll.js`).
 */
describe('jsdom window.scrollTo stub', () => {
  it('should not report jsdom\'s "Not implemented" error', () => {
    // eslint-disable-next-line no-console
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    window.scrollTo(0, 100);

    const calls = spy.mock.calls.slice();

    spy.mockRestore();

    expect(calls).toEqual([]);
  });

  it('should let a grid scroll the window viewport without console errors', () => {
    const container = document.createElement('div');
    // eslint-disable-next-line no-console
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const scrollSpy = jest.spyOn(window, 'scrollTo');

    document.body.appendChild(container);

    const hot = new Handsontable(container, {
      data: Array.from({ length: 50 }, (_, row) => Array.from({ length: 20 }, (__, col) => `${row}-${col}`)),
      licenseKey: 'non-commercial-and-evaluation',
    });

    hot.selectCell(40, 15);

    const scrollCalls = scrollSpy.mock.calls.length;
    const notImplemented = errorSpy.mock.calls.filter(([message]) => String(message).includes('Not implemented'));

    hot.destroy();
    container.remove();
    errorSpy.mockRestore();
    scrollSpy.mockRestore();

    expect(scrollCalls).toBeGreaterThan(0);
    expect(notImplemented).toEqual([]);
  });
});
