import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';
import { job, jobIds } from '../lib/workflow-text.mjs';

const root = repoRoot();
const read = name => readFileSync(path.join(root, '.github/workflows', name), 'utf8');
const publishYml = read('publish.yml');
const componentsourceYml = read('componentsource.yml');
const testYml = read('test.yml');

const DOC = 'See .ai/CI.md, the entry on cutting a release candidate.';
const RC_DISPATCH = "github.event_name == 'workflow_dispatch' && inputs.publish-rc && startsWith(github.ref, 'refs/heads/release/')";

/**
 * The `on:` block of a workflow, the text between `on:` and the next top-level key.
 *
 * @param {string} source The workflow file's contents.
 * @returns {string} The block's text.
 */
function triggers(source) {
  const [, block = ''] = source.match(/^on:\n((?:(?: {2}.*| *#.*|)\n)*)/m) ?? [];

  return block;
}

/**
 * One trigger of a workflow, the text from its two-space key to the next trigger.
 *
 * @param {string} source The workflow file's contents.
 * @param {string} name The trigger, for example `push`.
 * @returns {string} The trigger's text, or an empty string when the workflow does not have it.
 */
function trigger(source, name) {
  const blocks = triggers(source).split(/^ {2}(?=[a-z_]+:)/m);

  return blocks.find(block => block.startsWith(`${name}:`)) ?? '';
}

/**
 * The job ids a job lists under `needs:`.
 *
 * @param {string} id The job id in publish.yml.
 * @returns {string[]} The job ids it needs.
 */
function needsOf(id) {
  const [, list = ''] = job(publishYml, id).match(/^ {4}needs: *(.+)$/m) ?? [];

  return list.replace(/[[\]]/g, '').split(',').map(name => name.trim()).filter(Boolean);
}

/**
 * Every job a job waits for, directly or through another job.
 *
 * @param {string} id The job id in publish.yml.
 * @returns {Set<string>} The job ids upstream of it.
 */
function upstreamOf(id) {
  const seen = new Set();
  const queue = [...needsOf(id)];

  while (queue.length) {
    const next = queue.shift();

    if (!seen.has(next)) {
      seen.add(next);
      queue.push(...needsOf(next));
    }
  }

  return seen;
}

test('a push to a release branch does not start the Publish workflow', () => {
  assert.equal(trigger(publishYml, 'push'), '',
    `publish.yml must have no push trigger: a merge to release/** is not a request for a release candidate. ${DOC}`);
});

test('the Publish workflow takes a publish-rc checkbox, off by default', () => {
  assert.match(trigger(publishYml, 'workflow_dispatch'), /^ {6}publish-rc:\n {8}description: .*\n {8}type: boolean\n {8}default: false$/m,
    `publish.yml needs a boolean publish-rc input that defaults to false, so a plain dispatch cuts nothing. ${DOC}`);
});

test('the RC path starts only from a publish-rc dispatch on a release branch', () => {
  assert.ok(job(publishYml, 'rc-check').includes(`    if: ${RC_DISPATCH}\n`),
    `rc-check must run only for a publish-rc dispatch on refs/heads/release/. ${DOC}`);
  assert.ok(job(publishYml, 'rc-build').includes(`    if: ${RC_DISPATCH} && needs.rc-check.outputs.allowed == 'true'\n`),
    `rc-build must keep the dispatch condition and the rc-check verdict. ${DOC}`);
});

test('no RC job waits for a push event, and each one runs after rc-check', () => {
  const rcJobs = jobIds(publishYml).filter(id => id.startsWith('rc-'));

  assert.ok(rcJobs.includes('rc-build') && rcJobs.includes('rc-publish'), 'publish.yml lost its rc-build or rc-publish job');

  for (const id of rcJobs) {
    assert.doesNotMatch(job(publishYml, id), /github\.event_name == 'push'/, `${id} still waits for a push event. ${DOC}`);

    if (id !== 'rc-check') {
      assert.ok(upstreamOf(id).has('rc-check'), `${id} does not wait for rc-check, so it can run without the dispatch condition`);
    }
  }
});

test('the on-demand experimental publish still skips release branches', () => {
  assert.match(job(publishYml, 'pre-release-dispatch'), /^ {6}!startsWith\(github\.ref_name, 'release\/'\) &&$/m,
    'pre-release-dispatch must skip release/ refs, or one dispatch with both boxes ticked publishes twice');
});

test('RC runs of one release branch queue, and no other run shares their group', () => {
  const [, block = ''] = publishYml.match(/^concurrency:\n((?: {2}.*\n)+)/m) ?? [];
  const [, group = ''] = block.match(/^ {2}group: (.+)$/m) ?? [];

  assert.notEqual(group, '', `publish.yml needs a top-level concurrency group: two RC runs would pick the same rcN. ${DOC}`);
  assert.ok(group.includes("github.event_name == 'workflow_dispatch' && inputs.publish-rc && format('rc-{0}', github.ref_name)"),
    'only a publish-rc dispatch may take the per-branch RC group');
  assert.ok(group.includes("format('publish-{0}', github.run_id)"), 'every other run must get a group of its own, so it never queues');
  assert.doesNotMatch(group, /github\.workflow/,
    'the group must not start from github.workflow: test.yml, called as rc-test, takes Publish-<ref> and a match deadlocks the run');
  assert.match(block, /^ {2}cancel-in-progress: false$/m,
    'a running RC must never be cancelled by the next one: it may have pushed the version bump without the tag');
});

test('the ComponentSource build accepts a manual RC run of Publish', () => {
  const body = job(componentsourceYml, 'build-componentsource');

  assert.match(body,
    /github\.event\.workflow_run\.event == 'workflow_dispatch' &&\n +startsWith\(github\.event\.workflow_run\.head_branch, 'release\/'\)/,
    'an RC Publish run is a workflow_dispatch on a release branch; without this arm no package is built after an RC');
  assert.doesNotMatch(body, /workflow_run\.event == 'push'/, 'Publish no longer runs on a push');
  assert.match(body, /github\.event\.workflow_run\.event == 'release'/, 'the first RC and the stable release still arrive as release events');
});

test('the Tests workflow runs on every push to a release branch, with the full matrix', () => {
  const push = trigger(testYml, 'push');

  assert.match(push, /^ {6}- 'master'$/m, 'test.yml lost its master push trigger');
  assert.match(push, /^ {6}- 'release\/\*\*'$/m,
    `test.yml must run on a push to release/**: Publish no longer tests each push as rc-test. ${DOC}`);

  for (const input of ['full-matrix', 'jasmine-full-matrix']) {
    const [, expression = ''] = testYml.match(new RegExp(`^ {6}${input}: \\$\\{\\{ (.+) \\}\\}$`, 'm')) ?? [];

    assert.ok(expression.includes("startsWith(github.ref, 'refs/heads/release/')"),
      `${input} must be on for a release branch push, the matrix each push got as rc-test`);
  }
});
