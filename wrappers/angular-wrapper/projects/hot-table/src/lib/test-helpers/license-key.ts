/**
 * The license key every test grid is built with. A grid built without a valid key is blocked by the
 * lock screen, so tests read the key from here and a new key is a one-line change.
 *
 * Tests use this rather than the public `NON_COMMERCIAL_LICENSE` constant, which is part of the
 * wrapper's API and is tested on its own in `hot-global-config.service.spec.ts`.
 */
export const TEST_LICENSE_KEY = 'non-commercial-and-evaluation';
