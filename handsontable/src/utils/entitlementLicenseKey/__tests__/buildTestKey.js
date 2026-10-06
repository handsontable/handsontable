import { canonicalizeProse, computePayloadChecksum, computeProseDigest } from '../extractKeyData';
import { base64ToString, stringToBase64Url } from '../encoding';

/**
 * The prose a test key carries unless a test passes its own. A version 2 key covers the prose with
 * a digest in its payload, and an empty prose makes such a key invalid, so every test key needs some.
 *
 * @type {string}
 */
const TEST_KEY_PROSE = 'This is a test license key.';

/**
 * Returns the machine-readable `[...]` block of a key, without the prose in front of it. The block
 * starts at the LAST "[", as in the reader, so a bracket inside the prose cannot hide it.
 *
 * @param {string} key The whole key.
 * @returns {string}
 */
export function blockOf(key) {
  return key.slice(key.lastIndexOf('['));
}

/**
 * Returns the prose of a key - everything in front of its block.
 *
 * @param {string} key The whole key.
 * @returns {string}
 */
export function proseOf(key) {
  return key.slice(0, key.lastIndexOf('['));
}

/**
 * Returns the decoded payload of a key, as the object the generator serialized.
 *
 * @param {string} key The whole key.
 * @returns {object}
 */
export function payloadOf(key) {
  const block = blockOf(key);
  const encodedPayload = block.slice(1, block.indexOf(']')).replace(/\s+/g, '').slice(0, -128);

  return JSON.parse(base64ToString(encodedPayload));
}

/**
 * A minimal, TEST-ONLY entitlement license key builder. It assembles the key - the prose, then the
 * machine-readable block (the base64url payload plus its checksum, wrapped in brackets) - exactly
 * as the reader parses it, so tests can forge keys for the adversarial and edge cases the real
 * generator refuses to produce: both dates on one product, neither of them, a malformed window, an
 * unknown capability token, a tampered checksum or prose digest, boundary dates.
 *
 * It is deliberately NOT the real generator. Generation - the prose, the schema, the strict record
 * validation - stays in the private `license-key` repository; duplicating it here would create a
 * second source of truth that drifts. Keys that a real generator CAN produce come from it instead,
 * as the fixtures in `./fixtures.js`. Because this builder computes the prose digest with the
 * reader's own `canonicalizeProse`, it cannot catch a canonicalization bug - only a generated
 * fixture can.
 *
 * By default it builds a version 2 key: the payload gets `v` and the `prose` digest after the
 * fields the test passes, unless the test passes its own `v` or `prose` (to forge a bad one).
 * `version: 1` builds a key as `license-key` 4.x issued it, with neither field.
 *
 * This is not a security concern: the checksum recipe already ships in every Handsontable bundle by
 * design (there is no key material - the protection model is legal and contractual, the same as the
 * legacy mod-97 keys). It lives under `__tests__/` and is never imported from `src/`, so it cannot
 * reach the production bundle.
 *
 * @param {object} payload The payload object to serialize.
 * @param {object} [options] Build options.
 * @param {string} [options.prose] The prose to put in front of the block, and to digest. Pass an
 *   empty string to build the bare `[...]` block.
 * @param {number} [options.version] The format version: 2 (the default) adds `v` and `prose`, 1
 *   adds neither.
 * @param {string} [options.checksum] A checksum to use instead of the correct one, for tamper tests.
 * @param {string} [options.rawPayloadJson] The payload JSON to encode verbatim, for the values
 *   `JSON.stringify` cannot produce (`1e999`, a duplicate key). `v` and `prose` are not added to it.
 * @returns {string} The assembled license key.
 */
export function buildTestKey(payload, { prose = TEST_KEY_PROSE, version = 2, checksum, rawPayloadJson } = {}) {
  const fullPayload = { ...payload };

  if (version >= 2) {
    if (!Object.prototype.hasOwnProperty.call(fullPayload, 'v')) {
      fullPayload.v = version;
    }
    if (!Object.prototype.hasOwnProperty.call(fullPayload, 'prose')) {
      fullPayload.prose = computeProseDigest(canonicalizeProse(prose));
    }
  }

  const encodedPayload = stringToBase64Url(rawPayloadJson ?? JSON.stringify(fullPayload));
  const block = `[${encodedPayload}${checksum ?? computePayloadChecksum(encodedPayload)}]`;

  return prose === '' ? block : `${prose}\n\n${block}`;
}
