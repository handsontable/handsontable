/**
 * What the three posters of an accessibility check run (`scripts/a11y-check-run.mjs`,
 * `scripts/a11y-evidence-report.mjs`, `scripts/screenreader-report.mjs`) read from the run before they build
 * a verdict (`lib/a11y-verdict.mjs`): the counting scope from the event that started the run, the tracker
 * lookup from the cluster catalog (`tests/a11y/issues.json`), and the run's id to stamp on the check run.
 *
 * The one place here that reads a file. A catalog that does not load leaves every finding at its severity
 * (nothing is tracked) and says so in a note, so a broken catalog can make a change run red and never green.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ISSUES_FILE, compileIssuesCatalog, trackedBy } from './a11y-issues.mjs';
import { countingScope } from './a11y-verdict.mjs';

/**
 * The verdict inputs of a run.
 *
 * @param {object} input The input.
 * @param {Record<string, string|undefined>} input.env The environment: `GITHUB_EVENT_NAME` (in a reusable workflow,
 * the caller's event) and `GITHUB_RUN_ID`.
 * @param {string} input.testsRoot The `tests/` folder.
 * @returns {{scope: 'audit'|'change', tracked: (source: string, check: string, item: object) => boolean, externalId: string|undefined, notes: string[]}} The inputs.
 */
export function verdictInputs({ env, testsRoot }) {
  const notes = [];
  let catalog = null;

  try {
    catalog = compileIssuesCatalog(JSON.parse(readFileSync(path.join(testsRoot, ISSUES_FILE), 'utf8')));
  } catch (error) {
    notes.push(`tests/${ISSUES_FILE} did not load, so no finding is read as tracked: ${error instanceof Error ? error.message : String(error)}`);
  }

  return { scope: countingScope(env.GITHUB_EVENT_NAME), tracked: trackedBy(catalog), externalId: env.GITHUB_RUN_ID || undefined, notes };
}
