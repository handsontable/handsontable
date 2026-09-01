/**
 * Turns the visual comparison into a pass/fail verdict and a pull request comment.
 *
 * `reg-suit run` exits 0 whatever it finds — it rejects only on notifier and
 * credential errors — so this script is what actually turns the check red.
 *
 * All branching lives in `../lib/visual-gate.mjs`, which is pure and unit-tested;
 * this wrapper only reads `.reg/out.json`, writes `.reg/comment.md`, and sets the
 * exit code. The comment is always written so the sticky comment in `visual.yml`
 * is refreshed rather than left showing a verdict that no longer holds.
 *
 * Usage: node visual-tests/scripts/visual-gate.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { evaluate } from '../lib/visual-gate.mjs';

const WORKING_DIR = join(import.meta.dirname, '..', '.reg');
const domain = process.env.VISUAL_REPORT_DOMAIN;
const actualKey = process.env.REG_ACTUAL_KEY;

let report = null;

try {
  report = JSON.parse(await readFile(join(WORKING_DIR, 'out.json'), 'utf-8'));
} catch (error) {
  // Absent on the bootstrap path, where there is nothing to compare against.
  console.log(`No comparison result read: ${error.message}`);
}

// A fork run publishes nothing, so linking `pr-<n>/<sha>/index.html` would send
// the one audience with no PR comment to a 404. Falling back to the artifact
// wording is the point of that branch in the evaluator.
const published = process.env.VISUAL_PUBLISHED !== 'false';

const verdict = evaluate({
  report,
  bootstrap: process.env.VISUAL_BOOTSTRAP === 'true',
  seeded: process.env.VISUAL_SEEDED !== 'false',
  approved: process.env.VISUAL_APPROVED === 'true',
  reportUrl: published && domain && actualKey ? `https://${domain}/${actualKey}/index.html` : '',
  runUrl: process.env.VISUAL_RUN_URL ?? '',
});

await mkdir(WORKING_DIR, { recursive: true });
await writeFile(join(WORKING_DIR, 'comment.md'), verdict.comment, 'utf-8');

if (verdict.blocked) {
  console.error(verdict.summary);

  // Only offer remedies that apply. When no report was produced there is
  // nothing to review and nothing to approve — the comparison itself failed.
  if (report) {
    console.error('');
    console.error('Open the report linked in the pull request comment, or download the');
    console.error('`visual-diff-report` artifact from this run. Then either:');
    console.error('  - push a commit that removes the differences, or');
    console.error('  - add the `visual-approved` label to accept them as the new baseline.');
  } else {
    console.error('');
    console.error('This is a comparison failure, not a visual difference. Check the');
    console.error('`Compare against the golden records` step above for the cause.');
  }

  process.exitCode = 1;
} else {
  console.log(verdict.summary);
}
