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
 * A credential in the query or the fragment of a URL: `?token=VALUE`, `&access_token=VALUE`, `#key=VALUE`. The name
 * is matched whole, case-insensitively, right after `?`, `&`, or `#`, so `?monkey=1` and `?tokens=1` stay. The value
 * ends at `&`, `#`, white space, or a quote.
 */
const SECRET_PARAMETER = new RegExp('([?&#](?:(?:access_|refresh_|id_|auth_|private_)?token|api[_-]?key|key'
  + '|(?:client_)?secret|pass(?:word|wd)|pwd|auth(?:orization)?|sig(?:nature)?'
  + '|x-amz-(?:signature|security-token|credential))=)[^&#\\s"\'`]+', 'gi');

/**
 * Replace the credentials of every URL in a text with `***`: the user information (`//user:TOKEN@`), and the value of
 * a query or fragment parameter named like a secret (`?token=TOKEN`). The name of the parameter stays.
 *
 * @param {string} text A message, a spec, or a URL.
 * @returns {string} The text with `//user:TOKEN@` turned into `//***@` and `?token=TOKEN` into `?token=***`.
 */
export function redact(text) {
  return typeof text === 'string' ? text.replace(USERINFO, '//***@').replace(SECRET_PARAMETER, '$1***') : text;
}
