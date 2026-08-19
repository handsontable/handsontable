import type { EntitlementKeyData, ProductEntitlement } from './types';
import { CHECKSUM_LENGTH, DATE_FIELDS } from './constants';
import { sha512 } from './sha512';
import { base64ToString, stringToUtf8Bytes, parseIsoDateToTimestamp } from './encoding';

/**
 * The alphabet of the encoded payload - URL-safe base64 without padding. The
 * checksum (lowercase hex) is a subset of it, which is what lets the two be
 * split by a fixed length from the right.
 *
 * @type {RegExp}
 */
const ENCODED_PAYLOAD = /^[A-Za-z0-9\-_]+$/;
const CHECKSUM = /^[0-9a-f]+$/;

/**
 * Reports own-property presence without trusting a payload's inherited or
 * overridden `hasOwnProperty`.
 *
 * @param {object} object The object to inspect.
 * @param {string} key The property name to look up.
 * @returns {boolean}
 */
function hasOwn(object: object, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(object, key);
}

/**
 * Narrows an unknown value to a plain (non-null, non-array) object.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Returns `true` when the value is a non-negative integer. `Number.isFinite`
 * also rejects `Infinity` (JSON `1e999` parses to it), which would otherwise
 * turn a window size into a non-finite date downstream.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.floor(value) === value && value >= 0;
}

/**
 * Returns `true` when the value is an array of strings.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Adds an own, ordinary property.
 *
 * Both the product names and the field names of a product entry come from
 * JSON, so "__proto__" is a name an attacker can put in a key. A plain
 * assignment would go through the `Object.prototype` setter: the value would
 * vanish from `Object.keys` while still resolving through the chain. Exported
 * because every payload-keyed write in this module must use it - `grants.ts`
 * re-keys the same product names.
 *
 * @param {object} target The object to add the property to.
 * @param {string} key The property name.
 * @param {*} value The property value.
 * @returns {void}
 */
export function defineOwn(target: object, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    value, enumerable: true, writable: true, configurable: true,
  });
}

/**
 * Verifies and normalizes one product entry.
 *
 * Strict about SHAPE: exactly one of the two dates, a real calendar date, and
 * the two window sizes. A key that gets this wrong is malformed, not merely
 * unknown, and reading it would mean guessing what was licensed.
 *
 * Lenient about VOCABULARY: an unrecognized capability token, an unrecognized
 * flag and an unrecognized extra field are all kept and ignored. Without that
 * leniency every token added on the issuing side would break every build
 * already deployed in the field.
 *
 * Returns `null` when the entry is malformed.
 *
 * @param {*} entry The product entry of the payload.
 * @returns {ProductEntitlement|null}
 */
function normalizeProductEntry(entry: unknown): ProductEntitlement | null {
  if (!isPlainObject(entry)) {
    return null;
  }
  if (!isStringArray(entry.capabilities)) {
    return null;
  }

  const presentDateFields = DATE_FIELDS.filter(field => entry[field] !== undefined);

  // Exactly one date per product. "Both" and "neither" are each a different
  // commercial shape that the format cannot express, so neither may be silently
  // resolved by whichever field the reader happens to look at first.
  if (presentDateFields.length !== 1) {
    return null;
  }
  if (parseIsoDateToTimestamp(`${entry[presentDateFields[0]]}`) === null) {
    return null;
  }
  if (!isNonNegativeInteger(entry.notice) || !isNonNegativeInteger(entry.grace)) {
    return null;
  }
  if (entry.flags !== undefined && !isStringArray(entry.flags)) {
    return null;
  }

  // Start from everything the entry carries, so a field this version does not
  // know survives into the result instead of being silently dropped. A field
  // added to the format later is exactly the case a vendored reader has to
  // survive, and one that quietly discards it makes the field invisible to the
  // layers above.
  const normalized = {} as ProductEntitlement;

  Object.keys(entry).forEach(field => defineOwn(normalized, field, entry[field]));

  defineOwn(normalized, 'capabilities', entry.capabilities.slice());
  defineOwn(normalized, 'notice', entry.notice);
  defineOwn(normalized, 'grace', entry.grace);
  // An absent array and an empty one mean the same thing. Normalizing here
  // keeps `flags.indexOf('trial')` safe at every call site.
  defineOwn(normalized, 'flags', entry.flags === undefined ? [] : entry.flags.slice());
  defineOwn(normalized, presentDateFields[0], entry[presentDateFields[0]]);

  return normalized;
}

/**
 * Reads and verifies one key. Split out from the memoized public entry point so
 * the memo can wrap every exit path uniformly.
 *
 * @param {string} licenseKey The license key to read.
 * @returns {EntitlementKeyData|null}
 */
function readEntitlementKeyData(licenseKey: string): EntitlementKeyData | null {
  // The machine-readable block closes the key. Searching backwards means a
  // bracket inside the prose cannot shadow it.
  const blockStart = licenseKey.lastIndexOf('[');

  if (blockStart === -1) {
    return null;
  }

  const blockEnd = licenseKey.indexOf(']', blockStart);

  if (blockEnd === -1) {
    return null;
  }

  const content = licenseKey.slice(blockStart + 1, blockEnd);

  if (content.length <= CHECKSUM_LENGTH) {
    return null;
  }

  const encodedPayload = content.slice(0, -CHECKSUM_LENGTH);
  const checksum = content.slice(-CHECKSUM_LENGTH);

  if (!ENCODED_PAYLOAD.test(encodedPayload) || !CHECKSUM.test(checksum)) {
    return null;
  }
  if (sha512(stringToUtf8Bytes(encodedPayload)) !== checksum) {
    return null;
  }

  const payloadJson = base64ToString(encodedPayload);

  if (payloadJson === null) {
    return null;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }

  if (!isPlainObject(payload) || !isPlainObject(payload.products)) {
    return null;
  }

  const products = {} as EntitlementKeyData['products'];
  const entries = payload.products;
  let malformed = false;

  Object.keys(entries).forEach((name) => {
    const entry = normalizeProductEntry(entries[name]);

    if (entry === null) {
      malformed = true;

      return;
    }

    defineOwn(products, name, entry);
  });

  if (malformed) {
    return null;
  }

  return { products };
}

// The license key is read twice per grid init - the bottom bar
// (`initLicenseNotification`) and the branding UI (`initLicenseBranding`) each resolve the license
// state - and reading runs the full SHA-512 + base64 + JSON parse. A one-entry memo on the key makes
// the second read free. The returned data is treated as read-only by every caller, so sharing one
// object is safe.
let memoizedKey: string | null = null;
let memoizedData: EntitlementKeyData | null = null;

/**
 * Extracts the machine-readable data from an entitlement license key.
 *
 * The checksum is verified first, so the returned data is guaranteed to belong
 * to an intact block. A malformed or tampered key reads as `null` - reporting
 * an invalid key is the caller's job, not this function's.
 *
 * Only the bracketed block matters. The prose in front of it is neither parsed
 * nor covered by the checksum, so the caller may pass the whole key or just the
 * `[...]` block, and rewrapped or re-pasted prose still validates. The block
 * itself has to be intact: its alphabet has no whitespace, so a newline inside
 * it makes the key unreadable, exactly as it does for the key generator.
 *
 * Unknown products, capability tokens and flags are all tolerated, so nothing
 * about reading a key depends on the commercial vocabulary.
 *
 * @param {string} licenseKey The license key to extract the data from.
 * @returns {EntitlementKeyData|null}
 */
export function extractEntitlementKeyData(licenseKey: string): EntitlementKeyData | null {
  const key = `${licenseKey}`;

  if (key !== memoizedKey) {
    memoizedKey = key;
    memoizedData = readEntitlementKeyData(key);
  }

  return memoizedData;
}

/**
 * Returns the entitlement of one product, but only when it is present as an own
 * property. Used by the lifecycle and grants layers to read one product without
 * trusting the prototype chain.
 *
 * @param {EntitlementKeyData} keyData The verified key data.
 * @param {string} productName The product to read.
 * @returns {ProductEntitlement|null}
 */
export function getProductEntitlement(
  keyData: EntitlementKeyData,
  productName: string,
): ProductEntitlement | null {
  if (!hasOwn(keyData.products, productName)) {
    return null;
  }

  const product = keyData.products[productName];

  return isPlainObject(product) ? product as ProductEntitlement : null;
}
