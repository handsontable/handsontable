import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// The workflow half of G5 (visual-tests/AGENTS.md, Guardrails): the Compare job leaves a record for the
// flake ledger on every run, and names the quarantine the verdict, the nightly report and the record apply.
// Both are the kind of wiring that erodes silently — a record step moved behind the verdict disappears on
// exactly the runs that failed, and a quarantine read by default reaches the docs gate that shares
// visual-gate.mjs. Text-based, like fork-guards.test.mjs: no YAML parser is a dependency of the repo root.

const root = repoRoot();
const read = rel => readFileSync(path.join(root, rel), 'utf8');
const visual = read('.github/workflows/visual.yml');

/**
 * One step's block, from its `- name:` to the next step, or `null` when there is no such step.
 *
 * @param {string} workflow The workflow source.
 * @param {string} name The step's name.
 * @returns {{index: number, body: string} | null} Where the step starts and its text.
 */
function stepOf(workflow, name) {
  const start = workflow.indexOf(`      - name: ${name}\n`);

  if (start === -1) {
    return null;
  }

  const next = workflow.indexOf('\n      - ', start + 1);

  return { index: start, body: workflow.slice(start, next === -1 ? undefined : next) };
}

test('the Compare job writes and uploads its record right after both comparisons, before anything reads them', () => {
  const credentialed = stepOf(visual, 'Compare against the golden records');
  const credentialFree = stepOf(visual, 'Compare against the golden records (no credentials)');
  const write = stepOf(visual, 'Write the visual compare record');
  const upload = stepOf(visual, 'Upload the visual compare record');
  const report = stepOf(visual, 'Report this build\'s differences');
  const verdict = stepOf(visual, 'Visual verdict');

  [['compare', credentialed], ['fork compare', credentialFree], ['write', write], ['upload', upload],
    ['report', report], ['verdict', verdict]].forEach(([name, step]) => {
    assert.ok(step, `visual.yml lost its ${name} step`);
  });

  // After BOTH comparison paths, so a fork's comparison leaves a record too; before the report and the
  // verdict, so the record is taken when the comparison ends and never carries what they decide.
  assert.ok(credentialed.index < write.index && credentialFree.index < write.index);
  assert.ok(write.index < upload.index && upload.index < report.index && upload.index < verdict.index);
});

test('the record steps run whenever something was compared, even after a failure', () => {
  // `!cancelled()`: a comparison that failed is exactly the run whose evidence the ledger wants, and the
  // implicit success() would skip these steps there. Skipped only when the whole comparison is.
  const guard = /\n {8}if: \$\{\{ !cancelled\(\) && env\.VISUAL_SKIP != 'true' \}\}\n/;

  ['Write the visual compare record', 'Upload the visual compare record'].forEach((name) => {
    assert.match(stepOf(visual, name).body, guard, name);
  });

  const write = stepOf(visual, 'Write the visual compare record').body;

  assert.match(write, /^ {8}run: node \.\/visual-tests\/scripts\/compare-record\.mjs$/m);
  // A pull request's own head commit, passed through env like every other context value here.
  assert.match(write, /HEAD_SHA: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/);
  assert.ok(existsSync(path.join(root, 'visual-tests/scripts/compare-record.mjs')));
});

test('the record upload is overwritable, short-lived, and never fails the job on a missing file', () => {
  const upload = stepOf(visual, 'Upload the visual compare record').body;

  // Pinned to a commit, with the release it came from beside it.
  assert.match(upload, /uses: actions\/upload-artifact@[0-9a-f]{40} # https:\/\/github\.com\//);
  assert.match(upload, /upload-artifact\/releases\/tag\/v\d/);
  assert.match(upload, /^ {10}path: visual-tests\/\.reg\/visual-compare-\*\.json$/m);
  // "Re-run failed jobs" re-uploads under the name the first attempt published.
  assert.match(upload, /^ {10}overwrite: true$/m);
  // Three days, matching what the ledger's `workflow_dispatch` backfill can still reach.
  assert.match(upload, /^ {10}retention-days: 3$/m);
  // The script never fails the job; a record it could not write must not fail the upload either.
  assert.match(upload, /^ {10}if-no-files-found: ignore$/m);
});

test('the quarantine is named once for the core suite, and the file it names exists', () => {
  const [, envBlock = ''] = visual.split(/^env:\n/m);
  const workflowEnv = envBlock.split(/^\S/m)[0];

  assert.match(workflowEnv, /^ {2}VISUAL_QUARANTINE_FILE: visual-tests\/visual-quarantine\.json$/m);
  assert.ok(existsSync(path.join(root, 'visual-tests/visual-quarantine.json')));
  assert.equal((visual.match(/VISUAL_QUARANTINE_FILE:/g) ?? []).length, 1, 'one place names the file');
});

test('the docs suite never reads the core quarantine', () => {
  // visual-gate.mjs serves the docs suite too, and reads the quarantine only when the variable is set. The
  // docs action must therefore never set it, and must not run inside visual.yml, whose env does.
  const action = read('.github/actions/docs-visual-run/action.yml');

  assert.doesNotMatch(action, /VISUAL_QUARANTINE_FILE/);
  assert.doesNotMatch(visual, /docs-visual-run/);

  const gate = read('visual-tests/scripts/visual-gate.mjs');
  const helper = read('visual-tests/scripts/utils/quarantine.mjs');

  assert.match(gate, /readQuarantineEntries\(process\.env\.VISUAL_QUARANTINE_FILE\)/);
  // No fallback path: unset means no quarantine.
  assert.match(helper, /if \(!path\) \{\n\s+return \[\];\n\s+\}/);
  assert.doesNotMatch(gate + helper, /visual-quarantine\.json['"`]/, 'no script may default to the core file');
});
