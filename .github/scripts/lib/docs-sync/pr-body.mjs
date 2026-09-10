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
 * @param {string} text
 * @param {number} [max] Character cap; the excess is replaced with `…`.
 * @returns {string}
 */
function plain(text, max = 200) {
  const collapsed = String(text ?? '')
    .replaceAll('<!--', '<!-')
    .replaceAll('-->', '->')
    .replace(/\r\n|\r|\n/g, ' ');

  return collapsed.length > max ? `${collapsed.slice(0, max)}…` : collapsed;
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
    'Documentation content merged to `develop` that applies to the released version, ported by the daily docs sync. Review the sections below; the classifier\'s reasons are listed so a wrong call can be corrected by relabelling the source pull request (`docs-sync: include` / `docs-sync: skip`).',
    section('Included', report.included, (i) => `${ref(i)} (#${i.prNumber}, @${i.author})`),
    section('Skipped: conflict', report.conflicts, (i) => `${ref(i)} (#${i.prNumber}): ${i.files.map((f) => `\`${f}\``).join(', ')}`),
    section('Skipped: needs a human decision', report.unsure, (i) => `${ref(i)} (#${i.prNumber}): ${plain(i.reason)}`),
    section('Excluded by the classifier', report.excluded, (i) => `${ref(i)} (#${i.prNumber}): ${plain(i.reason)}`),
    section('Skipped: mixed content and other changes', report.mixed, (i) => `${ref(i)} (#${i.prNumber}): touches ${i.categories.join(', ')}`),
    section('Skipped: version-scoped pages', report.versionScoped, (i) => `${ref(i)} (#${i.prNumber}): ${i.files.map((f) => `\`${f}\``).join(', ')}`),
    section('Skipped: already on prod', report.alreadyOnProd, (i) => `${ref(i)} (#${i.prNumber})`),
    section('Skipped: no pull request number', report.noPrNumber, (i) => ref(i)),
    [
      '## Run metadata',
      '',
      `- Source: develop@\`${report.developSha.slice(0, 7)}\``,
      `- Target: ${report.target}@\`${report.targetSha.slice(0, 7)}\` (released ${report.releasedVersion})`,
      `- Prompt: ${report.promptHash}`,
      `- Generated: ${report.generatedAt}`,
    ].join('\n'),
    '[skip changelog]',
    `<!-- ${STATE_MARKER}\n${JSON.stringify(report.state)}\n-->`,
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
