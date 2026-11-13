/**
 * Credentials in a dependency spec or a URL. A project can write `git+https://user:TOKEN@host/repo.git` in a
 * `package.json`, and the report is meant to be read, pasted into a ticket, or committed, so the user information of a
 * URL never reaches a message, a note, a report file, or a line on stderr.
 *
 * @module lib/redact
 */

/**
 * The user information of a URL: everything between `//` and the `@` that ends it, without a slash, a space, or a
 * quote inside, so the path of a CDN address (`//cdn.example.com/npm/@scope/pkg`) is never matched.
 */
const USERINFO = /\/\/[^/\s@"'`]+@/g;

/**
 * Replace the user information of every URL in a text with `***`.
 *
 * @param {string} text A message, a spec, or a URL.
 * @returns {string} The text with `//user:TOKEN@` turned into `//***@`.
 */
export function redact(text) {
  return typeof text === 'string' ? text.replace(USERINFO, '//***@') : text;
}
