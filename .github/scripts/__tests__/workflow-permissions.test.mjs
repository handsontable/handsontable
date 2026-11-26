/**
 * Pins that no job a reusable workflow runs asks for a token permission its caller does not grant. GitHub checks
 * the whole nested graph against the caller's grant when the run starts, skipped jobs included, and refuses the run
 * (`startup_failure`) on one request above it. A pull request cannot show it: `test.yml` there runs with the
 * repository default token, while `publish.yml`'s rc and stable test jobs call the same `test.yml` with a narrower
 * grant, so a scope added to a job under `test.yml` would first fail a release candidate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ceilingViolations, permissionsOf, withoutComments } from '../lib/workflow-permissions.mjs';

const WORKFLOWS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../workflows');
const DOC = 'See .ai/CI.md, the per-stage orchestrators entry: nested permission requests are validated against the caller grant at run startup.';

const repository = () => ({
  files: readdirSync(WORKFLOWS).filter(name => /\.ya?ml$/.test(name)).sort(),
  read: name => readFileSync(path.join(WORKFLOWS, name), 'utf8'),
});

/**
 * Workflows held in memory, for the planted cases.
 *
 * @param {Record<string, string>} sources File name to contents.
 * @returns {{files: string[], read: (name: string) => string}} What `ceilingViolations()` takes.
 */
const planted = sources => ({ files: Object.keys(sources), read: name => sources[name] });

const caller = grant => [
  'on: workflow_dispatch',
  'jobs:',
  '  rc-test:',
  '    permissions:',
  ...grant.map(line => `      ${line}`),
  '    uses: ./.github/workflows/tests.yml',
  '',
].join('\n');

const tests = [
  'on: workflow_call',
  'jobs:',
  '  a11y:',
  '    uses: ./.github/workflows/scan.yml',
  '',
].join('\n');

const scan = asked => [
  'on: workflow_call',
  'jobs:',
  '  axe:',
  '    runs-on: ubuntu-latest',
  '    # a comment between the keys',
  '    permissions:',
  ...asked.map(line => `      ${line}`),
  '    steps:',
  '      - run: echo "#not-a-comment"',
  '',
].join('\n');

test('every job a caller\'s grant reaches asks for no more than the grant', () => {
  const { violations, walked } = ceilingViolations(repository());

  assert.deepEqual(violations, [], `A job asks for a permission its caller does not grant, so the caller's run fails at startup. ${DOC}`);
  // A walk that judged nothing would pass too: the rc and stable test jobs reach the accessibility scan's job.
  assert.ok(walked.includes('a11y.yml#axe'), `the walk from publish.yml's test jobs must reach a11y.yml's axe job. ${DOC}`);
  assert.ok(walked.includes('test.yml#a11y'), `the walk must judge test.yml's own jobs. ${DOC}`);
});

test('publish.yml\'s rc and stable test jobs declare the grant the walk starts from', () => {
  const publish = withoutComments(readFileSync(path.join(WORKFLOWS, 'publish.yml'), 'utf8'));
  const callers = [...publish.matchAll(/^ {2}([\w-]+):\n(?: {4}.*\n)*? {4}uses: \.\/\.github\/workflows\/test\.yml$/gm)].map(([, id]) => id);

  assert.deepEqual(callers, ['first-rc-test', 'rc-test'], `publish.yml calls test.yml from these two jobs. ${DOC}`);
});

test('a nested request above the caller\'s grant is a violation, two calls deep', () => {
  const grant = ['contents: write', 'actions: read', 'pull-requests: write', 'checks: write'];
  const { violations } = ceilingViolations(planted({
    'publish.yml': caller(grant),
    'tests.yml': tests,
    'scan.yml': scan(['contents: read', 'checks: write', 'pull-requests: write', 'issues: read', 'actions: read']),
  }));

  assert.deepEqual(violations, ['publish.yml#rc-test → tests.yml#a11y → scan.yml#axe: issues: read (the caller grants none)']);
});

test('a write the grant gives only as read is a violation, and a request within the grant is not', () => {
  const grant = ['contents: read', 'checks: write'];

  assert.deepEqual(ceilingViolations(planted({ 'publish.yml': caller(grant), 'tests.yml': tests, 'scan.yml': scan(['contents: write']) })).violations,
    ['publish.yml#rc-test → tests.yml#a11y → scan.yml#axe: contents: write (the caller grants read)']);
  assert.deepEqual(ceilingViolations(planted({ 'publish.yml': caller(grant), 'tests.yml': tests, 'scan.yml': scan(['contents: read', 'checks: write']) })).violations, []);
});

test('a caller without a grant of its own has no ceiling to read', () => {
  const { violations, walked } = ceilingViolations(planted({
    'nightly.yml': ['on: schedule', 'jobs:', '  a11y:', '    uses: ./.github/workflows/scan.yml', ''].join('\n'),
    'scan.yml': scan(['issues: write']),
  }));

  assert.deepEqual(violations, []);
  assert.deepEqual(walked, [], 'the repository default token is not in any file');
});

test('the workflow-level grant is the ceiling of a caller job without its own', () => {
  const nightly = ['on: schedule', 'permissions:', '  contents: read', 'jobs:', '  a11y:', '    uses: ./.github/workflows/scan.yml', ''].join('\n');

  assert.deepEqual(ceilingViolations(planted({ 'nightly.yml': nightly, 'scan.yml': scan(['checks: write']) })).violations,
    ['nightly.yml#a11y → scan.yml#axe: checks: write (the caller grants none)']);
});

test('the permissions reader knows the shapes the workflows use', () => {
  assert.equal(permissionsOf('jobs:\n  a:\n    runs-on: x\n', 4), null);
  assert.deepEqual(permissionsOf('    permissions: {}\n', 4), {});
  assert.deepEqual(permissionsOf('permissions: read-all\n', 0), { '*': 'read' });
  assert.deepEqual(permissionsOf('permissions:\n  id-token: write\njobs:\n', 0), { 'id-token': 'write' });
  assert.throws(() => permissionsOf('    permissions: ${{ inputs.grant }}\n', 4), /does not know/);
});
