import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGitHub } from '../lib/docs-sync/github.mjs';

/**
 * A recorder that answers each `gh` call from a queue.
 */
function recorder(answers) {
  const calls = [];
  const run = (args) => {
    calls.push(args);

    return answers.shift() ?? '';
  };

  return { calls, run };
}

test('getPullRequest reads title, body, labels, and author through gh api', () => {
  const { calls, run } = recorder([JSON.stringify({ number: 5, title: 'T', body: 'B', labels: [{ name: 'docs-sync: skip' }], user: { login: 'demtario' } })]);
  const gh = createGitHub({ repo: 'o/r', run });

  assert.deepEqual(gh.getPullRequest(5), { number: 5, title: 'T', body: 'B', labels: ['docs-sync: skip'], author: 'demtario' });
  assert.deepEqual(calls[0], ['api', 'repos/o/r/pulls/5']);
});

test('findOpenPr returns the single open pull request or null', () => {
  const { calls, run } = recorder(['[{"number":9,"url":"u"}]', '[]']);
  const gh = createGitHub({ repo: 'o/r', run });

  assert.deepEqual(gh.findOpenPr('docs-sync/prod-docs-18.1', 'prod-docs/18.1'), { number: 9, url: 'u' });
  assert.equal(gh.findOpenPr('x', 'y'), null);
  assert.deepEqual(calls[0], ['pr', 'list', '--repo', 'o/r', '--state', 'open', '--head', 'docs-sync/prod-docs-18.1', '--base', 'prod-docs/18.1', '--json', 'number,url']);
});

test('createPr passes labels and reviewers only when given', () => {
  const { calls, run } = recorder(['https://github.com/o/r/pull/12', 'https://github.com/o/r/pull/13']);
  const gh = createGitHub({ repo: 'o/r', run });

  assert.equal(gh.createPr({ head: 'h', base: 'b', title: 't', body: 'body', labels: ['docs-sync'], reviewers: ['a', 'b'] }), 'https://github.com/o/r/pull/12');
  assert.deepEqual(calls[0], ['pr', 'create', '--repo', 'o/r', '--head', 'h', '--base', 'b', '--title', 't', '--body', 'body', '--label', 'docs-sync', '--reviewer', 'a,b']);

  gh.createPr({ head: 'h', base: 'b', title: 't', body: 'body', labels: [], reviewers: [] });
  assert.deepEqual(calls[1], ['pr', 'create', '--repo', 'o/r', '--head', 'h', '--base', 'b', '--title', 't', '--body', 'body']);
});

test('upsertComment edits the marked comment when it exists and posts otherwise', () => {
  const marker = '<!-- docs-sync-hold -->';
  const existing = JSON.stringify([[{ id: 77, body: `${marker}\nold` }]]);
  const { calls, run } = recorder([existing, '', '[[]]', '']);
  const gh = createGitHub({ repo: 'o/r', run });

  gh.upsertComment(3, marker, 'new text');
  assert.deepEqual(calls[0], ['api', 'repos/o/r/issues/3/comments', '--paginate', '--slurp']);
  assert.deepEqual(calls[1], ['api', '--method', 'PATCH', 'repos/o/r/issues/comments/77', '-f', `body=${marker}\nnew text`]);

  gh.upsertComment(3, marker, 'first text');
  assert.deepEqual(calls[3], ['api', '--method', 'POST', 'repos/o/r/issues/3/comments', '-f', `body=${marker}\nfirst text`]);
});

test('upsertComment finds the marked comment on a later page', () => {
  const marker = '<!-- docs-sync-hold -->';
  const twoPages = JSON.stringify([[{ id: 1, body: 'unrelated' }], [{ id: 78, body: `${marker}\nold` }]]);
  const { calls, run } = recorder([twoPages, '']);
  const gh = createGitHub({ repo: 'o/r', run });

  gh.upsertComment(3, marker, 'updated text');
  assert.deepEqual(calls[1], ['api', '--method', 'PATCH', 'repos/o/r/issues/comments/78', '-f', `body=${marker}\nupdated text`]);
});

test('ensureLabels, updatePr, closePr, and listOpenPrsWithLabel build the expected calls', () => {
  const { calls, run } = recorder([
    '[{"name":"docs-sync"}]', '', '', '', '[{"number":1,"baseRefName":"prod-docs/18.0","headRefName":"docs-sync/prod-docs-18.0","url":"u"}]',
  ]);
  const gh = createGitHub({ repo: 'o/r', run });

  gh.ensureLabels(['docs-sync', 'docs-sync: skip']);
  assert.deepEqual(calls[0], ['label', 'list', '--repo', 'o/r', '--json', 'name', '--limit', '100']);
  assert.deepEqual(calls[1], ['label', 'create', 'docs-sync: skip', '--repo', 'o/r', '--color', '0E8A16', '--description', 'Managed by the docs sync workflow']);
  assert.equal(calls.filter((call) => call[0] === 'label' && call[1] === 'create').length, 1, 'the already-existing label is not recreated');

  gh.updatePr(4, { title: 'T', body: 'B' });
  assert.deepEqual(calls[2], ['pr', 'edit', '4', '--repo', 'o/r', '--title', 'T', '--body', 'B']);

  gh.closePr(4, 'bye');
  assert.deepEqual(calls[3], ['pr', 'close', '4', '--repo', 'o/r', '--comment', 'bye']);

  assert.deepEqual(gh.listOpenPrsWithLabel('docs-sync'), [{ number: 1, baseRefName: 'prod-docs/18.0', headRefName: 'docs-sync/prod-docs-18.0', url: 'u' }]);
  assert.deepEqual(calls[4], ['pr', 'list', '--repo', 'o/r', '--state', 'open', '--label', 'docs-sync', '--json', 'number,baseRefName,headRefName,url']);
});

test('ensureLabels creates nothing when every label already exists', () => {
  const { calls, run } = recorder(['[{"name":"docs-sync"},{"name":"docs-sync: skip"},{"name":"docs-sync: include"}]']);
  const gh = createGitHub({ repo: 'o/r', run });

  gh.ensureLabels(['docs-sync', 'docs-sync: skip', 'docs-sync: include']);

  assert.equal(calls.length, 1, 'only the label list call is made');
  assert.deepEqual(calls[0], ['label', 'list', '--repo', 'o/r', '--json', 'name', '--limit', '100']);
});
