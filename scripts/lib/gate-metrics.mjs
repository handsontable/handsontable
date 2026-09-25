/**
 * Gate metrics — pure analysis of merged PRs against the enforcement gates.
 *
 * Feeds the DEV-2059 warn→block decision with data: per-PR presence-gate
 * verdicts (recomputed from the merged file set, not scraped from logs),
 * implementation:test line ratios, and escape-hatch usage (`Refactor-only:`
 * trailers, `[skip changelog]` markers). No network access lives here; the CLI
 * wrapper (../gate-metrics.mjs) feeds it GitHub API data.
 */

import { evaluate, isSource, isCoverage } from '../../.github/scripts/lib/presence-gate.mjs';

/**
 * GitHub "list PR files" status words → git name-status letters, which the
 * presence-gate classifier expects.
 */
const STATUS_LETTER = {
  added: 'A',
  modified: 'M',
  removed: 'D',
  renamed: 'R',
  copied: 'C',
  changed: 'M',
};

/**
 * Analyze one merged PR.
 *
 * @param {object} pr The PR's raw data.
 * @param {number} pr.number PR number.
 * @param {string} pr.title PR title.
 * @param {string} pr.body PR description.
 * @param {{status: string, filename: string, additions: number}[]} pr.files
 *   Changed files from the "list PR files" API.
 * @param {string[]} pr.commitMessages Full commit messages of the PR.
 * @returns {object} The per-PR metrics row.
 */
export function analyzePr({ number, title, body, files, commitMessages }) {
  const changes = files
    .filter(f => f.status !== 'unchanged')
    .map(f => ({ status: STATUS_LETTER[f.status] ?? 'M', path: f.filename, additions: f.additions ?? 0 }));

  const trailerLines = commitMessages.flatMap(m => String(m).split('\n'));
  const verdict = evaluate(changes.map(({ status, path }) => ({ status, path })), trailerLines);

  const sourceAdded = changes.filter(isSource).reduce((sum, c) => sum + c.additions, 0);
  const testAdded = changes.filter(isCoverage).reduce((sum, c) => sum + c.additions, 0);

  return {
    number,
    title,
    sourceFiles: verdict.sourceFiles.length,
    sourceAdded,
    testAdded,
    ratio: sourceAdded > 0 ? testAdded / sourceAdded : null,
    verdict: verdict.reason,
    pass: verdict.pass,
    refactorTrailer: verdict.reason === 'refactor-declared',
    changelogEntry: changes.some(c => c.status === 'A'
      && c.path.startsWith('.changelogs/') && c.path.endsWith('.json')),
    changelogSkipped: /\[skip changelog\]/.test(body || ''),
  };
}

/**
 * The median of a numeric list.
 *
 * @param {number[]} values The values.
 * @returns {number|null} The median, or null for an empty list.
 */
export function median(values) {
  if (values.length === 0) {
    return null;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Aggregate per-PR rows into the report summary.
 *
 * @param {object[]} rows Rows from analyzePr.
 * @returns {object} Aggregate metrics.
 */
export function summarize(rows) {
  const sourcePrs = rows.filter(r => r.sourceFiles > 0);
  const byVerdict = {};

  for (const r of rows) {
    byVerdict[r.verdict] = (byVerdict[r.verdict] ?? 0) + 1;
  }

  return {
    totalPrs: rows.length,
    sourcePrs: sourcePrs.length,
    byVerdict,
    wouldBlock: rows.filter(r => !r.pass),
    refactorTrailers: rows.filter(r => r.refactorTrailer).length,
    changelogSkips: rows.filter(r => r.changelogSkipped).length,
    medianRatio: median(sourcePrs.filter(r => r.ratio !== null).map(r => r.ratio)),
  };
}
