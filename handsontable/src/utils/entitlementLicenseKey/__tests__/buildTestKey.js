import { sha512 } from '../sha512';
import { stringToUtf8Bytes, stringToBase64Url } from '../encoding';

/**
 * A minimal, TEST-ONLY entitlement license key builder. It assembles the machine-readable block
 * (the base64url payload plus its SHA-512 checksum, wrapped in brackets) exactly as the reader
 * parses it, so tests can forge keys for the adversarial and edge cases the real generator refuses
 * to produce: both dates on one product, neither of them, a malformed window, an unknown capability
 * token, a tampered checksum, boundary dates.
 *
 * It is deliberately NOT the real generator. Generation - the prose, the schema, the strict record
 * validation - stays in the private `license-key` repository; duplicating it here would create a
 * second source of truth that drifts. Keys that a real generator CAN produce come from it instead,
 * as the fixtures in `./fixtures.js`.
 *
 * This is not a security concern: the checksum recipe already ships in every Handsontable bundle by
 * design (there is no key material - the protection model is legal and contractual, the same as the
 * legacy mod-97 keys). It lives under `__tests__/` and is never imported from `src/`, so it cannot
 * reach the production bundle.
 *
 * @param {object} payload The payload object to serialize.
 * @param {object} [options] Build options.
 * @param {string} [options.prose] The prose to put in front of the block. It is neither parsed nor
 *   checksummed, so tests control it freely. Defaults to no prose at all.
 * @param {string} [options.checksum] A checksum to use instead of the correct one, for tamper tests.
 * @param {string} [options.rawPayloadJson] The payload JSON to encode verbatim, for the values
 *   `JSON.stringify` cannot produce (`1e999`, a duplicate key).
 * @returns {string} The assembled license key.
 */
export function buildTestKey(payload, { prose = '', checksum, rawPayloadJson } = {}) {
  const encodedPayload = stringToBase64Url(rawPayloadJson ?? JSON.stringify(payload));
  const block = `[${encodedPayload}${checksum ?? sha512(stringToUtf8Bytes(encodedPayload))}]`;

  return prose === '' ? block : `${prose}\n\n${block}`;
}
