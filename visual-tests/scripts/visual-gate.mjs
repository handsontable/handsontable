/**
 * Turns the visual comparison into a pass/fail verdict and a pull request comment.
 *
 * `reg-suit run` exits 0 whatever it finds — it rejects only on notifier and
 * credential errors — so this script is what turns the check red when the
 * comparison itself failed, and what hands a `changed` verdict to the
 * environment-protected approval job when it did not.
 *
 * All branching lives in `../lib/visual-gate.mjs`, which is pure and unit-tested;
 * this wrapper only reads `out.json`, writes `comment.md` beside it, and sets the
 * exit code. The comment is always written so the sticky comment in `visual.yml`
 * is refreshed rather than left showing a verdict that no longer holds.
 *
 * The docs suite runs it too (DEV-2860, `.github/actions/docs-visual-run`), over a manifest
 * `docs/tests/lib/visual-manifest.mjs` builds from Playwright's report. Everything that differs
 * between the two suites is an environment variable, so neither carries a copy of this logic:
 *
 *   VISUAL_GATE_DIR           where `out.json` is and `comment.md` goes (default: reg-suit's `.reg/`)
 *   VISUAL_GATE_TITLE         the comment's heading (default: "Visual tests")
 *   VISUAL_GATE_ENVIRONMENT   the environment the approval waits on (default: "visual-approval")
 *   VISUAL_GATE_ARTIFACT      the artifact holding the images (default: "visual-diff-report")
 *   VISUAL_GATE_REPORT_PATH   the report's path under the actual key (default: "index.html")
 *
 * Usage: node visual-tests/scripts/visual-gate.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { evaluate } from '../lib/visual-gate.mjs';

const WORKING_DIR = process.env.VISUAL_GATE_DIR
  ? resolve(process.env.VISUAL_GATE_DIR)
  : join(import.meta.dirname, '..', '.reg');
const labels = {
  ...(process.env.VISUAL_GATE_TITLE ? { title: process.env.VISUAL_GATE_TITLE } : {}),
  ...(process.env.VISUAL_GATE_ENVIRONMENT ? { environment: process.env.VISUAL_GATE_ENVIRONMENT } : {}),
  ...(process.env.VISUAL_GATE_ARTIFACT ? { artifact: process.env.VISUAL_GATE_ARTIFACT } : {}),
};
const reportPath = process.env.VISUAL_GATE_REPORT_PATH || 'index.html';
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

const runUrl = process.env.VISUAL_RUN_URL ?? '';
const reportUrl = published && domain && actualKey ? `https://${domain}/${actualKey}/${reportPath}` : '';

const verdict = evaluate({
  report,
  bootstrap: process.env.VISUAL_BOOTSTRAP === 'true',
  seeded: process.env.VISUAL_SEEDED !== 'false',
  reportUrl,
  runUrl,
  labels,
});

await mkdir(WORKING_DIR, { recursive: true });
await writeFile(join(WORKING_DIR, 'comment.md'), verdict.comment, 'utf-8');

// The workflow reads the verdict to decide whether the environment-protected
// approval job runs, and gives that job's deployment the report URL so the
// reviewer's "View deployment" button opens the diff. The run URL stands in
// when nothing was published (a fork run).
if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, [
    `verdict=${verdict.verdict}`,
    `report-url=${reportUrl || runUrl}`,
    '',
  ].join('\n'), { flag: 'a' });
}

if (verdict.blocked) {
  console.error(verdict.summary);
  console.error('');
  console.error('This is a comparison failure, not a visual difference. Check the');
  console.error('`Compare against the golden records` step above for the cause.');

  process.exitCode = 1;
} else {
  console.log(verdict.summary);

  if (verdict.verdict === 'changed') {
    const { environment = 'visual-approval', artifact = 'visual-diff-report' } = labels;

    console.log('');
    console.log(`Open the report linked in the pull request comment (or the \`${artifact}\``);
    console.log('artifact). A regression: push a fix. Intentional: a reviewer approves the pending');
    console.log(`\`${environment}\` deployment on this run's page — one click, nothing re-run.`);
  }
}
