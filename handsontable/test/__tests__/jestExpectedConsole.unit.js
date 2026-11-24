import {
  EXPECTED_MESSAGES,
  LICENSE_KEY_MESSAGE,
  assertNoUnexpectedLicenseMessage,
  isExpected,
  isLicenseTestFile,
} from '../jestExpectedConsole';
import Handsontable from '../../src';
import { TEST_LICENSE_KEY } from '../helpers/licenseKey';

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

  describe('license key messages', () => {
    it('should recognize the missing, invalid and expired key messages, and nothing else', () => {
      expect(LICENSE_KEY_MESSAGE.test('The license key for Handsontable is missing. Use your purchased key'))
        .toBe(true);
      expect(LICENSE_KEY_MESSAGE.test('The license key for Handsontable is invalid. If you need any help'))
        .toBe(true);
      expect(LICENSE_KEY_MESSAGE.test('The license key for Handsontable expired on May 23, 2011, and is not'))
        .toBe(true);

      expect(LICENSE_KEY_MESSAGE.test('Your Handsontable subscription license expired on')).toBe(false);
      expect(LICENSE_KEY_MESSAGE.test(' The license key for Handsontable is missing.')).toBe(false);
    });

    it('should let only the license tests log them', () => {
      expect(isLicenseTestFile('/repo/handsontable/src/core/__tests__/license.unit.js')).toBe(true);
      expect(isLicenseTestFile('C:\\repo\\handsontable\\src\\utils\\entitlementLicenseKey\\__tests__\\a.unit.js'))
        .toBe(true);

      expect(isLicenseTestFile('/repo/handsontable/src/__tests__/core/core.unit.js')).toBe(false);
      expect(isLicenseTestFile(expect.getState().testPath)).toBe(false);
    });

    it('should fail a test that builds a grid without a key', () => {
      const grid = new Handsontable(document.createElement('div'), {});

      // The core prints the legacy message once per test file, so this is the file's first one.
      expect(() => assertNoUnexpectedLicenseMessage())
        .toThrow(/built without the test license key and logged "The license key for Handsontable is missing/);
      expect(() => assertNoUnexpectedLicenseMessage()).not.toThrow();

      grid.destroy();
    });

    it('should let a grid built with the test key pass', () => {
      const grid = new Handsontable(document.createElement('div'), { licenseKey: TEST_LICENSE_KEY });

      expect(() => assertNoUnexpectedLicenseMessage()).not.toThrow();

      grid.destroy();
    });
  });
});
