import type { TypedKeyType } from './types';

/**
 * Maps the type tag that prefixes every typed license key to its key type.
 * Tags are append-only - renaming or removing one makes already-issued keys
 * of that type unreadable.
 *
 * @type {Record<string, TypedKeyType>}
 */
export const TAG_TO_TYPE: Record<string, TypedKeyType> = {
  '[TRIAL]': 'trial',
  '[FREE]': 'freemium',
  '[SUB]': 'subscription',
  '[PERP]': 'perpetual',
};

/**
 * The typed license key format versions this reader can parse. The version is
 * stamped into the payload (the "v" field) at generation. A key stamped with a
 * version outside this list is not readable - the version describes HOW the
 * key is parsed (envelope, encoding, checksum).
 *
 * @type {number[]}
 */
export const SUPPORTED_VERSIONS = [1];

/**
 * The length of the checksum (SHA-512 as hex) that postfixes every typed
 * license key.
 *
 * @type {number}
 */
export const CHECKSUM_LENGTH = 128;

/**
 * The separator between the human-readable part of a typed key and the
 * machine-readable base64 payload. Four underscores never occur inside the
 * base64 payload, so the last occurrence marks the payload boundary.
 *
 * @type {string}
 */
export const PAYLOAD_SEPARATOR = '____';

/**
 * The name of the product this build validates. Handsontable resolves its
 * license state (and its entitlements) from this product's entry in the key
 * payload; a key that does not grant it is not a valid Handsontable license.
 *
 * @type {string}
 */
export const HANDSONTABLE_PRODUCT = 'handsontable';

/**
 * The products this reader knows, in priority order. A payload granting a
 * product outside this list cannot be read reliably (the licensed product,
 * and so the expiration, could be resolved wrongly). Product names are
 * append-only for this reason.
 *
 * @type {string[]}
 */
export const KNOWN_PRODUCTS = ['handsontable', 'hyperformula'];

/**
 * The add-ons this build recognizes, per product. Append-only: an older build
 * that does not know a newer add-on name must still read the key - the unknown
 * add-on simply unlocks nothing. Kept here so the whole vocabulary lives in one
 * place.
 *
 * @type {Record<string, string[]>}
 */
export const KNOWN_ADDONS: Record<string, string[]> = {
  handsontable: [],
  hyperformula: ['spreadsheet', 'import_export'],
};

/**
 * The grace period (in days) used when a hard-stop key (trial, subscription)
 * carries no grace in its payload. The grace is normally stamped into the key
 * at generation; these defaults only guard a malformed-but-verified payload.
 *
 * @type {Record<string, number>}
 */
export const DEFAULT_GRACE_DAYS: Record<string, number> = {
  trial: 15,
  subscription: 90,
};

/**
 * The number of days that separates the "ending soon" subscription warning
 * from the silent, comfortably-valid state.
 *
 * @type {number}
 */
export const SUBSCRIPTION_ENDING_SOON_DAYS = 60;

/**
 * The number of milliseconds in a day, used to convert the millisecond gap
 * between two timestamps into whole days.
 *
 * @type {number}
 */
export const MILLISECONDS_PER_DAY = 86400000;
