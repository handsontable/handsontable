/* eslint-disable no-bitwise */

/**
 * The base64 alphabet.
 *
 * @type {string}
 */
const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Encodes the string as UTF-8 bytes. The plain implementation is used on purpose.
 * It does not depend on `TextEncoder` or `Buffer`, so the same code works in
 * Node.js and in every browser, including plain http:// pages.
 *
 * @param {string} string The string to encode.
 * @returns {number[]}
 */
export function stringToUtf8Bytes(string: string): number[] {
  const bytes = [];

  for (let i = 0; i < string.length; i += 1) {
    let codePoint = string.charCodeAt(i);

    // Combine a surrogate pair into a single code point.
    if (codePoint >= 0xd800 && codePoint <= 0xdbff && i + 1 < string.length) {
      const lowSurrogate = string.charCodeAt(i + 1);

      if (lowSurrogate >= 0xdc00 && lowSurrogate <= 0xdfff) {
        codePoint = ((codePoint - 0xd800) * 0x400) + (lowSurrogate - 0xdc00) + 0x10000;
        i += 1;
      }
    }

    if (codePoint < 0x80) {
      bytes.push(codePoint);
    } else if (codePoint < 0x800) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint < 0x10000) {
      bytes.push(
        0xe0 | (codePoint >> 12),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return bytes;
}

/**
 * Decodes UTF-8 bytes back into a string.
 *
 * @param {number[]} bytes The bytes to decode.
 * @returns {string}
 */
export function utf8BytesToString(bytes: number[]): string {
  let string = '';
  let i = 0;

  while (i < bytes.length) {
    const byte = bytes[i];
    let codePoint;

    if (byte < 0x80) {
      codePoint = byte;
      i += 1;
    } else if (byte < 0xe0) {
      codePoint = ((byte & 0x1f) << 6) | (bytes[i + 1] & 0x3f);
      i += 2;
    } else if (byte < 0xf0) {
      codePoint = ((byte & 0x0f) << 12) | ((bytes[i + 1] & 0x3f) << 6) | (bytes[i + 2] & 0x3f);
      i += 3;
    } else {
      codePoint = ((byte & 0x07) << 18) | ((bytes[i + 1] & 0x3f) << 12)
        | ((bytes[i + 2] & 0x3f) << 6) | (bytes[i + 3] & 0x3f);
      i += 4;
    }

    if (codePoint >= 0x10000) {
      // Split the code point back into a surrogate pair.
      codePoint -= 0x10000;
      string += String.fromCharCode(0xd800 + (codePoint >> 10), 0xdc00 + (codePoint & 0x3ff));
    } else {
      string += String.fromCharCode(codePoint);
    }
  }

  return string;
}

/**
 * Encodes the bytes as a base64 string (standard alphabet, with padding).
 *
 * @param {number[]} bytes The bytes to encode.
 * @returns {string}
 */
export function bytesToBase64(bytes: number[]): string {
  let base64 = '';

  for (let i = 0; i < bytes.length; i += 3) {
    const byte1 = bytes[i];
    const byte2 = bytes[i + 1];
    const byte3 = bytes[i + 2];

    base64 += BASE64_ALPHABET.charAt(byte1 >> 2);
    base64 += BASE64_ALPHABET.charAt(((byte1 & 0x03) << 4) | (byte2 === undefined ? 0 : byte2 >> 4));
    base64 += byte2 === undefined
      ? '=' : BASE64_ALPHABET.charAt(((byte2 & 0x0f) << 2) | (byte3 === undefined ? 0 : byte3 >> 6));
    base64 += byte3 === undefined ? '=' : BASE64_ALPHABET.charAt(byte3 & 0x3f);
  }

  return base64;
}

/**
 * Decodes a base64 string (standard or URL-safe alphabet, padding optional)
 * back into bytes. Returns `null` when the string is not valid base64.
 *
 * @param {string} base64 The base64 string to decode.
 * @returns {number[]|null}
 */
export function base64ToBytes(base64: string): number[] | null {
  const normalized = `${base64}`.replace(/-/g, '+').replace(/_/g, '/').replace(/=+$/, '');

  if (!/^[A-Za-z0-9+/]*$/.test(normalized) || normalized.length % 4 === 1) {
    return null;
  }

  const bytes = [];

  for (let i = 0; i < normalized.length; i += 4) {
    const chunk = [0, 1, 2, 3].map((offset) => {
      const char = normalized.charAt(i + offset);

      // `indexOf('')` would return 0, so the missing characters of the last
      // chunk have to be mapped to -1 explicitly.
      return char === '' ? -1 : BASE64_ALPHABET.indexOf(char);
    });

    bytes.push((chunk[0] << 2) | (chunk[1] >> 4));

    if (chunk[2] !== -1) {
      bytes.push(((chunk[1] & 0x0f) << 4) | (chunk[2] >> 2));
    }
    if (chunk[3] !== -1) {
      bytes.push(((chunk[2] & 0x03) << 6) | chunk[3]);
    }
  }

  return bytes;
}

/**
 * Encodes the string as a URL-safe base64 string without padding (the same
 * format as the JWT payload segment).
 *
 * @param {string} string The string to encode.
 * @returns {string}
 */
export function stringToBase64Url(string: string): string {
  return bytesToBase64(stringToUtf8Bytes(string))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes a base64 (standard or URL-safe) string back into a string.
 * Returns `null` when the input is not valid base64.
 *
 * @param {string} base64 The base64 string to decode.
 * @returns {string|null}
 */
export function base64ToString(base64: string): string | null {
  const bytes = base64ToBytes(base64);

  return bytes === null ? null : utf8BytesToString(bytes);
}

/**
 * Parses a date in the "YYYY-MM-DD" format into the epoch milliseconds of its
 * UTC midnight. Returns `null` when the date is malformed or does not exist in
 * the calendar (for example "2027-02-30"). Unlike the generator side, the
 * reader never throws on a bad date - a broken payload simply makes the key
 * unreadable.
 *
 * @param {string} isoDate The date to parse.
 * @returns {number|null}
 */
export function parseIsoDateToTimestamp(isoDate: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(`${isoDate}`);

  if (match === null) {
    return null;
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);

  // Date.UTC maps years 0-99 to 1900-1999, which would make the round-trip
  // check below report a "not a valid calendar date" lie.
  if (year < 100) {
    return null;
  }

  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);

  // An impossible date (e.g. "2027-02-30") makes `Date.UTC` roll over to
  // the next month, so a round-trip comparison catches it.
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return timestamp;
}
