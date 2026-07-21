import { sha512 } from '../sha512';
import { stringToUtf8Bytes, stringToBase64Url } from '../encoding';

/**
 * A minimal, TEST-ONLY typed license key builder. It assembles the key
 * envelope (tag, some prose, the base64url payload, and the SHA-512 checksum)
 * exactly as the reader parses it, so tests can forge keys for adversarial and
 * edge cases the CLI cannot easily produce: tampered fields, unknown add-ons,
 * malformed payloads, boundary dates, mutation loops.
 *
 * It is deliberately NOT the real generator. The production generator (prose
 * building, strict schema validation, ASCII holder simplification) stays in the
 * private license-key repo - duplicating it here would create a second source
 * of truth that drifts. This builder only needs to produce a byte-for-byte
 * verifiable envelope. It lives under `__tests__/` and is never imported from
 * `src/`, so it cannot reach the production bundle.
 *
 * This is not a security concern: the checksum recipe already ships in every
 * Handsontable bundle by design (no key material; the protection model is
 * legal/contractual, the same as the legacy mod-97 keys).
 *
 * @param {string} tag The type tag, e.g. `'[TRIAL]'`.
 * @param {object} payload The payload object to serialize (stamp `v` yourself).
 * @param {object} [options] Build options.
 * @param {string} [options.prose] The human-readable prose (no checksum-safety
 *   sanitizing - tests control it). Defaults to a short placeholder.
 * @returns {string} The assembled, checksum-valid typed license key.
 */
export function buildTestKey(tag, payload, { prose = 'test_key' } = {}) {
  const encodedPayload = stringToBase64Url(JSON.stringify(payload));
  const keyBody = `${tag}_${prose}____${encodedPayload}`;
  const checksum = sha512(stringToUtf8Bytes(keyBody));

  return `${keyBody}${checksum}`;
}
