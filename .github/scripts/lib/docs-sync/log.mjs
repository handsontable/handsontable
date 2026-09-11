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
 *   The classifier surfaces that body verbatim and in full (see `llm.mjs`), so
 *   the `LITELLM_API_KEY` must be redacted too.
 *
 * Any code path that logs a caught error's message -- including the script's
 * own top-level catch -- must scrub it first, or the secret ends up in the
 * run's public step summary.
 */

// The GitHub step summary has a size limit and, unlike a job log, is rendered
// markdown, so one huge failure body (a Cloudflare block page, say) must not run
// away in it. `capForSummary` bounds the summary copy; the job log keeps the
// full string.
const MAX_SUMMARY_CHARS = 16_384;

// A literal secret shorter than this is not redacted: every real credential
// here (a GitHub App token, a LiteLLM key, the proxy URL) is far longer, and
// redacting a one- or two-character value would replace that substring
// everywhere in the log and shred otherwise-legible output.
const MIN_SECRET_CHARS = 8;

/**
 * Redact the tokenized GitHub remote URL, any `Bearer` credential, and every
 * literal secret passed in.
 *
 * @param {string} text
 * @param {string[]} [secrets] Literal secret values to redact wherever they
 *   appear, such as `[process.env.LITELLM_API_KEY]`. Empty, undefined, and
 *   pathologically short (< 8 characters) entries are ignored.
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
    if (secret && secret.length >= MIN_SECRET_CHARS) {
      scrubbed = scrubbed.split(secret).join('***');
    }
  }

  return scrubbed;
}

/**
 * Bound a string for the step summary, pointing the reader at the full job log
 * when it had to cut. The job log is written uncapped, so nothing is lost.
 *
 * @param {string} text
 * @param {number} [max]
 * @returns {string}
 */
export function capForSummary(text, max = MAX_SUMMARY_CHARS) {
  const string = String(text);

  if (string.length <= max) {
    return string;
  }

  return `${string.slice(0, max)}\n[truncated: ${string.length - max} more characters; see the full job log]`;
}
