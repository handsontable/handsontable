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

// The step summary has a size limit and, unlike a job log, is rendered markdown
// -- GitHub parses a raw `<!DOCTYPE html>` block page and strips the tags. So a
// failure body destined for the summary is both bounded and wrapped in a code
// fence; the job log keeps the full, unfenced string. Four backticks so a stray
// ``` inside the page cannot close the fence early.
const MAX_SUMMARY_CHARS = 16_384;
const FENCE = '````';

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
 * Bound a string for the step summary and wrap it in a code fence so GitHub
 * renders it literally instead of parsing any HTML in it. The cut notice is
 * worded distinctly (no `[truncated:` prefix) so it never collides with
 * `classify.mjs`'s prompt truncation in a log-scanning assertion. The job log
 * is written uncapped and unfenced, so nothing is lost there.
 *
 * @param {string} text
 * @param {number} [max]
 * @returns {string}
 */
export function fenceForSummary(text, max = MAX_SUMMARY_CHARS) {
  const string = String(text);
  const shown = string.length > max
    ? `${string.slice(0, max)}\n[cut for the step summary; full text in the job log]`
    : string;

  return `${FENCE}\n${shown}\n${FENCE}`;
}

// A ClickUp custom id: 2-4 uppercase letters, a hyphen, digits (DEV, SU, PRO,
// IT, ...). The trailing `(?!-)` keeps a CVE id like `CVE-2024-12345` whole
// instead of eating `CVE-2024` and leaving `-12345`.
const TASK_ID = /\b[A-Z]{2,4}-\d+\b(?!-)/g;

/**
 * Remove ClickUp task ids from text. ClickUp links any `PREFIX-1234` it finds in
 * a pull request body or a commit message to that task and moves it to "code
 * review", so the docs-sync pull request -- which lists dozens of already-merged
 * commits, both in its body and (through `cherry-pick -x`) in its commit
 * messages -- must carry none, or it drags every one of those tasks back into
 * review. Newline-safe: only runs of spaces or tabs left by a removal are
 * collapsed, so a multi-line commit message keeps its structure.
 *
 * @param {string} text
 * @returns {string}
 */
export function stripTaskIds(text) {
  return String(text ?? '')
    .replace(TASK_ID, '')
    .replace(/[ \t]{2,}/g, ' ');
}
