/**
 * The license key every test grid is built with. A grid built without a valid key is blocked by the
 * lock screen, so tests read the key from here and a new key is a one-line change.
 *
 * Scripts import it. Templates bind `:licenseKey="testLicenseKey"`, which `bootstrap.js` provides to
 * every mounted component through `config.global.mocks`, so the key never passes through an HTML
 * attribute (an entitlement key holds quotes and line breaks).
 */
export const TEST_LICENSE_KEY = 'non-commercial-and-evaluation';
