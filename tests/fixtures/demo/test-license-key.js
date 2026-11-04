/**
 * The license key every fixture grid is built with. A grid built without a valid key is blocked by
 * the lock screen, so the fixtures read the key from here and a new key is a one-line change.
 *
 * A fixture loads this file with a `<script src>` in its `<head>`, before any script that builds a
 * grid, and passes `licenseKey: window.htTestLicenseKey`. A spec that builds a grid inside
 * `page.evaluate()` reads the same global from the fixture it opened. A test of the license behavior
 * itself keeps its own literal key (`license-branding.html`).
 */
window.htTestLicenseKey = 'non-commercial-and-evaluation';
