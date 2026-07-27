/**
 * Changelog gate — pure decision logic.
 *
 * A PR must add a `.changelogs/*.json` entry when it changes shippable source:
 * anything under `handsontable/src/**` or `wrappers/**` that is not a test
 * file, a test directory, or markdown. Documentation-, test-, and CI/tooling-
 * only PRs pass automatically. `[skip changelog]` in the PR description —
 * outside HTML comments — overrides the requirement on a source change; the
 * override is surfaced together with the files it waves through so a reviewer
 * can judge it.
 *
 * No network or filesystem access lives here so the logic is unit-testable;
 * the CLI wrapper (`../check-changelog.js`) feeds it the live PR body and the
 * changed-file list from the GitHub API.
 */

import { classify } from './presence-gate.mjs';

/**
 * The opt-out marker recognized in a PR description.
 */
export const SKIP_MARKER = '[skip changelog]';

/**
 * Trees whose changes ship in the npm packages and therefore warrant a
 * changelog entry. Deliberately broader than the presence gate's SOURCE set
 * (which targets testable code files): styling/theme files under
 * `handsontable/src` and wrapper manifests are user-facing too.
 */
const CHANGELOG_TREES = [
  /^handsontable\/src\//,
  /^wrappers\//,
];

/**
 * Never changelog-relevant, even inside the trees above: markdown, and the
 * test-tree directory markers (mirrors the presence gate's NOT_SOURCE
 * exclusions — helpers in test dirs classify as 'neither', not 'test').
 */
const EXCLUDED = [
  /\.md$/i,
  /\/__tests__\//,
  /\/test\//,
  /\/test-helpers\//,
  /\/spec\//,
];

/**
 * Does a change to this path warrant a changelog entry?
 *
 * @param {string} path Repo-relative path.
 * @returns {boolean} True for shippable source under the changelog trees.
 */
export function requiresChangelog(path) {
  return CHANGELOG_TREES.some(r => r.test(path))
    && !EXCLUDED.some(r => r.test(path))
    && classify(path) !== 'test';
}

/**
 * Strip HTML comments, so a commented mention of the skip marker (e.g. the PR
 * template documenting it) can never activate the opt-out.
 *
 * Stripping repeats until a fixed point: a single pass can reassemble a new
 * `<!-- ... -->` from the text around a removed match (CodeQL
 * js/incomplete-multi-character-sanitization). Any unterminated trailing
 * `<!--` is dropped too, mirroring how renderers hide comment-to-EOF. Both
 * choices bias the gate toward NOT recognizing an ambiguous marker — the safe
 * failure mode is demanding an entry, never silently skipping.
 *
 * @param {string} body The PR description.
 * @returns {string} The description without `<!-- ... -->` blocks.
 */
export function stripHtmlComments(body) {
  let stripped = body;
  let previous;

  do {
    previous = stripped;
    stripped = previous.replace(/<!--[\s\S]*?-->/g, '');
  } while (stripped !== previous);

  return stripped.replace(/<!--[\s\S]*$/, '');
}

/**
 * Evaluate the gate for a PR.
 *
 * @param {object} pr The gate's inputs.
 * @param {string} pr.body The PR description (live, not the frozen payload).
 * @param {{status: string, filename: string}[]} pr.files The PR's changed
 *   files, as returned by the GitHub "list pull request files" API.
 * @returns {{pass: boolean, reason: string, sourceFiles: string[]}} The
 *   verdict; `reason` is one of 'entry-added', 'no-source-change',
 *   'skipped-explicitly', or 'missing-entry'.
 */
export function evaluateChangelogGate({ body, files }) {
  const hasEntry = files.some(f => f.status === 'added'
    && f.filename.startsWith('.changelogs/')
    && f.filename.endsWith('.json'));
  const sourceFiles = files.map(f => f.filename).filter(requiresChangelog);
  const skipped = stripHtmlComments(body || '').includes(SKIP_MARKER);

  if (hasEntry) {
    return { pass: true, reason: 'entry-added', sourceFiles };
  }
  if (sourceFiles.length === 0) {
    return { pass: true, reason: 'no-source-change', sourceFiles };
  }
  if (skipped) {
    return { pass: true, reason: 'skipped-explicitly', sourceFiles };
  }

  return { pass: false, reason: 'missing-entry', sourceFiles };
}
