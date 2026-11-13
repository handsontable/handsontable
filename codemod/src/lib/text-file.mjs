import { readFile } from 'node:fs/promises';

/**
 * Raised when a file is not valid UTF-8. A tool that reads such a file as text and writes it back replaces every
 * byte it cannot decode with U+FFFD, so the file is left alone instead.
 */
export class NotUtf8Error extends Error {
  /**
   * @param {string} [message] What happened.
   */
  constructor(message = 'The file is not valid UTF-8.') {
    super(message);
    this.name = 'NotUtf8Error';
  }
}

/**
 * Decode bytes as UTF-8, strictly. A leading byte order mark stays in the text as U+FEFF, so a transform that cares
 * about it (a stylesheet, a `package.json`) sees the same text the file holds and writes it back.
 *
 * @param {Uint8Array} bytes The file content.
 * @returns {string} The text.
 * @throws {NotUtf8Error} When a byte sequence is not valid UTF-8.
 */
export function decodeUtf8(bytes) {
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch {
    throw new NotUtf8Error();
  }
}

/**
 * The text without a leading byte order mark. `JSON.parse` rejects the mark, npm accepts it.
 *
 * @param {string} text Decoded file text.
 * @returns {string} The text after the mark, or the text itself when it has none.
 */
export function stripBom(text) {
  return text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
}

/**
 * Read a file as strict UTF-8 text.
 *
 * @param {string} path File path.
 * @returns {Promise<string>} The text, with a leading byte order mark kept.
 * @throws {NotUtf8Error} When the file is not valid UTF-8.
 */
export async function readUtf8(path) {
  return decodeUtf8(await readFile(path));
}
