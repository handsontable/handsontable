import { canonicalizeProse, computeChecksum } from '../extractKeyData';
import { stringToBase64Url } from '../encoding';

/**
 * The prose a test key carries unless a test passes its own. The checksum covers the prose, and an
 * empty prose makes a key invalid, so every test key needs some.
 *
 * @type {string}
 */
export const TEST_KEY_PROSE = 'This is a test license key.';

/**
 * A minimal, TEST-ONLY entitlement license key builder. It assembles the key - the prose, then the
 * machine-readable block (the base64url payload plus its checksum, wrapped in brackets) - exactly
 * as the reader parses it, so tests can forge keys for the adversarial and edge cases the real
 * generator refuses to produce: both dates on one product, neither of them, a malformed window, an
 * unknown capability token, a tampered checksum, boundary dates.
 *
 * It is deliberately NOT the real generator. Generation - the prose, the schema, the strict record
 * validation - stays in the private `license-key` repository; duplicating it here would create a
 * second source of truth that drifts. Keys that a real generator CAN produce come from it instead,
 * as the fixtures in `./fixtures.js`. Because this builder computes the checksum with the reader's
 * own `canonicalizeProse`, it cannot catch a canonicalization bug - only a generated fixture can.
 *
 * This is not a security concern: the checksum recipe already ships in every Handsontable bundle by
 * design (there is no key material - the protection model is legal and contractual, the same as the
 * legacy mod-97 keys). It lives under `__tests__/` and is never imported from `src/`, so it cannot
 * reach the production bundle.
 *
 * @param {object} payload The payload object to serialize.
 * @param {object} [options] Build options.
 * @param {string} [options.prose] The prose to put in front of the block, and to checksum. Pass an
 *   empty string to build the bare `[...]` block, which the reader must reject.
 * @param {string} [options.checksum] A checksum to use instead of the correct one, for tamper tests.
 * @param {string} [options.rawPayloadJson] The payload JSON to encode verbatim, for the values
 *   `JSON.stringify` cannot produce (`1e999`, a duplicate key).
 * @returns {string} The assembled license key.
 */
export function buildTestKey(payload, { prose = TEST_KEY_PROSE, checksum, rawPayloadJson } = {}) {
  const encodedPayload = stringToBase64Url(rawPayloadJson ?? JSON.stringify(payload));
  const block = `[${encodedPayload}${checksum ?? computeChecksum(canonicalizeProse(prose), encodedPayload)}]`;

  return prose === '' ? block : `${prose}\n\n${block}`;
}
