import assert from 'node:assert/strict';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';

const RANGE = ['--from', '17.1', '--to', '18.0', '--allow-dirty'];
const SOURCE = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { data: [], correctFormat: true });\n';
// Windows and root ignore the mode bits that these cases rely on.
const CAN_BLOCK_WRITES = process.platform !== 'win32' && process.getuid?.() !== 0;

describe('the report target is checked before any file is migrated', () => {
  it('refuses a directory that does not exist, with a usage error, and changes nothing', async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--report', 'nodir/r.md', '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /--report nodir\/r\.md: the directory nodir does not exist/);
      assert.doesNotMatch(result.stderr, /\n\s+at /, 'a stack trace reached the user');
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE, 'a file was migrated');
    });
  });

  it('refuses a directory as the report file, and changes nothing', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'out/keep.txt': 'x' }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--report', 'out', '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /--report out is a directory/);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
    });
  });

  it('writes the report into an existing subdirectory', async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      await mkdir(join(dir, 'reports'));

      const result = await migrate(dir, [...RANGE, '--report', 'reports/r.md', '.']);

      assert.equal(result.status, 0, result.stderr);
      assert.match(await readFile(join(dir, 'reports', 'r.md'), 'utf8'), /^# Handsontable migration report/);
    });
  });

  it('refuses a directory it cannot write to', { skip: !CAN_BLOCK_WRITES }, async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      await mkdir(join(dir, 'locked'));
      await chmod(join(dir, 'locked'), 0o555);

      const result = await migrate(dir, [...RANGE, '--report', 'locked/r.md', '.']);

      await chmod(join(dir, 'locked'), 0o755);
      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /is not writable/);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
    });
  });
});

describe('a report that cannot be written after the run does not hide the summary', () => {
  it('prints the summary and the next steps, names the file on stderr, and exits 1', { skip: !CAN_BLOCK_WRITES }, async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      await writeFile(join(dir, 'r.md'), 'old report');
      await chmod(join(dir, 'r.md'), 0o444);

      const result = await migrate(dir, [...RANGE, '--report', 'r.md', '.']);

      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout, /Summary: 1 file changed/);
      assert.match(result.stdout, /Next: /);
      assert.match(result.stderr, /Could not write the report to r\.md: EACCES/);
      assert.doesNotMatch(result.stderr, /\n\s+at /, 'a stack trace reached the user');
      assert.doesNotMatch(await readFile(join(dir, 'a.js'), 'utf8'), /correctFormat: true/);
    });
  });
});
