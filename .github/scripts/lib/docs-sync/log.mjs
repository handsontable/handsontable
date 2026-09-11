/**
 * Scrub secrets out of text before it reaches a log line or the step summary.
 *
 * The workflow points the push remote at
 * `https://x-access-token:<token>@github.com/...` so the script can push with
 * the GitHub App token. A failed `git push` (a lease mismatch, a rejected
 * ref, a network error) echoes that tokenized remote URL to stderr, and
 * `execFileSync` folds stderr into the thrown error's `message`. Any code
 * path that logs a caught error's message -- including the script's own
 * top-level catch -- must scrub it first, or the token ends up in the run's
 * public step summary.
 */

/**
 * Replace the token in a tokenized GitHub remote URL with a placeholder.
 *
 * @param {string} text
 * @returns {string}
 */
export function scrubSecrets(text) {
  return String(text).replace(/x-access-token:[^@]*@/g, 'x-access-token:***@');
}
