/**
 * Credentials in a dependency spec or a URL. A project can write `git+https://user:TOKEN@host/repo.git` in a
 * `package.json`, and the report is meant to be read, pasted into a ticket, or committed, so the user information of a
 * URL never reaches a message, a note, a report file, or a line on stderr.
 *
 * @module lib/redact
 */

/**
 * The user information of a URL: everything between `//` and the last `@` of the authority. The authority ends at
 * the first `/`, `?`, `#`, white space, or quote, so the path of a CDN address (`//cdn.example.com/npm/@scope/pkg`)
 * is never matched. npm and git split at the last `@`, so a password that holds one (`user:p@ssword@host`) is hidden
 * whole.
 */
const USERINFO = /\/\/[^/?#\s"'`]*@/g;

/**
 * Replace the user information of every URL in a text with `***`.
 *
 * @param {string} text A message, a spec, or a URL.
 * @returns {string} The text with `//user:TOKEN@` turned into `//***@`.
 */
export function redact(text) {
  return typeof text === 'string' ? text.replace(USERINFO, '//***@') : text;
}
