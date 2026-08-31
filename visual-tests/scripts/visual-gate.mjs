/**
 * Decides whether the visual comparison blocks the pull request, and writes the
 * comment that explains the verdict.
 *
 * `reg-suit run` exits 0 whatever it finds — it rejects only on notifier and
 * credential errors — so this script is what actually turns the check red.
 * Approval is all-or-nothing: adding the `visual-approved` label to the pull
 * request skips this step entirely (see `.github/workflows/visual.yml`).
 *
 * Always writes `.reg/comment.md`. The workflow posts it as a sticky comment, so
 * one comment is kept up to date rather than a new one appearing per push.
 *
 * Usage: node visual-tests/scripts/visual-gate.mjs
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const WORKING_DIR = join(import.meta.dirname, '..', '.reg');
const REPORT_PATH = join(WORKING_DIR, 'out.json');
const COMMENT_PATH = join(WORKING_DIR, 'comment.md');

const domain = process.env.VISUAL_REPORT_DOMAIN;
const actualKey = process.env.REG_ACTUAL_KEY;
const runUrl = process.env.VISUAL_RUN_URL;
const reportUrl = domain && actualKey ? `https://${domain}/${actualKey}/index.html` : '';

/**
 * Write the pull request comment body, creating the working directory when the
 * comparison never produced one.
 *
 * @param {string} body The markdown to post.
 */
async function writeComment(body) {
  await mkdir(WORKING_DIR, { recursive: true });
  await writeFile(COMMENT_PATH, body, 'utf-8');
}

if (process.env.VISUAL_BOOTSTRAP === 'true') {
  console.log('No golden records existed for this base branch, so this build seeds them.');
  await writeComment([
    '## Visual tests — baseline created',
    '',
    'This branch had no golden records, so this build became the baseline.',
    'There was nothing to compare against yet, and the next build of the base',
    'branch replaces it with the authoritative render.',
    '',
  ].join('\n'));
  process.exit(0);
}

let report;

try {
  report = JSON.parse(await readFile(REPORT_PATH, 'utf-8'));
} catch (error) {
  console.error(`Could not read the comparison result at ${REPORT_PATH}.`);
  console.error('The comparison step produced no report, so the visual state is unknown.');
  console.error(error.message);
  await writeComment([
    '## Visual tests — could not compare',
    '',
    'The comparison step produced no report, so the visual state is unknown.',
    runUrl ? `\n[Workflow run](${runUrl})\n` : '',
  ].join('\n'));
  process.exitCode = 1;
}

if (report) {
  const changed = report.failedItems.length;
  const added = report.newItems.length;
  const deleted = report.deletedItems.length;
  const passed = report.passedItems.length;
  const total = changed + added + deleted;

  if (total === 0) {
    console.log(`No visual changes. ${passed} screenshots match the golden records.`);
    await writeComment([
      '## Visual tests — no changes',
      '',
      `All ${passed} screenshots match the golden records.`,
      '',
    ].join('\n'));
  } else {
    const approved = process.env.VISUAL_APPROVED === 'true';

    console.error(`Visual changes detected: ${changed} changed, ${added} new, ${deleted} deleted.`);

    if (!approved) {
      console.error('');
      console.error('Open the report linked in the pull request comment, or download the');
      console.error('`visual-diff-report` artifact from this run. Then either:');
      console.error('  - push a commit that removes the differences, or');
      console.error('  - add the `visual-approved` label to accept them as the new baseline.');
    }

    await writeComment([
      '## Visual tests — changes detected',
      '',
      '| 🔴 Changed | 🟡 New | ⚪ Deleted | 🔵 Passing |',
      '| ---: | ---: | ---: | ---: |',
      `| ${changed} | ${added} | ${deleted} | ${passed} |`,
      '',
      reportUrl
        ? `**[Open the visual report](${reportUrl})** — compare each screenshot side by side, `
          + 'with slider, blend, and toggle views.'
        : 'The report URL is unavailable; download the `visual-diff-report` artifact instead.',
      '',
      'If the report is unreachable, the `visual-diff-report` artifact on the '
        + `${runUrl ? `[workflow run](${runUrl})` : 'workflow run'} holds the same thing.`,
      '',
      '### What to do next',
      '',
      '**If these differences are a regression** — push a commit that fixes them. The check',
      'goes green on its own.',
      '',
      '**If these differences are intentional** — accept them as the new baseline:',
      '',
      '1. Add the **`visual-approved`** label to this pull request.',
      '2. Re-run the **Visual / Compare** job.',
      '',
      'Approval is all-or-nothing: the label accepts every difference in this build at once,',
      'so read the report before applying it.',
      '',
      '> The label is removed automatically on every push, so an approval only ever covers',
      '> the screenshots someone actually looked at. If you push again, re-apply it.',
      '',
    ].join('\n'));

    if (approved) {
      console.log('The `visual-approved` label is present, so these differences are accepted.');
      await writeComment([
        '## Visual tests — changes approved',
        '',
        '| 🔴 Changed | 🟡 New | ⚪ Deleted | 🔵 Passing |',
        '| ---: | ---: | ---: | ---: |',
        `| ${changed} | ${added} | ${deleted} | ${passed} |`,
        '',
        'The **`visual-approved`** label accepted these differences as intentional.',
        reportUrl ? `\n[Review the report](${reportUrl}) if you want to double-check them.\n` : '',
        'The label is removed on the next push, so a later change is compared again.',
        '',
      ].join('\n'));
    } else {
      process.exitCode = 1;
    }
  }
}
