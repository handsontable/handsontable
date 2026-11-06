import { EXPECTED_MESSAGES, isExpected } from '../jestExpectedConsole';

/**
 * Pins the Jest-only console allowlist (see `test/jestExpectedConsole.js`).
 */
describe('Jest expected console allowlist', () => {
  it('should anchor every pattern to the start of its message', () => {
    EXPECTED_MESSAGES.forEach((pattern) => {
      expect(pattern.source.startsWith('^')).toBe(true);
    });
  });

  it('should match the messages the specs provoke on purpose, and nothing else', () => {
    expect(isExpected(['HTML content is being written to the DOM ("loading") without a sanitizer.'])).toBe(true);
    expect(isExpected(['You need to configure the Nested Headers plugin in order to use collapsible headers.']))
      .toBe(true);
    expect(isExpected(['Handsontable: v19.0.0 (01/01/2026 10:00:00)'])).toBe(true);
    expect(isExpected(['Handsontable: v19.0.0-next-abc (01/01/2026 10:00:00)'])).toBe(true);

    expect(isExpected(['Deprecated: the `foo` method will be removed.'])).toBe(false);
    expect(isExpected(['Handsontable: version mismatch'])).toBe(false);
    expect(isExpected(['Something nobody expected'])).toBe(false);
    expect(isExpected(['  HTML content is being written to the DOM ("x") without a sanitizer.'])).toBe(false);
  });

  it('should leave a spec\'s own console spy in charge of what its code logs', () => {
    // eslint-disable-next-line no-console
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    // eslint-disable-next-line no-console
    console.warn('Something nobody expected');
    // eslint-disable-next-line no-console
    console.warn('Theme "x" is already registered. Registration skipped.');

    const calls = spy.mock.calls.map(([message]) => message);

    spy.mockRestore();

    // The spy sits on the wrapper, so it counts the expected message too; only the real
    // console output is filtered.
    expect(calls).toEqual(['Something nobody expected', 'Theme "x" is already registered. Registration skipped.']);
  });
});
