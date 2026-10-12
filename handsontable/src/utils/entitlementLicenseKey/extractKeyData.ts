import type { EntitlementKeyData, ProductEntitlement } from './types';
import { CHECKSUM_LENGTH, DATE_FIELDS, PROSE_DIGEST_LENGTH } from './constants';
import { sha512 } from './sha512';
import { base64ToString, stringToUtf8Bytes, parseIsoDateToTimestamp } from './encoding';

/**
 * The alphabets of the two parts of the machine-readable block. The second
 * part has a fixed length, so the two are split from the right.
 *
 * @type {RegExp}
 */
const ENCODED_PAYLOAD = /^[A-Za-z0-9\-_]+$/;
const CHECKSUM = /^[0-9a-f]+$/;

/**
 * The whitespace the reader ignores, in the text and inside the block: TAB,
 * LF, VT, FF, CR, SPACE, NO-BREAK SPACE,
 * OGHAM SPACE MARK, the U+2000-U+200A spaces, LINE SEPARATOR, PARAGRAPH
 * SEPARATOR, NARROW NO-BREAK SPACE, MEDIUM MATHEMATICAL SPACE, IDEOGRAPHIC
 * SPACE, and the BOM.
 *
 * Listed explicitly instead of `\s`, whose set has changed between JavaScript
 * engines (U+180E) and differs in other languages (U+0085), so it matches the
 * key generator exactly.
 *
 * @type {RegExp}
 */
const PROSE_WHITESPACE = /[\t\n\v\f\r \u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]+/g;

/**
 * A line break or tab that was saved as text - a backslash followed by "n",
 * "r", or "t" - also ignored.
 *
 * Several places a key is stored keep a line break that way rather than as a
 * real one: a single-quoted or unquoted `.env` value, Docker's `--env-file`,
 * and many CI secret fields. The block survives that intact, so without this
 * a genuine key would fail only because of how it was stored. The generator
 * strips backslashes from every free-text field, so a key it issues never
 * carries one of its own.
 *
 * @type {RegExp}
 */
const ESCAPED_WHITESPACE = /\\[nrt]/g;

/**
 * Removes every escaped line break or tab (`\n`, `\r`, `\t` saved as text) and
 * then every whitespace character, in that order.
 *
 * The block is one long word, so a mail client or an editor that wraps the key
 * can break it across lines, and a `.env` file can save that line break as the
 * text `\n`. The block's alphabet has neither, so removing them cannot change
 * a genuine block.
 *
 * @param {string} text The text to remove the whitespace from.
 * @returns {string}
 */
function removeWhitespace(text: string): string {
  return text.replace(ESCAPED_WHITESPACE, '').replace(PROSE_WHITESPACE, '');
}

/**
 * Brings the human-readable text of a key to the form the key protects.
 *
 * Only the whitespace, its escaped forms, and the Unicode composition are
 * ignored. A mail client that rewraps the text (also between two CJK
 * characters or inside a word) or collapses a blank line, a `.env` file that
 * saves a line break as `\n`, or a system that stores "u" + U+0308 instead of
 * U+00FC leaves the key valid. A changed, added, or removed letter, digit, or
 * symbol does not.
 * Exported for the test key builder; the library calls `extractEntitlementKeyData`.
 *
 * @param {string} prose The text in front of the machine-readable block.
 * @returns {string}
 */
export function canonicalizeProse(prose: string): string {
  // NFC runs last: a line break between a letter and its combining mark (an
  // NFD copy rewrapped there) has to be gone before the two can compose.
  return removeWhitespace(prose).normalize('NFC');
}

/**
 * Computes the checksum that closes the block. It must match the canonical
 * reader in every key format, so Handsontable 18.1 keeps reading newer keys.
 * Exported for the test key builder.
 *
 * @param {string} encodedPayload The encoded payload.
 * @returns {string}
 */
export function computePayloadChecksum(encodedPayload: string): string {
  return sha512(stringToUtf8Bytes(encodedPayload));
}

/**
 * Computes the value a current key stores for its text. Exported for the test
 * key builder.
 *
 * @param {string} canonicalProse The text, already passed through `canonicalizeProse`.
 * @returns {string}
 */
export function computeProseDigest(canonicalProse: string): string {
  return sha512(stringToUtf8Bytes(canonicalProse)).slice(0, PROSE_DIGEST_LENGTH);
}

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
 * Freezes the value and everything nested in it. The read result is shared
 * between callers (see the memo below), so a caller that sorted or pushed into
 * it would silently rewrite what the next caller reads.
 *
 * It walks with an explicit stack, not by recursion. An unknown extra field is
 * kept as it is, and a key can nest one thousands of levels deep - recursion
 * would then overflow the call stack and throw out of the reader, where a key
 * is only ever allowed to read as data or as `null`.
 *
 * @param {*} value The value to freeze.
 * @returns {*}
 */
function deepFreeze<T>(value: T): T {
  const pending: unknown[] = [value];

  while (pending.length > 0) {
    const current = pending.pop();

    if (isFreezable(current)) {
      Object.freeze(current);
      Object.keys(current).forEach(key => pending.push(current[key]));
    }
  }

  return value;
}

/**
 * Narrows an unknown value to an object (or array) that is not frozen yet.
 *
 * @param {*} value The value to check.
 * @returns {boolean}
 */
function isFreezable(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Object.isFrozen(value);
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
  if (parseIsoDateToTimestamp(entry[presentDateFields[0]]) === null) {
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
 * Reads the format version of a payload. Returns `null` for a value no
 * generator writes. A version newer than this reader knows is accepted, so a
 * build already in the field keeps reading newer keys.
 *
 * @param {object} payload The decoded payload.
 * @returns {number|null}
 */
function readFormatVersion(payload: Record<string, unknown>): number | null {
  // Own properties only, so a value another script put on `Object.prototype`
  // cannot change how a key is read.
  if (!hasOwn(payload, 'v')) {
    return 1;
  }
  if (!isNonNegativeInteger(payload.v) || payload.v < 2) {
    return null;
  }

  return payload.v;
}

/**
 * Checks that the text of a current key is intact and that nothing but
 * whitespace follows its block. A key always states its terms, so the bare
 * block is rejected. A key in the earlier format is read the way Handsontable
 * 18.1 reads it.
 *
 * @param {object} payload The decoded payload.
 * @param {string} prose The text in front of the block.
 * @param {string} textAfterBlock The text after the block.
 * @returns {boolean}
 */
function coversItsText(payload: Record<string, unknown>, prose: string, textAfterBlock: string): boolean {
  if (canonicalizeProse(textAfterBlock) !== '') {
    return false;
  }

  const canonicalProse = canonicalizeProse(prose);

  return canonicalProse !== '' && hasOwn(payload, 'prose') && typeof payload.prose === 'string' &&
    computeProseDigest(canonicalProse) === payload.prose;
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

  const content = removeWhitespace(licenseKey.slice(blockStart + 1, blockEnd));

  if (content.length <= CHECKSUM_LENGTH) {
    return null;
  }

  const encodedPayload = content.slice(0, -CHECKSUM_LENGTH);
  const checksum = content.slice(-CHECKSUM_LENGTH);

  if (!ENCODED_PAYLOAD.test(encodedPayload) || !CHECKSUM.test(checksum)) {
    return null;
  }
  if (computePayloadChecksum(encodedPayload) !== checksum) {
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

  const version = readFormatVersion(payload);

  if (version === null) {
    return null;
  }
  if (version >= 2 && !coversItsText(payload, licenseKey.slice(0, blockStart), licenseKey.slice(blockEnd + 1))) {
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

  return deepFreeze({ version, products });
}

// The license key is read twice per grid init - the bottom bar
// (`initLicenseNotification`) and the branding UI (`initLicenseBranding`) each resolve the license
// state - and reading runs the full verification and decoding. A one-entry memo on the key makes
// the second read free. The returned data is frozen, as in the canonical reader, so sharing one
// object is safe.
let memoizedKey: string | null = null;
let memoizedData: EntitlementKeyData | null = null;

/**
 * Extracts the machine-readable data from an entitlement license key.
 *
 * The key is verified first, so the returned data is guaranteed to belong to
 * an intact key. A malformed or tampered key reads as `null` - reporting an
 * invalid key is the caller's job, not this function's.
 *
 * A current key protects its text as well: edited or removed text (the bare
 * `[...]` block), or anything but whitespace after the block, reads as `null`.
 * A key in the earlier format reads the way Handsontable 18.1 reads it. The
 * verification rules are those of the canonical reader in the private
 * `license-key` repository.
 *
 * The caller passes the whole key. The text is never parsed, and its
 * whitespace and Unicode composition are ignored, so rewrapped or re-pasted
 * text still validates. Whitespace inside the block is ignored too, so a
 * block wrapped by a mail client still validates.
 *
 * Unknown products, capability tokens and flags are all tolerated, so nothing
 * about reading a key depends on the commercial vocabulary.
 *
 * The result is frozen. Copy an array before sorting or changing it.
 *
 * @param {string} licenseKey The license key to extract the data from.
 * @returns {EntitlementKeyData|null}
 */
export function extractEntitlementKeyData(licenseKey: string): EntitlementKeyData | null {
  if (typeof licenseKey !== 'string') {
    return null;
  }
  if (licenseKey !== memoizedKey) {
    // Read first, remember second. Were the key remembered before the read,
    // a read that throws would leave the new key paired with the previous
    // key's data, and the next read of the new key would return it.
    const data = readEntitlementKeyData(licenseKey);

    memoizedKey = licenseKey;
    memoizedData = data;
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
