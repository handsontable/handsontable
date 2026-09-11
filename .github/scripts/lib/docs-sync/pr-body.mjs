/**
 * Pull request text for the docs sync.
 *
 * The body is the run's audit trail: every candidate appears in exactly one
 * section with the reason it landed there, so a reviewer can disagree with the
 * classifier from the pull request alone. The trailing HTML comment carries the
 * decision cache the next run reads back.
 */

export const STATE_MARKER = 'docs-sync-state';
export const SYNC_LABEL = 'docs-sync';
export const SKIP_LABEL = 'docs-sync: skip';
export const INCLUDE_LABEL = 'docs-sync: include';

/**
 * The pull request title for a target.
 *
 * @param {string} target
 * @returns {string}
 */
export function renderTitle(target) {
  return `Sync docs content from develop to ${target}`;
}

// Every bucket a candidate can land in, paired with its step-summary label. The
// order is picked first, then the reasons for not picking. `renderBody` renders
// the same buckets in full; this is the count-only view.
const OUTCOMES = [
  ['included', 'Included in the sync pull request'],
  ['unsure', 'Needs a human decision'],
  ['excluded', 'Excluded by the classifier'],
  ['conflicts', 'Conflict'],
  ['mixed', 'Mixed with non-content changes'],
  ['versionScoped', 'Version-scoped page'],
  ['alreadyOnProd', 'Already on prod'],
  ['noPrNumber', 'No pull request number'],
];

/**
 * A count-only summary of a run: how many commits were picked and how many were
 * not, by outcome. The full per-commit decisions and reasons stay in the job
 * log and the pull request body (`renderBody`); this is what the step summary
 * shows so it does not repeat the whole audit trail.
 *
 * @param {object} report
 * @returns {string}
 */
export function renderCounts(report) {
  const picked = report.included.length;
  const total = OUTCOMES.reduce((sum, [key]) => sum + report[key].length, 0);

  return [
    `## Docs content sync to ${report.target}`,
    `Picked **${picked}** of **${total}** commit(s) for the sync pull request. Per-commit decisions and reasons are in the job log and the pull request body.`,
    OUTCOMES.map(([key, label]) => `- ${label}: ${report[key].length}`).join('\n'),
  ].join('\n\n');
}

/**
 * One Markdown section, or `None.` when the list is empty.
 *
 * @param {string} heading
 * @param {object[]} items
 * @param {(item: object) => string} line
 * @returns {string}
 */
function section(heading, items, line) {
  const body = items.length > 0 ? items.map((item) => `- ${line(item)}`).join('\n') : 'None.';

  return `## ${heading}\n\n${body}`;
}

/**
 * Make free text safe to interpolate into the pull request body: neither a
 * commit subject nor a model-written reason is trusted content, and either
 * could otherwise inject an HTML comment that closes the real state block
 * early (or opens a forged one), or run the body on for pages with newlines.
 *
 * Escaping the single character `<` (as `&lt;`, which GitHub renders back as
 * a literal `<` in Markdown prose) is enough: no HTML comment, real or
 * forged, can open without a literal `<`, so a stray `-->` that survives
 * unescaped has nothing open to close. A multi-character replacement of
 * `<!--` or `-->` instead -- even one that loops to a fixed point -- trips
 * CodeQL's `js/incomplete-multi-character-sanitization` rule, which flags any
 * removal of a multi-character sequence on the grounds that overlapping or
 * nested occurrences can survive a single pass; escaping one character sidesteps
 * that class of finding entirely rather than trying to out-loop it.
 *
 * @param {string} text
 * @param {number} [max] Character cap; the excess is replaced with `…`.
 * @returns {string}
 */
function plain(text, max = 200) {
  const collapsed = String(text ?? '')
    .replaceAll('<', '&lt;')
    .replace(/\r\n|\r|\n/g, ' ');

  return collapsed.length > max ? `${collapsed.slice(0, max)}…` : collapsed;
}

/**
 * Escape a reason before it goes inside the state block's raw JSON payload.
 * That JSON sits inside an already-open HTML comment (`<!-- ... -->`), unlike
 * every rendered row (where `plain()`'s `<` escape is enough, since nothing
 * there is already open) -- a `-->` here needs no preceding `<!--` of its own
 * to close this comment early and spill the rest of the JSON into the
 * visible body. Escaping `>` in addition to `plain()`'s `<` keeps the literal
 * sequence `-->` from ever surviving into the payload, with two independent
 * single-character replacements, not a sequence removal.
 *
 * @param {string} text
 * @returns {string}
 */
function forState(text) {
  return plain(text).replaceAll('>', '&gt;');
}

/**
 * `\`sha\` subject` with the subject sanitized and any trailing `(#n)` it
 * already carries stripped, since every `section()` caller appends its own
 * `(#n, ...)` right after this.
 *
 * @param {{ sha: string, subject: string }} item
 * @returns {string}
 */
function ref(item) {
  const subject = plain(item.subject).replace(/\s*\(#\d+\)\s*$/, '');

  return `\`${item.sha.slice(0, 7)}\` ${subject}`;
}

/**
 * Render the full pull request body.
 *
 * @param {object} report See the plan's report shape.
 * @returns {string}
 */
export function renderBody(report) {
  const parts = [
    'Documentation content merged to `develop` that applies to the released version, ported by the daily docs sync. Review the sections below; the classifier\'s reasons are listed so a wrong call can be corrected by relabeling the source pull request (`docs-sync: include` / `docs-sync: skip`).',
    // The Included row is the only one that renders `(#N, ...)`; the trailing
    // `, @author` keeps it from ever matching `collectProdRefs`'s subject-only
    // `\(#\d+\)` scan (which reads real commit subjects, not this body,
    // anyway) and makes the row visually distinct from every other section,
    // whose rows below deliberately drop the parentheses. See candidates.mjs
    // for why: those rows name pull requests that did *not* reach prod, and a
    // squash body that ends up carrying this report must never be misread as
    // a list of already-ported pull requests.
    section('Included', report.included, (i) => `${ref(i)} (#${i.prNumber}, @${i.author})`),
    section('Skipped: conflict', report.conflicts, (i) => `${ref(i)} #${i.prNumber}: ${i.files.map((f) => `\`${f}\``).join(', ')}`),
    section('Skipped: needs a human decision', report.unsure, (i) => `${ref(i)} #${i.prNumber}: ${plain(i.reason)}`),
    section('Excluded by the classifier', report.excluded, (i) => `${ref(i)} #${i.prNumber}: ${plain(i.reason)}`),
    section('Skipped: mixed content and other changes', report.mixed, (i) => `${ref(i)} #${i.prNumber}: touches ${i.categories.join(', ')}`),
    section('Skipped: version-scoped pages', report.versionScoped, (i) => `${ref(i)} #${i.prNumber}: ${i.files.map((f) => `\`${f}\``).join(', ')}`),
    section('Skipped: already on prod', report.alreadyOnProd, (i) => `${ref(i)} #${i.prNumber}`),
    section('Skipped: no pull request number', report.noPrNumber, (i) => (i.reason ? `${ref(i)}: ${plain(i.reason)}` : ref(i))),
    [
      '## Run metadata',
      '',
      `- Source: develop@\`${report.developSha.slice(0, 7)}\``,
      `- Target: ${report.target}@\`${report.targetSha.slice(0, 7)}\` (released ${report.releasedVersion})`,
      `- Prompt: ${report.promptHash}`,
      `- Generated: ${report.generatedAt}`,
    ].join('\n'),
    '[skip changelog]',
    `<!-- ${STATE_MARKER}\n${JSON.stringify({
      ...report.state,
      decisions: Object.fromEntries(Object.entries(report.state.decisions)
        .map(([key, value]) => [key, { ...value, reason: forState(value.reason) }])),
    })}\n-->`,
  ];

  return parts.join('\n\n');
}

/**
 * Read the decision cache back out of a body written by `renderBody`.
 *
 * @param {string} body
 * @returns {object|null} The state, or null when absent or unreadable.
 */
export function extractState(body) {
  const match = new RegExp(`<!-- ${STATE_MARKER}\\n([\\s\\S]*?)\\n-->`).exec(body ?? '');

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(match[1]);
  } catch {
    // A hand-edited or truncated block is treated as no cache, never as an error.
    return null;
  }
}
