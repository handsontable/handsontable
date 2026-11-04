/**
 * The license key every scenario grid is built with. A grid built without a valid key is blocked by
 * the lock screen, so the fixtures read the key from here and a new key is a one-line change.
 *
 * A fixture loads this file with `<script src="../../fixtures/test-license-key.js">` in its `<head>`,
 * before any script that builds a grid, and passes `licenseKey: window.htTestLicenseKey`.
 *
 * It sits next to the bundles `scripts/run.mjs` copies here, so both `.gitignore` files that ignore
 * `fixtures/*.js` name it as the one file to keep.
 */
window.htTestLicenseKey = 'non-commercial-and-evaluation';
