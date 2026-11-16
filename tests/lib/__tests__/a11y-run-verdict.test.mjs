import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENARIO_GROUPS, SCREENREADER_PROJECTS } from '../screenreader-matrix.mjs';

// The run verdict script (`scripts/a11y-run-verdict.mjs`) on a subset dispatch: a nightly dispatched with the
// `checks`, `projects` or `groups` input ran a subset, and the verdict must expect that subset, or every subset
// run ends red for the check runs it never posted. It reads the inputs the way the check-inputs job did
// (`dispatchSubset()`, a11y-dispatch.test.mjs), so what the guard refused is one line here. The rule itself
// (`runVerdict()`) is tested in a11y-verdict.test.mjs; this pins how the script turns its arguments into the
// expected names.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(TESTS_ROOT, 'scripts/a11y-run-verdict.mjs');
const RUN = '4242';
const BRANCH = 'refs/heads/feature/DEV-0_proof';
const posted = (name, conclusion, id) => ({ id, name, conclusion, external_id: RUN, html_url: `https://github.com/o/r/runs/${id}`, output: { title: `${conclusion} title` } });
const laneName = (project, group) => `Screen reader / ${project} ${group} report`;
const LANES = SCREENREADER_PROJECTS.flatMap(project => SCENARIO_GROUPS.map(group => laneName(project, group)));
const EXPECT = LANES.flatMap(name => ['--expect', name]);

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
  const subset = verdict(runs, ['--prefix', 'A11y / ', '--ref', BRANCH, '--a11y-suite', 'nightly', '--a11y-checks', 'keyboard-walker']);

  assert.equal(subset.status, 0, subset.stdout + subset.stderr);
  assert.match(subset.stdout, /the run is neutral/, 'the subset run is judged on what it ran');

  const full = verdict(runs, ['--prefix', 'A11y / ', '--ref', BRANCH, '--a11y-suite', 'nightly']);

  assert.equal(full.status, 1, 'without the subset, the suite is expected and six checks are missing');
  assert.match(full.stdout, /tree-snapshots report/);

  const empty = verdict(runs, ['--prefix', 'A11y / ', '--ref', BRANCH, '--a11y-suite', 'nightly', '--a11y-checks', '']);

  assert.equal(empty.status, 1, 'an empty subset is no subset, as an empty dispatch input is');

  const unknown = verdict(runs, ['--prefix', 'A11y / ', '--ref', BRANCH, '--a11y-suite', 'nightly', '--a11y-checks', 'nope']);

  assert.equal(unknown.status, 1, 'an unknown check id is refused');
  assert.match(unknown.stderr, /^a11y-run-verdict: A11Y_CHECKS names no check "nope" \(comma-separated, no spaces\); the checks are keyboard-walker, /);
  assert.match(unknown.stdout, /## Run verdict: red\n\n[^\n]*\n\n- ✖ A11Y\\_CHECKS names no check "nope"/, 'one line in the summary (markdown-escaped), not a row per missing check');
  assert.doesNotMatch(unknown.stdout, /report/, 'no row: the run is judged on its inputs before its check runs');

  const develop = verdict(runs, ['--prefix', 'A11y / ', '--ref', 'refs/heads/develop', '--a11y-suite', 'nightly', '--a11y-checks', 'keyboard-walker']);

  assert.equal(develop.status, 1, 'a subset on develop is refused, as check-inputs refused it before the build');
  assert.match(develop.stderr, /a dispatch on develop is the audit, which runs every check and every lane; checks=keyboard-walker is for a proof run on a branch/);
  assert.match(develop.stdout, /## Run verdict: red\n\n[^\n]*\n\n- ✖ a dispatch on develop is the audit/);

  const audit = verdict([posted('A11y / axe report', 'success', 1)], ['--prefix', 'A11y / ', '--ref', 'refs/heads/develop', '--a11y-suite', 'nightly', '--a11y-checks', '']);

  assert.equal(audit.status, 1, 'the audit expects every check');
  assert.match(audit.stdout, /keyboard-walker report/);
});

test('--projects and --groups keep only the expected lanes the screen reader dispatch named, and a lane it named that posted nothing is red', () => {
  const runs = [posted(laneName('vo-webkit', 'keyboard'), 'success', 1)];
  const subset = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, '--projects', 'vo-webkit', '--groups', 'keyboard', ...EXPECT]);

  assert.equal(subset.status, 0, subset.stdout + subset.stderr);
  assert.match(subset.stdout, /the run is success/);

  const projectOnly = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, '--projects', 'vo-webkit', '--groups', '', ...EXPECT]);

  assert.equal(projectOnly.status, 1, 'a project without a groups subset expects every group of that project');
  assert.match(projectOnly.stdout, /vo-webkit reading report/);
  assert.doesNotMatch(projectOnly.stdout, /nvda-chromium/);

  const groupOnly = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, '--projects', '', '--groups', 'keyboard', ...EXPECT]);

  assert.equal(groupOnly.status, 1, 'a group without a projects subset expects that group on every project');
  assert.match(groupOnly.stdout, /nvda-chromium keyboard report/);
  assert.doesNotMatch(groupOnly.stdout, /vo-webkit reading report/);

  const full = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, ...EXPECT]);

  assert.equal(full.status, 1, 'without the subset, every lane is expected');
  assert.match(full.stdout, /nvda-chromium menus report/);

  // `vo-chromium` is a whole word of its name only: a `chromium` project would keep nothing, and the run posted
  // no `vo-chromium` check run, so it is red for the lane it named.
  const other = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, '--projects', 'vo-chromium', '--groups', 'keyboard', ...EXPECT]);

  assert.equal(other.status, 1);
  assert.match(other.stdout, /vo-chromium keyboard report/);

  const spaced = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, '--projects', 'vo-webkit, nvda-chromium', ...EXPECT]);

  assert.equal(spaced.status, 1, 'a space is no project: the lane job matches a whole name and cannot trim, so the verdict refuses what the lane would skip');
  assert.match(spaced.stderr, /^a11y-run-verdict: projects names no project " nvda-chromium" \(comma-separated, no spaces\); the projects are nvda-chromium, nvda-firefox, vo-webkit, vo-chromium\.$/m);
  assert.match(spaced.stdout, /- ✖ projects names no project/);
  assert.doesNotMatch(spaced.stdout, /posted no/, 'one line, not a row per lane');

  const unknownGroup = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', BRANCH, '--groups', 'nope', ...EXPECT]);

  assert.equal(unknownGroup.status, 1);
  assert.match(unknownGroup.stderr, /groups names no group "nope"/);

  const develop = verdict(runs, ['--prefix', 'Screen reader / ', '--ref', 'refs/heads/develop', '--projects', 'vo-webkit', '--groups', 'keyboard', ...EXPECT]);

  assert.equal(develop.status, 1, 'a subset on develop is refused, as check-inputs refused it before the build');
  assert.match(develop.stderr, /projects=vo-webkit and groups=keyboard is for a proof run on a branch/);
  assert.match(develop.stdout, /- ✖ a dispatch on develop is the audit/);
});
