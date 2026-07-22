import type {
  TypedKeyType,
  TypedKeyPayload,
  TypedKeyProductPayload,
  TypedKeyData,
} from './types';
import {
  TAG_TO_TYPE,
  SUPPORTED_VERSIONS,
  CHECKSUM_LENGTH,
  PAYLOAD_SEPARATOR,
  KNOWN_PRODUCTS,
} from './constants';
import { sha512 } from './sha512';
import { base64ToString, stringToUtf8Bytes, parseIsoDateToTimestamp } from './encoding';

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
 * Normalizes a pasted license key for reading: every whitespace character is
 * removed. The key alphabet has no whitespace, so this is lossless - and it
 * repairs a key mangled by hard-wrapping (an email client inserting newlines
 * inside the 500+ character string) as well as the common trailing newline from
 * a copy-paste. Without it, an internal newline breaks the checksum and a valid
 * key reads as invalid.
 *
 * @param {string} licenseKey The raw license key.
 * @returns {string}
 */
function normalizeKey(licenseKey: string): string {
  return `${licenseKey}`.replace(/\s+/g, '');
}

/**
 * Verifies the decoded JSON has the shape of a typed key payload: a supported
 * format version and a plain-object `products` map. Field-level leniency (an
 * unknown tier or add-on inside a known product) is intentional - the reader
 * only guards the envelope, not the marketing vocabulary.
 *
 * @param {*} value The decoded JSON value.
 * @returns {boolean}
 */
function isTypedKeyPayload(value: unknown): value is TypedKeyPayload {
  return isPlainObject(value)
    && typeof value.v === 'number'
    && SUPPORTED_VERSIONS.indexOf(value.v) !== -1
    && isPlainObject(value.products);
}

/**
 * Derives the expiration time from the key payload. The expiration date
 * ("exp", in the "YYYY-MM-DD" format) of the licensed product is converted to
 * epoch milliseconds (UTC midnight). A payload without the expiration date (a
 * freemium key) maps to `null`, which means the key never expires. The `null`
 * sentinel is deliberately not a number - a real timestamp of 0 must stay
 * distinguishable from "never". Returns `undefined` when the payload does not
 * have the expected shape.
 *
 * @param {TypedKeyPayload} payload The key payload.
 * @returns {number|null|undefined}
 */
function extractExpiryTimestamp(payload: TypedKeyPayload): number | null | undefined {
  const { products } = payload;

  // The licensed product is the first known product present in the payload (the
  // list order defines the priority). Presence is read own-property only, so an
  // inherited prototype-chain property cannot masquerade as a grant. A product
  // this build does not know is simply skipped, NOT a reason to reject the whole
  // key: product names are append-only, so a newer key that grants Handsontable
  // AND some future product must still read on today's builds - and since the
  // known products keep their relative priority, the extra unknown product can
  // never change which product is licensed here.
  const licensedProductName = KNOWN_PRODUCTS.find(name => hasOwn(products, name));

  // The payload grants no product this build knows - there is nothing to resolve
  // the license from.
  if (licensedProductName === undefined) {
    return undefined;
  }

  const licensedProduct = products[licensedProductName];

  if (!isPlainObject(licensedProduct)) {
    return undefined;
  }
  if (licensedProduct.exp === undefined) {
    return null;
  }

  const timestamp = parseIsoDateToTimestamp(`${licensedProduct.exp}`);

  // A malformed or impossible date - such a payload is not trustworthy.
  return timestamp === null ? undefined : timestamp;
}

/**
 * Tells whether a string begins with a known typed license key tag. This is a
 * cheap prefix test used to route a key to the typed path before any parsing -
 * a legacy key pays nothing.
 *
 * @param {string} licenseKey The license key to test.
 * @returns {boolean}
 */
export function hasTypedKeyTag(licenseKey: string): boolean {
  const key = normalizeKey(licenseKey);

  return Object.keys(TAG_TO_TYPE).some(tag => key.indexOf(`${tag}${PAYLOAD_SEPARATOR.charAt(0)}`) === 0);
}

/**
 * Reads and verifies a normalized typed key. Split out from the memoized public
 * entry point so the memo can wrap every exit path uniformly.
 *
 * @param {string} key The whitespace-normalized license key.
 * @returns {TypedKeyData|null}
 */
function readTypedKeyData(key: string): TypedKeyData | null {
  const foundTag = Object.keys(TAG_TO_TYPE).find(tag => key.indexOf(`${tag}_`) === 0);
  const keyType: TypedKeyType | null = foundTag === undefined ? null : TAG_TO_TYPE[foundTag];

  if (keyType === null || key.length <= CHECKSUM_LENGTH) {
    return null;
  }

  const keyBody = key.slice(0, -CHECKSUM_LENGTH);
  const checksum = key.slice(-CHECKSUM_LENGTH);

  if (!/^[0-9a-f]+$/.test(checksum)) {
    return null;
  }
  if (sha512(stringToUtf8Bytes(keyBody)) !== checksum) {
    return null;
  }

  // The quadruple underscore separates the human-readable part from the
  // machine-readable one. The LAST occurrence is used - the base64 payload can
  // never contain four consecutive underscores, while the human-readable part
  // could.
  const separatorIndex = keyBody.lastIndexOf(PAYLOAD_SEPARATOR);

  if (separatorIndex === -1) {
    return null;
  }

  const payloadJson = base64ToString(keyBody.slice(separatorIndex + PAYLOAD_SEPARATOR.length));

  if (payloadJson === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(payloadJson);
  } catch (error) {
    return null;
  }

  if (!isTypedKeyPayload(parsed)) {
    return null;
  }

  const expiryTimestamp = extractExpiryTimestamp(parsed);

  if (expiryTimestamp === undefined) {
    return null;
  }

  return {
    keyType,
    payload: parsed,
    expiryTimestamp,
  };
}

// The license key is read twice per grid init - the bottom bar (`initLicenseNotification`) and the
// corner badge (`initLicenseBranding`) each resolve the license state - and reading runs the full
// SHA-512 + base64 + JSON parse. A one-entry memo on the normalized key makes the second read free.
// The returned data is treated as read-only by every caller, so sharing one object is safe.
let memoizedKey: string | null = null;
let memoizedData: TypedKeyData | null = null;

/**
 * Extracts the machine-readable data from a typed license key (`[TRIAL]`,
 * `[FREE]`, `[SUB]` or `[PERP]`). The checksum is verified first, so the
 * returned data is guaranteed to belong to an intact key. Returns `null` for a
 * malformed, tampered, unknown-version, or unknown-product key. The result for
 * the most recently read key is memoized (see above).
 *
 * @param {string} licenseKey The license key to extract the data from.
 * @returns {TypedKeyData|null}
 */
export function extractTypedKeyData(licenseKey: string): TypedKeyData | null {
  const key = normalizeKey(licenseKey);

  if (key !== memoizedKey) {
    memoizedKey = key;
    memoizedData = readTypedKeyData(key);
  }

  return memoizedData;
}

/**
 * Returns the payload entry of a product, but only when it is a plain object
 * present as an own property. Used by the lifecycle and grants layers to read
 * one product without trusting the prototype chain.
 *
 * @param {TypedKeyPayload} payload The verified key payload.
 * @param {string} productName The product to read.
 * @returns {TypedKeyProductPayload|null}
 */
export function getProductPayload(
  payload: TypedKeyPayload,
  productName: string,
): TypedKeyProductPayload | null {
  if (!hasOwn(payload.products, productName)) {
    return null;
  }

  const product = payload.products[productName];

  return isPlainObject(product) ? product : null;
}
