import { assertNoUnexpectedLicenseMessage } from '../jestExpectedConsole';
import Handsontable from '../../src';

/**
 * The guard against a spec's own `console.warn` spy, in a file of its own: the core prints the legacy license
 * message once per test file, so only here does the spy take the file's one message.
 */
describe('Jest expected console allowlist, with a spec spy on console.warn', () => {
  it('should fail a grid built without a key while the spy swallows the license message', () => {
    // eslint-disable-next-line no-console
    const spy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const grid = new Handsontable(document.createElement('div'), {});
    const swallowed = spy.mock.calls.map(([message]) => String(message));

    spy.mockRestore();

    // The precondition: the spy took the message, so the console path saw nothing.
    expect(swallowed).toEqual([expect.stringMatching(/^The license key for Handsontable is missing/)]);
    expect(() => assertNoUnexpectedLicenseMessage())
      .toThrow(/built without the test license key and shows the license lock\.(?! .*logged)/);

    grid.destroy();
  });

  it('should fail a later grid built without a key, after the spy used up the file\'s message', () => {
    const grid = new Handsontable(document.createElement('div'), {});

    expect(() => assertNoUnexpectedLicenseMessage())
      .toThrow(/built without the test license key and shows the license lock/);

    grid.destroy();
  });
});
