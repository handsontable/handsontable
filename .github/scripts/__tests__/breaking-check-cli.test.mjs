import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseCli, resolveRange, summarize } from '../lib/breaking-check/cli.mjs';
import { repoRoot } from '../lib/repo-root.mjs';

test('parseCli reads each flag and rejects contradictory ranges', () => {
  const options = parseCli(['--commit', 'abc', '--no-jev', '--json', '--out', 'o.json', '--comment', '12']);

  assert.equal(options.commit, 'abc');
  assert.equal(options.noJev, true);
  assert.equal(options.json, true);
  assert.equal(options.out, 'o.json');
  assert.equal(options.comment, 12);
  assert.equal(parseCli(['--merge-parent']).mergeParent, true);
  assert.equal(parseCli(['--from-json', 'a.json', '--render']).fromJson, 'a.json');
  assert.throws(() => parseCli(['--commit', 'a', '--merge-parent']), /only one of/);
  assert.throws(() => parseCli(['--commit', 'a', '--base', 'b']), /only one of/);
  assert.throws(() => parseCli(['--comment', 'x']), /pull request number/);
  assert.throws(() => parseCli(['--nope']));
});

const FLAGS = ['--no-color', '--no-ext-diff', '--src-prefix=a/', '--dst-prefix=b/', '--unified=3'];

test('resolveRange: commit, merge-parent, merge-base, and no-merge-base, all with fixed diff flags', () => {
  const never = () => { throw new Error('git should not run'); };
  const twoParents = (args) => {
    assert.deepEqual(args, ['rev-list', '--parents', '-n', '1', 'HEAD']);

    return 'merge p1 p2\n';
  };

  assert.deepEqual(resolveRange(parseCli(['--commit', 'abc']), never), {
    diffArgs: ['show', '--format=', ...FLAGS, 'abc'], ref: 'abc',
  });
  assert.deepEqual(resolveRange(parseCli(['--merge-parent']), twoParents), {
    diffArgs: ['diff', ...FLAGS, 'HEAD^1', 'HEAD'], ref: 'HEAD',
  });

  const git = (args) => {
    assert.deepEqual(args, ['merge-base', 'origin/develop', 'HEAD']);

    return 'deadbeef\n';
  };

  assert.deepEqual(resolveRange(parseCli([]), git), {
    diffArgs: ['diff', ...FLAGS, 'deadbeef', 'HEAD'], ref: 'HEAD',
  });
  assert.deepEqual(resolveRange(parseCli(['--base', 'b1', '--head', 'h1', '--no-merge-base']), never), {
    diffArgs: ['diff', ...FLAGS, 'b1', 'h1'], ref: 'h1',
  });
});

test('resolveRange: --merge-parent on a non-merge commit warns and yields no diff', () => {
  const oneParent = () => 'commit p1\n';
  const range = resolveRange(parseCli(['--merge-parent']), oneParent);

  assert.equal(range.diffArgs, null);
  assert.match(range.warning, /two parents, but HEAD has 1/);
});

test('summarize reports flag, names with scores, and the default change', () => {
  const text = summarize({
    flagged: true,
    declared: { breakingEntry: false },
    removedNames: [{ name: 'a', kind: 'method', file: 'f.ts', publicScore: 0.5 }],
    candidateCount: 2,
    jevUsed: true,
    sentToJev: 2,
    defaultsTouched: true,
    defaultsEvidence: '-  x: 1,',
  });

  assert.match(text, /Flagged: yes/);
  assert.match(text, /a \(method\) f\.ts score 0\.500/);
  assert.match(text, /Option default changed: yes, -  x: 1,/);
});

test('the CLI renders a saved result without git, network, or GitHub, and exits 0', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'breaking-check-'));
  const file = path.join(dir, 'r.json');

  writeFileSync(file, JSON.stringify({
    removedNames: [{ name: 'gone', kind: 'option', file: 'f.ts', line: '', publicScore: null }],
    defaultsTouched: false,
    defaultsEvidence: null,
    declared: { breakingEntry: false, removedRegistryTouched: false, deprecationWarnAdded: false },
    flagged: true,
    jevUsed: false,
    candidateCount: 1,
    sentToJev: 0,
  }));

  const out = execFileSync(
    process.execPath,
    [path.join(repoRoot(), '.github/scripts/breaking-check.mjs'), '--from-json', file, '--render'],
    { encoding: 'utf8', env: { PATH: process.env.PATH } },
  );

  assert.match(out, /^<!-- breaking-check -->\n### Possible breaking change/);
  assert.match(out, /`gone` \(option\)/);
});
