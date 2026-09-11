/**
 * Scrub secrets out of text before it reaches a log line or the step summary.
 *
 * Two kinds of secret can reach a logged string here:
 *
 * - The workflow points the push remote at
 *   `https://x-access-token:<token>@github.com/...` so the script can push with
 *   the GitHub App token. A failed `git push` (a lease mismatch, a rejected
 *   ref, a network error) echoes that tokenized remote URL to stderr, and
 *   `execFileSync` folds stderr into the thrown error's `message`.
 * - A LiteLLM error body can quote the request that failed, including its
 *   `Authorization: Bearer <key>` header, or name the key in its own prose.
 *   The classifier surfaces that body verbatim (see `llm.mjs`), so the
 *   `LITELLM_API_KEY` must be redacted too -- especially now the body is cut at
 *   4096 characters rather than 200.
 *
 * Any code path that logs a caught error's message -- including the script's
 * own top-level catch -- must scrub it first, or the secret ends up in the
 * run's public step summary.
 */

/**
 * Redact the tokenized GitHub remote URL, any `Bearer` credential, and every
 * literal secret passed in.
 *
 * @param {string} text
 * @param {string[]} [secrets] Literal secret values to redact wherever they
 *   appear, such as `[process.env.LITELLM_API_KEY]`. Empty and undefined
 *   entries are ignored.
 * @returns {string}
 */
export function scrubSecrets(text, secrets = []) {
  let scrubbed = String(text)
    .replace(/x-access-token:[^@]*@/g, 'x-access-token:***@')
    // Stop the token at whitespace or a quote so a `"Bearer <key>"` echoed
    // inside a JSON error body is redacted without swallowing the closing quote
    // and braces that follow it.
    .replace(/Bearer\s+[^\s"']+/g, 'Bearer ***');

  for (const secret of secrets) {
    if (secret) {
      scrubbed = scrubbed.split(secret).join('***');
    }
  }

  return scrubbed;
}
