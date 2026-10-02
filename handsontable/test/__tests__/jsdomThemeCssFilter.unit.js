import { isThemeStylesheetParseError, withoutThemeStylesheetParseError } from '../jsdomThemeCssFilter';
import Handsontable from '../../src/base';

/**
 * Pins the Jest-only filter for jsdom's parse error on the nested theme stylesheet
 * (see `test/jsdomThemeCssFilter.js`).
 */
describe('jsdom theme stylesheet parse error filter', () => {
  /**
   * Appends a `<style>` and returns every `console.error` call jsdom made for it.
   *
   * @param {string} css The stylesheet text.
   * @returns {Array[]}
   */
  function captureErrors(css) {
    // eslint-disable-next-line no-console
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const style = document.createElement('style');

    style.textContent = css;
    document.head.appendChild(style);
    style.remove();

    const calls = spy.mock.calls.slice();

    spy.mockRestore();

    return calls;
  }

  it('should match the error jsdom reports for a nested theme block', () => {
    const calls = captureErrors(':where(.ht-theme-main) {\n--ht-a: 1px;\n.b::before { width: 1px; }}');

    expect(calls.length).toBe(1);
    expect(isThemeStylesheetParseError(calls[0])).toBe(true);
  });

  it('should not match a parse error from any other stylesheet', () => {
    const calls = captureErrors('.a { .b { width: 1px; }}');

    expect(calls.length).toBe(1);
    expect(isThemeStylesheetParseError(calls[0])).toBe(false);
  });

  it('should not match an unrelated error', () => {
    expect(isThemeStylesheetParseError(['Error: something else', ':where(.ht-theme-main) {'])).toBe(false);
    expect(isThemeStylesheetParseError([new Error('Could not parse CSS stylesheet')])).toBe(false);
  });

  it('should drop the theme error and pass every other call through', () => {
    const [themeCall] = captureErrors(':where(.ht-theme-main) {\n--ht-a: 1px;\n.b::before { width: 1px; }}');
    const [otherCall] = captureErrors('.a { .b { width: 1px; }}');
    const error = jest.fn();
    const filtered = withoutThemeStylesheetParseError(error);

    filtered(...themeCall);
    filtered(...otherCall);
    filtered('unrelated');

    expect(error.mock.calls).toEqual([otherCall, ['unrelated']]);
  });

  it('should leave the theme error as the only parse error a grid build reports', () => {
    const container = document.createElement('div');
    // eslint-disable-next-line no-console
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    document.body.appendChild(container);

    const hot = new Handsontable(container, { licenseKey: 'non-commercial-and-evaluation' });
    const parseErrors = spy.mock.calls.filter(([stack]) => typeof stack === 'string' &&
      stack.startsWith('Error: Could not parse CSS stylesheet'));

    hot.destroy();
    container.remove();
    spy.mockRestore();

    expect(parseErrors.length).toBeGreaterThan(0);
    expect(parseErrors.every(isThemeStylesheetParseError)).toBe(true);
  });
});
