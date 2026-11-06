import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The run verdict script (`scripts/a11y-run-verdict.mjs`) on a subset dispatch: a nightly dispatched with the
// `checks` or `projects` input ran a subset, and the verdict must expect that subset, or every subset run
// ends red for the check runs it never posted. The rule itself (`runVerdict()`) is tested in
// a11y-verdict.test.mjs; this pins how the script turns its arguments into the expected names.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(TESTS_ROOT, 'scripts/a11y-run-verdict.mjs');
const RUN = '4242';
const posted = (name, conclusion, id) => ({ id, name, conclusion, external_id: RUN, html_url: `https://github.com/o/r/runs/${id}`, output: { title: `${conclusion} title` } });

/**
 * Runs the script in dry-run mode over the given check runs.
 *
 * @param {object[]} checkRuns The check runs the commit carries.
 * @param {string[]} args The script's arguments, after `--dry-run`.
 * @returns {{status: number|null, stdout: string, stderr: string}} The result.
 */
function verdict(checkRuns, args) {
  const dir = mkdtempSync(path.join(tmpdir(), 'a11y-run-verdict-'));
  const file = path.join(dir, 'check-runs.json');

  writeFileSync(file, JSON.stringify(checkRuns));

  const child = spawnSync(process.execPath, [SCRIPT, '--dry-run', file, ...args], {
    cwd: TESTS_ROOT,
    env: { ...process.env, GITHUB_RUN_ID: RUN, GITHUB_STEP_SUMMARY: '' },
    encoding: 'utf8',
    timeout: 30_000,
  });

  return { status: child.status, stdout: child.stdout, stderr: child.stderr };
}

test('--a11y-checks narrows what the A11y nightly must have posted to the named checks, beside the axe report', () => {
  const runs = [posted('A11y / axe report', 'success', 1), posted('A11y / keyboard-walker report', 'neutral', 2)];
  const subset = verdict(runs, ['--prefix', 'A11y / ', '--a11y-suite', 'nightly', '--a11y-checks', 'keyboard-walker']);

  assert.equal(subset.status, 0, subset.stdout + subset.stderr);
  assert.match(subset.stdout, /the run is neutral/, 'the subset run is judged on what it ran');

  const full = verdict(runs, ['--prefix', 'A11y / ', '--a11y-suite', 'nightly']);

  assert.equal(full.status, 1, 'without the subset, the suite is expected and six checks are missing');
  assert.match(full.stdout, /tree-snapshots report/);

  const empty = verdict(runs, ['--prefix', 'A11y / ', '--a11y-suite', 'nightly', '--a11y-checks', '']);

  assert.equal(empty.status, 1, 'an empty subset is no subset, as an empty dispatch input is');

  const unknown = verdict(runs, ['--prefix', 'A11y / ', '--a11y-suite', 'nightly', '--a11y-checks', 'nope']);

  assert.notEqual(unknown.status, 0, 'an unknown check id is refused');
  assert.match(unknown.stderr, /A11Y_CHECKS names no check "nope"/);
});

test('--projects keeps only the expected lanes the screen reader dispatch named, and a dispatch that ran no lane is red', () => {
  const expect = ['nvda-chromium', 'nvda-firefox', 'vo-webkit', 'vo-chromium'].flatMap(project => ['--expect', `Screen reader / ${project} report`]);
  const runs = [posted('Screen reader / vo-webkit report', 'success', 1)];
  const subset = verdict(runs, ['--prefix', 'Screen reader / ', '--projects', 'vo-webkit', ...expect]);

  assert.equal(subset.status, 0, subset.stdout + subset.stderr);
  assert.match(subset.stdout, /the run is success/);

  const full = verdict(runs, ['--prefix', 'Screen reader / ', ...expect]);

  assert.equal(full.status, 1, 'without the subset, every lane is expected');
  assert.match(full.stdout, /nvda-chromium report/);

  const spaced = verdict(runs, ['--prefix', 'Screen reader / ', '--projects', ' vo-webkit , ', ...expect]);

  assert.equal(spaced.status, 0, 'a stray space or comma in the list is tolerated');

  // `vo-chromium` is a whole word of its name only: a `chromium` project would keep nothing, and the run posted
  // no `vo-chromium` check run, so it is red for the lane it named.
  const other = verdict(runs, ['--prefix', 'Screen reader / ', '--projects', 'vo-chromium', ...expect]);

  assert.equal(other.status, 1);
  assert.match(other.stdout, /vo-chromium report/);

  const none = verdict([], ['--prefix', 'Screen reader / ', '--projects', 'nope', ...expect]);

  assert.equal(none.status, 1, 'a project no lane carries runs no lane, and a run that posted nothing is red');
  assert.match(none.stdout, /posted no check run/);
});
