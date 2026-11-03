/**
 * The license key every test grid is built with. A grid built without a valid key is blocked by the
 * lock screen, so tests read the key from here and a new key is a one-line change.
 *
 * Kept apart from `_helpers.tsx`, which registers `beforeEach` and `afterEach` hooks when imported.
 */
export const TEST_LICENSE_KEY = 'non-commercial-and-evaluation';
