import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

const script = path.join(repoRoot(), '.github/scripts/breaking-check.mjs');

/**
 * A repo shaped like a pull request whose base moved after it forked and whose
 * branch merged the base, then a `refs/pull/N/merge`-style commit on top of the
 * base's newest tip.
 */
function buildRepo() {
  const dir = mkdtempSync(path.join(tmpdir(), 'breaking-check-repo-'));
  const git = (...args) => execFileSync('git', args, { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const write = (rel, text) => {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), text);
  };
  const commit = (message) => {
    git('add', '-A');
    git('-c', 'user.name=t', '-c', 'user.email=t@t', 'commit', '-q', '-m', message);
  };
  const methods = (names) => `export class P {\n${names.map((n) => `  ${n}() {\n  }\n`).join('')}}\n`;

  git('init', '-q', '-b', 'main');
  write('handsontable/src/plugins/p/p.ts', methods(['goneMethod', 'onlyInTests', 'onlyInDocs', 'stays']));
  write('handsontable/src/plugins/p/__tests__/p.unit.js', 'onlyInTests();\n');
  write('handsontable/src/plugins/p/README.md', 'Call onlyInDocs to do it.\n');
  write('handsontable/src/plugins/q/q.ts', methods(['baseGoneEarly', 'baseGoneLate', 'qStays']));
  commit('base');
  git('checkout', '-q', '-b', 'feature');
  write('handsontable/src/plugins/p/p.ts', methods(['stays']));
  commit('pr change');
  git('checkout', '-q', 'main');
  write('handsontable/src/plugins/q/q.ts', methods(['baseGoneLate', 'qStays']));
  commit('base moves 1');
  git('checkout', '-q', 'feature');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'merge', '-q', '--no-edit', 'main');
  git('checkout', '-q', 'main');
  write('handsontable/src/plugins/q/q.ts', methods(['qStays']));
  commit('base moves 2');
  git('checkout', '-q', '-b', 'pr-merge');
  git('-c', 'user.name=t', '-c', 'user.email=t@t', 'merge', '-q', '--no-ff', '--no-edit', 'feature');

  return dir;
}

const runCli = (dir, ...args) => JSON.parse(execFileSync(
  process.execPath,
  [script, '--cwd', dir, '--no-jev', '--json', ...args],
  { encoding: 'utf8', env: { PATH: process.env.PATH } },
));

test('--merge-parent reports only the pull request own removals, not base commits merged in either side', () => {
  const dir = buildRepo();
  const { removedNames } = runCli(dir, '--merge-parent');

  assert.deepEqual(removedNames.map((n) => n.name).sort(), ['goneMethod', 'onlyInDocs', 'onlyInTests']);
});

test('a name that survives only under __tests__ or in a .md file counts as gone', () => {
  const dir = buildRepo();
  const names = runCli(dir, '--merge-parent').removedNames.map((n) => n.name);

  assert.ok(names.includes('onlyInTests'));
  assert.ok(names.includes('onlyInDocs'));
  assert.ok(!names.includes('stays'));
});

test('--merge-parent on a non-merge commit reports no findings', () => {
  const dir = buildRepo();
  const git = (...args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' });

  git('checkout', '-q', 'feature~1');

  const result = runCli(dir, '--merge-parent');

  assert.equal(result.flagged, false);
  assert.deepEqual(result.removedNames, []);
});
