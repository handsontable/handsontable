/**
 * Fails the build when the visual comparison found differences that nobody has
 * approved.
 *
 * `reg-suit run` exits 0 whatever it finds — it rejects only on notifier and
 * credential errors — so this script is what actually turns the check red.
 * Approval is all-or-nothing: adding the `visual-approved` label to the pull
 * request skips this step entirely (see `.github/workflows/visual.yml`).
 *
 * Usage: node visual-tests/scripts/visual-gate.mjs
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

const REPORT_PATH = join(import.meta.dirname, '..', '.reg', 'out.json');

let report;

try {
  report = JSON.parse(await readFile(REPORT_PATH, 'utf-8'));
} catch (error) {
  console.error(`Could not read the comparison result at ${REPORT_PATH}.`);
  console.error('The comparison step produced no report, so the visual state is unknown.');
  console.error(error.message);
  process.exitCode = 1;
}

if (report) {
  const changed = report.failedItems.length;
  const added = report.newItems.length;
  const deleted = report.deletedItems.length;
  const total = changed + added + deleted;

  if (total === 0) {
    console.log(`No visual changes. ${report.passedItems.length} screenshots match the golden records.`);
  } else {
    console.error(`Visual changes detected: ${changed} changed, ${added} new, ${deleted} deleted.`);
    console.error('');
    console.error('Open the report linked in the pull request comment, or download the');
    console.error('`visual-diff-report` artifact from this run. Then either:');
    console.error('  - push a commit that removes the differences, or');
    console.error('  - add the `visual-approved` label to accept them as the new baseline.');
    process.exitCode = 1;
  }
}
