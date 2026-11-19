/**
 * The license key every test grid is built with. A grid built without a valid key is blocked by the
 * lock screen, so tests read the key from here and a new key is a one-line change.
 *
 * Kept apart from `_helpers.tsx`, which registers `beforeEach` and `afterEach` hooks when imported.
 *
 * The key is the internal test key, issued with `npm run generate-internal-test-key` in the private
 * `license-key` package. Its text says in capitals that it is not licensed for production, and it
 * works for builds released on or before 2036-11-04: renew it before then. Every test-key constant
 * holds the same key, which `scripts/__tests__/test-license-key.test.mjs` checks.
 */
// eslint-disable-next-line max-len
export const TEST_LICENSE_KEY = 'This is a Handsontable license key for HANDSONTABLE INTERNAL TEST KEY, issued on 2026-11-04 for the "NOT FOR PRODUCTION USE" project. It includes 1 test license: > 1. INTERNAL TEST KEY for the Handsontable test suites, for builds released on or before 2036-11-04 (UTC). NOT LICENSED FOR PRODUCTION OR ANY OTHER USE. [eyJwcm9kdWN0cyI6eyJoYW5kc29udGFibGUiOnsiY2FwYWJpbGl0aWVzIjpbImNvcmUiXSwicmVsZWFzZV91bnRpbCI6IjIwMzYtMTEtMDQiLCJub3RpY2UiOjAsImdyYWNlIjowLCJmbGFncyI6W119fSwidiI6MiwicHJvc2UiOiJiMjM1MGRmYWQ4YjM4NDMzNmU4MTZhMjU2MzgwNzFlZjU0M2I3ZWQ3ZjhmNjJhNjVjZjFiNTk4NzE2OTU2NDVmIn036525f7e3148e6adf22b9413fdf817c41079854724b09573574ed3ebf0e64e2a940e4a380137db866c6bac0242f06f6caa89713bb1885cedbf18a43095cdd501]';
