/**
 * The license key every test grid is built with. A grid built without a valid key is blocked by the
 * lock screen, so tests read the key from here and a new key is a one-line change.
 *
 * Unit tests import it. The Jasmine specs read it as the `TEST_LICENSE_KEY` global, because
 * `common.js` re-exports it and `helpers/index.js` puts every export of that module on `window`.
 * A test of the license behavior itself keeps its own literal key.
 *
 * @type {string}
 */
export const TEST_LICENSE_KEY = 'non-commercial-and-evaluation';
