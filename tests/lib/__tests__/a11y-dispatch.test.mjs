import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AUDIT_REF, dispatchSubset } from '../a11y-dispatch.mjs';
import { EVIDENCE_CHECKS } from '../a11y-evidence.mjs';
import { namedSubset } from '../a11y-subset.mjs';
import { SCENARIO_GROUPS, SCREENREADER_PROJECTS } from '../screenreader-matrix.mjs';

// tests/AGENTS.md ("A11y: the audit and the proof runs"): a dispatch of an accessibility nightly is read once,
// the same way, by the check-inputs job before the build and by the verdict after the lanes. A subset on
// develop is refused (the dispatch there is the audit, and the test-health page draws the latest night), and
// an entry of a subset is a whole known name, exactly, because the lane jobs match it with `contains()`, which
// cannot trim. Plain `node --test`, no packages: the root `test:tooling` installs nothing.

const TESTS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = path.join(TESTS_ROOT, 'scripts/a11y-dispatch-inputs.mjs');
const BRANCH = 'refs/heads/feature/DEV-0_proof';

/**
 * Runs the guard script with the given arguments.
 *
 * @param {string[]} args The arguments.
 * @returns {{status: number|null, stdout: string, stderr: string}} The result.
 */
function guard(args) {
  const child = spawnSync(process.execPath, [SCRIPT, ...args], { cwd: TESTS_ROOT, encoding: 'utf8', timeout: 30_000 });

  return { status: child.status, stdout: child.stdout, stderr: child.stderr };
}

test('namedSubset reads a comma-separated input as whole known names: deduplicated, in the known order, nothing trimmed', () => {
  const known = ['one', 'two', 'three'];
  const what = { label: 'things', noun: 'thing' };

  assert.equal(namedSubset(undefined, known, what), null, 'no input is no subset');
  assert.equal(namedSubset('', known, what), null, 'an empty input is no subset, as an empty dispatch input is');
  assert.deepEqual(namedSubset('three,one,one', known, what), ['one', 'three']);
  assert.deepEqual(namedSubset('two', known, what), ['two']);
  assert.throws(() => namedSubset('one, two', known, what), /^Error: things names no thing " two" \(comma-separated, no spaces\); the things are one, two, three\.$/,
    'a space is not trimmed: the lane workflow matches `,<name>,` and cannot trim either');
  assert.throws(() => namedSubset('one,', known, what), /things names no thing ""/);
  assert.throws(() => namedSubset('four', known, what), /things names no thing "four"/);
  assert.throws(() => namedSubset('constructor', known, what), /things names no thing "constructor"/, 'a known name is an entry of the list, never a property of its prototype');
});

test('dispatchSubset resolves a dispatch: the checks the A11y nightly runs, the projects and groups the screen reader nightly runs', () => {
  const every = Object.keys(EVIDENCE_CHECKS);
  const short = every.filter(id => EVIDENCE_CHECKS[id].pullRequest === true);

  assert.deepEqual(dispatchSubset({ ref: BRANCH }), { checks: every, projects: null, groups: null, subset: false });
  assert.deepEqual(dispatchSubset({ ref: BRANCH, suite: 'nightly', checks: '', projects: '', groups: '' }), { checks: every, projects: null, groups: null, subset: false },
    'empty inputs are no subset: the audit and the pull_request trigger pass them');
  assert.deepEqual(dispatchSubset({ ref: BRANCH, suite: 'pull-request' }), { checks: short, projects: null, groups: null, subset: true });
  assert.deepEqual(dispatchSubset({ ref: BRANCH, suite: 'pull-request', checks: 'tree-snapshots' }).checks, ['tree-snapshots'], 'the named checks win over the suite');
  assert.deepEqual(dispatchSubset({ ref: BRANCH, projects: 'vo-webkit', groups: 'menus,keyboard' }),
    { checks: every, projects: ['vo-webkit'], groups: ['keyboard', 'menus'], subset: true });
  assert.throws(() => dispatchSubset({ ref: BRANCH, projects: 'vo-webkit, nvda-chromium' }), /projects names no project " nvda-chromium"/);
  assert.throws(() => dispatchSubset({ ref: BRANCH, groups: 'keyboard,nope' }), /groups names no group "nope" \(comma-separated, no spaces\); the groups are keyboard, reading, menus, editors, selection, structure, status\./);
  assert.throws(() => dispatchSubset({ ref: BRANCH, checks: 'nope' }), /A11Y_CHECKS names no check "nope"/);
  assert.throws(() => dispatchSubset({ ref: BRANCH, suite: 'pr' }), /HOT_A11Y_CHECKS_SUITE must be one of/);
  assert.deepEqual(SCREENREADER_PROJECTS, ['nvda-chromium', 'nvda-firefox', 'vo-webkit', 'vo-chromium'], 'the lists the inputs are checked against');
  assert.deepEqual(SCENARIO_GROUPS, ['keyboard', 'reading', 'menus', 'editors', 'selection', 'structure', 'status']);
});

test('a subset on develop is refused: the dispatch there is the audit, and the audit runs everything', () => {
  assert.equal(AUDIT_REF, 'refs/heads/develop');
  assert.deepEqual(dispatchSubset({ ref: AUDIT_REF, suite: 'nightly', checks: '', projects: '', groups: '' }).subset, false, 'the audit passes');
  ['suite=pull-request', 'checks=keyboard-walker', 'projects=vo-webkit', 'groups=keyboard'].forEach((input) => {
    const [name, value] = input.split('=');

    assert.throws(() => dispatchSubset({ ref: AUDIT_REF, [name]: value }),
      new RegExp(`^Error: a dispatch on develop is the audit, which runs every check and every lane; ${input} is for a proof run on a branch \\(tests/AGENTS\\.md, "A11y: the audit and the proof runs"\\)\\.$`),
      `${input} on develop is refused, by name, so the message says what to drop`);
  });
  assert.throws(() => dispatchSubset({ ref: AUDIT_REF, projects: 'vo-webkit', groups: 'keyboard' }), /projects=vo-webkit and groups=keyboard is for a proof run/);
  assert.throws(() => dispatchSubset({ ref: AUDIT_REF, projects: 'nope' }), /projects names no project "nope"/, 'an entry that names nothing is refused first, on any ref');
});

test('a site workflow\'s checks input names its site checks: every one by default, a subset on a branch, never on develop', () => {
  const docs = ['docs-structure', 'docs-keyboard', 'docs-focus-contrast', 'docs-reflow', 'docs-forced-colors-motion'];

  assert.deepEqual(dispatchSubset({ ref: AUDIT_REF, site: 'docs' }).siteChecks, docs);
  assert.deepEqual(dispatchSubset({ ref: AUDIT_REF, site: 'docs', siteChecks: '' }).siteChecks, docs);
  assert.deepEqual(dispatchSubset({ ref: 'refs/heads/feature/x', site: 'docs', siteChecks: 'docs-reflow,docs-keyboard' }),
    { checks: Object.keys(EVIDENCE_CHECKS), projects: null, groups: null, siteChecks: ['docs-keyboard', 'docs-reflow'], subset: true });
  assert.throws(() => dispatchSubset({ ref: AUDIT_REF, site: 'docs', siteChecks: 'docs-reflow' }), /checks=docs-reflow is for a proof run on a branch/);
  assert.throws(() => dispatchSubset({ ref: 'refs/heads/feature/x', site: 'docs', siteChecks: 'keyboard-walker' }),
    /checks names no docs site check "keyboard-walker"/);
  assert.equal(Object.hasOwn(dispatchSubset({ ref: AUDIT_REF }), 'siteChecks'), false, 'a nightly\'s dispatch has no site checks');
});

test('the guard script says what the run covers, and refuses with an error annotation and exit 1', () => {
  const audit = guard(['--ref', AUDIT_REF, '--suite', 'nightly', '--checks', '']);

  assert.equal(audit.status, 0, audit.stderr);
  assert.match(audit.stdout, /^a11y-dispatch-inputs: no subset on refs\/heads\/develop\na11y-dispatch-inputs: checks beyond axe: keyboard-walker, /);

  const proof = guard(['--ref', BRANCH, '--projects', 'vo-webkit', '--groups', 'keyboard']);

  assert.equal(proof.status, 0, proof.stderr);
  assert.match(proof.stdout, /^a11y-dispatch-inputs: a subset dispatch on refs\/heads\/feature\/DEV-0_proof\na11y-dispatch-inputs: reader projects: vo-webkit; scenario groups: keyboard\n$/);

  const everyLane = guard(['--ref', BRANCH, '--projects', '', '--groups', '']);

  assert.equal(everyLane.status, 0);
  assert.match(everyLane.stdout, /reader projects: every one; scenario groups: every one/);

  const develop = guard(['--ref', AUDIT_REF, '--projects', 'vo-webkit', '--groups', '']);

  assert.equal(develop.status, 1);
  assert.match(develop.stdout, /^::error title=Dispatch inputs::a dispatch on develop is the audit, which runs every check and every lane; projects=vo-webkit is for a proof run on a branch/);
  assert.match(develop.stderr, /^a11y-dispatch-inputs: a dispatch on develop is the audit/);

  const spaced = guard(['--ref', BRANCH, '--suite', 'nightly', '--checks', 'keyboard-walker, reflow']);

  assert.equal(spaced.status, 1);
  assert.match(spaced.stdout, /^::error title=Dispatch inputs::A11Y_CHECKS names no check " reflow" \(comma-separated, no spaces\)/);
});
