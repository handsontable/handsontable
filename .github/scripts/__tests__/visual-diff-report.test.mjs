import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The workflow half of the `visual-diff-report` artifact. The step uploaded `visual-tests/.reg` for as long as
// upload-artifact has skipped hidden paths by default, so it matched nothing and stayed green on every run
// with differences, while the pull request comment sent reviewers to it. It now uploads a directory the
// Compare job stages first. What can erode here is the wiring between the two steps: a condition that
// drifts apart (the upload runs over nothing, or the staging runs for nothing), a path that points back into
// `.reg`, or a destination the upload does not read. What the script copies is tested in
// visual-tests/lib/__tests__/visual-diff-report.test.mjs.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const visual = read('.github/workflows/visual.yml');

/**
 * One job's block, by the two-space indent that starts each job.
 *
 * @param {string} source The workflow file's contents.
 * @param {string} id The job id.
 * @returns {string} The job's text.
 */
function job(source, id) {
  const [, jobsBlock = ''] = source.split(/^jobs:$/m);
  const blocks = jobsBlock.split(/^ {2}(?=[A-Za-z0-9_-]+:$)/m);

  return blocks.find(block => block.startsWith(`${id}:`)) ?? '';
}

/**
 * A job's steps, split on the six-space `- ` that starts each one. The comment block above a step stays with
 * the step before it, which is harmless here: no comment carries a key these tests read.
 *
 * @param {string} jobBody One job's text, from `job()`.
 * @returns {string[]} One entry per step.
 */
function steps(jobBody) {
  const [, stepsBlock = ''] = jobBody.split(/^ {4}steps:$/m);

  return stepsBlock.split(/^ {6}(?=- )/m).filter(block => block.trim());
}

/**
 * A step's folded `if:` expression, or null when the step has none.
 *
 * @param {string} step One step's text, from `steps()`.
 * @returns {string|null} The expression with its continuation lines joined.
 */
function stepIf(step) {
  const match = step.match(/^\s*(?:- )?if: (.*(?:\n\s+(?:&&|\|\||\().*)*)/m);

  return match ? match[1].replace(/\s+/g, ' ') : null;
}

const compare = steps(job(visual, 'compare'));
const at = name => compare.findIndex(step => step.startsWith(`- name: ${name}\n`));

test('the diff report is staged right before its upload, under the same condition', () => {
  const stage = at('Stage the visual diff report');
  const upload = at('Upload the visual diff report');

  assert.notEqual(stage, -1, 'the compare job lost the staging step');
  assert.notEqual(upload, -1, 'the compare job lost the upload step');
  assert.equal(upload, stage + 1, 'nothing may sit between staging the files and uploading them');
  // One condition, spelled twice. Apart, the upload either runs over a directory nothing staged or never
  // runs for one that was.
  assert.ok(stepIf(compare[stage]), 'the staging step lost its condition');
  assert.equal(stepIf(compare[stage]), stepIf(compare[upload]));
});

test('the upload reads the staged directory, never .reg, and warns when nothing was staged', () => {
  const stage = compare[at('Stage the visual diff report')];
  const upload = compare[at('Upload the visual diff report')];

  assert.match(stage,
    /^ {8}run: node \.\/visual-tests\/scripts\/stage-diff-report\.mjs "\$RUNNER_TEMP\/visual-diff-report"$/m);
  assert.match(upload, /^ {10}path: \$\{\{ runner\.temp \}\}\/visual-diff-report$/m,
    'the upload must read the directory the script stages into');
  // Back into `.reg`, the step either matches nothing again or, with `include-hidden-files`, ships the
  // tier's golden set twice on every run with differences.
  assert.doesNotMatch(upload, /\.reg/);
  assert.match(upload, /^ {10}name: visual-diff-report$/m);
  assert.match(upload, /^ {10}retention-days: 3$/m);
  // A comparison that died stages nothing: a warning next to the script's reason, never a silent miss.
  assert.match(upload, /^ {10}if-no-files-found: warn$/m);

  ['visual-tests/scripts/stage-diff-report.mjs', 'visual-tests/lib/visual-diff-report.mjs'].forEach((rel) => {
    assert.ok(existsSync(path.join(root, rel)), `${rel} is missing`);
  });
});

test('the gate sends reviewers to the artifact this step uploads', () => {
  // The comment and the console hint name the artifact by default label. Renaming the upload alone would
  // point every reviewer at an artifact that does not exist, which is the failure this change removes.
  assert.match(read('visual-tests/lib/visual-gate.mjs'), /^ {2}artifact: 'visual-diff-report',$/m);
  assert.match(read('visual-tests/scripts/visual-gate.mjs'), /artifact = 'visual-diff-report'/);
});
