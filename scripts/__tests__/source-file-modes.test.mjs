/**
 * Pins the file modes of the core package's sources: no tracked file under
 * `handsontable/src` is executable.
 *
 * The bit means nothing for a module, and it was not harmless. Ten plugin
 * sources carried it, nine from the 2017 Handsontable Pro import and one added
 * in 2025, and the evals mutation layer dropped it on every Stryker run: in
 * place, Stryker restores a file by moving its backup copy over it, and the
 * backup is a new file with the default mode. Each run left a mode-only diff on
 * all ten.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));

test('no tracked file under handsontable/src is executable', () => {
  const index = execFileSync('git', ['-c', 'core.quotePath=false', 'ls-files', '-s', '--', 'handsontable/src'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  });
  const entries = index.split('\n').filter(Boolean);
  const executable = entries.filter(line => line.startsWith('100755 ')).map(line => line.split('\t')[1]);

  // An empty listing (a wrong cwd, a sparse checkout) would pass vacuously.
  assert.ok(entries.length > 1000, `expected the core sources in the index, got ${entries.length} entries`);
  // `git add --chmod=-x` alone changes only the index, and the next `git add` restores the bit.
  assert.deepEqual(executable, [], 'clear the bit in the file and the index: `chmod a-x <file> && git add <file>`');
});
