import assert from 'node:assert/strict';
import {
  chmod, link, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, writeFile,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { writeFileSafely } from '../src/lib/safe-write.mjs';
import { renderConsole } from '../src/report.mjs';
import { run } from '../src/runner.mjs';
import { inPlainProject } from './helpers/plain-project.mjs';

const SOURCE = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { data: [], correctFormat: true });\n';
const RANGE = { from: '17.1', to: '18.0', allowDirty: true };
// Windows and root ignore the mode bits that some cases rely on.
const CAN_BLOCK_WRITES = process.platform !== 'win32' && process.getuid?.() !== 0;
const POSIX = process.platform !== 'win32';

/**
 * Make a symbolic link, or report that the platform cannot (Windows without the privilege).
 *
 * @param {string} target What the link points to.
 * @param {string} path Where the link goes.
 * @param {'file'|'dir'} [type] Link type, which only Windows reads.
 * @returns {Promise<boolean>} `true` when the link exists.
 */
async function tryLink(target, path, type = 'file') {
  try {
    await symlink(target, path, type);

    return true;
  } catch {
    return false;
  }
}

/**
 * The permission bits of a file as three octal digits, for example `755`.
 *
 * @param {import('node:fs').Stats} info The result of `lstat()`.
 * @returns {string} The digits.
 */
function permissionsOf(info) {
  return info.mode.toString(8).slice(-3);
}

/**
 * Names in a directory that the tool made for a write and did not clean up.
 *
 * @param {string} dir Directory.
 * @returns {Promise<string[]>} The temporary file names.
 */
async function leftovers(dir) {
  return (await readdir(dir)).filter(name => name.endsWith('.codemod-tmp'));
}

describe('writeFileSafely()', () => {
  it('replaces the file with the new text, keeps its mode, and leaves no temporary file', async() => {
    await inPlainProject({ 'a.js': 'old\n' }, async(dir) => {
      const path = join(dir, 'a.js');

      if (POSIX) {
        await chmod(path, 0o755);
      }

      await writeFileSafely(path, 'old\n', 'new\n');

      assert.equal(await readFile(path, 'utf8'), 'new\n');
      assert.deepEqual(await leftovers(dir), []);

      if (POSIX) {
        assert.equal(permissionsOf(await lstat(path)), '755');
      }
    });
  });

  it('refuses a file that holds other text than the tool read, and keeps what is there', async() => {
    await inPlainProject({ 'a.js': 'old\n' }, async(dir) => {
      const path = join(dir, 'a.js');

      await assert.rejects(
        writeFileSafely(path, 'old\n', 'new\n', { beforeRename: () => writeFile(path, 'typed in an editor\n') }),
        /a\.js changed while the tool was running/,
      );
      assert.equal(await readFile(path, 'utf8'), 'typed in an editor\n');
      assert.deepEqual(await leftovers(dir), []);
    });
  });

  it('refuses a path that became another file with the same text', async() => {
    await inPlainProject({ 'a.js': 'old\n' }, async(dir) => {
      const path = join(dir, 'a.js');

      await assert.rejects(writeFileSafely(path, 'old\n', 'new\n', {
        beforeRename: async() => {
          // The old file stays alive under another name, so the file system cannot hand its inode number to the
          // new file. Linux reuses the number of a file that is gone at once, which would hide the swap.
          await rename(path, join(dir, 'a.old.js'));
          await writeFile(path, 'old\n');
        },
      }), /changed while the tool was running/);
      assert.equal(await readFile(path, 'utf8'), 'old\n');
    });
  });

  it('removes its temporary file when the replace fails', async() => {
    await inPlainProject({ 'a.js': 'old\n' }, async(dir) => {
      await assert.rejects(writeFileSafely(join(dir, 'a.js'), 'old\n', 'new\n', {
        beforeRename: () => {
          throw new Error('disk full');
        },
      }), /disk full/);
      assert.deepEqual(await leftovers(dir), []);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), 'old\n');
    });
  });

  it('refuses a read-only file and a symbolic link', { skip: !CAN_BLOCK_WRITES }, async() => {
    await inPlainProject({ 'a.js': 'old\n', 'target.js': 'target\n' }, async(dir) => {
      await chmod(join(dir, 'a.js'), 0o444);
      await assert.rejects(writeFileSafely(join(dir, 'a.js'), 'old\n', 'new\n'), { code: 'EACCES' });
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), 'old\n');

      if (await tryLink(join(dir, 'target.js'), join(dir, 'l.js'))) {
        await assert.rejects(writeFileSafely(join(dir, 'l.js'), 'target\n', 'new\n'), /no longer a regular file/);
        assert.equal(await readFile(join(dir, 'target.js'), 'utf8'), 'target\n');
      }
    });
  });
});

describe('a write that fails or is refused is not a rewrite', () => {
  it('keeps the edit of an editor that saved during the run, and counts no rewrite for the file', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'b.js': SOURCE }, async(dir) => {
      const result = await run({
        cwd: dir,
        ...RANGE,
        hooks: { beforeRename: file => (file === 'a.js' ? writeFile(join(dir, file), 'edited\n') : undefined) },
      });

      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), 'edited\n');
      assert.doesNotMatch(await readFile(join(dir, 'b.js'), 'utf8'), /correctFormat: true/,
        'the other file is migrated');
      assert.deepEqual(result.changedFiles, ['b.js']);
      assert.equal(result.exitCode, 1);
      assert.ok(result.report.entries.some(entry => entry.ruleId === 'write-error' && entry.file === 'a.js'
        && /changed while the tool was running/.test(entry.message)));

      // The summary counts what is on disk: one file changed, so one file worth of rewrites.
      const edits = result.report.entries.filter(entry => entry.severity === 'changed');

      assert.ok(edits.length > 0 && edits.every(entry => entry.file === 'b.js'), JSON.stringify(edits));
      assert.match(renderConsole(result.report, { filesChanged: result.changedFiles.length }),
        new RegExp(`Summary: 1 file changed, ${edits.length} rewrite`));
    });
  });

  it('does not list a file it did not write under a note that says what the rewrite changed', async() => {
    const TYPE = 'import type { Config } from \'handsontable/plugins/columnSorting\';\nexport type X = Config;\n';

    await inPlainProject({ 'a.ts': TYPE, 'b.ts': TYPE }, async(dir) => {
      const result = await run({
        cwd: dir,
        ...RANGE,
        hooks: { beforeRename: file => (file === 'a.ts' ? writeFile(join(dir, file), 'edited\n') : undefined) },
      });
      const notes = result.report.once().filter(entry => entry.ruleId === '18.0.0/type-columnsorting-config');

      assert.deepEqual(result.changedFiles, ['b.ts']);
      assert.equal(notes.length, 1, JSON.stringify(result.report.entries));
      assert.deepEqual(notes[0].files, ['b.ts']);
    });
  });

  it('counts no rewrite for a read-only file, and goes on with the files after it', { skip: !CAN_BLOCK_WRITES }, async() => {
    await inPlainProject({ 'a.js': SOURCE, 'b.js': SOURCE, 'c.js': SOURCE }, async(dir) => {
      await chmod(join(dir, 'b.js'), 0o444);

      const result = await run({ cwd: dir, ...RANGE });

      assert.equal(await readFile(join(dir, 'b.js'), 'utf8'), SOURCE);
      assert.deepEqual(result.changedFiles, ['a.js', 'c.js']);
      assert.equal(result.exitCode, 1);
      assert.equal(result.report.entries.filter(entry => entry.severity === 'changed' && entry.file === 'b.js').length,
        0, 'the edits of the file that was not written are not reported as applied');
      assert.ok(result.report.entries.some(entry => entry.ruleId === 'write-error' && entry.file === 'b.js'));
    });
  });

  it('leaves no temporary file next to a file it could not replace', async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      const result = await run({
        cwd: dir,
        ...RANGE,
        hooks: {
          beforeRename: () => {
            throw new Error('the disk is full');
          },
        },
      });

      assert.deepEqual(await leftovers(dir), []);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
      assert.match(result.report.entries.find(entry => entry.ruleId === 'write-error').message, /the disk is full/);
    });
  });

  it('keeps the exact mode of a file under a umask that would cut it', { skip: !POSIX }, async() => {
    const before = process.umask(0o022);

    try {
      for (const [mode, expected] of [[0o664, '664'], [0o775, '775'], [0o666, '666'], [0o640, '640']]) {
        await inPlainProject({ 'a.js': 'old\n' }, async(dir) => {
          await chmod(join(dir, 'a.js'), mode);
          await writeFileSafely(join(dir, 'a.js'), 'old\n', 'new\n');

          assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), 'new\n');
          assert.equal(permissionsOf(await lstat(join(dir, 'a.js'))), expected, `mode ${mode.toString(8)}`);
        });
      }

      process.umask(0o077);

      await inPlainProject({ 'a.js': 'old\n' }, async(dir) => {
        await chmod(join(dir, 'a.js'), 0o644);
        await writeFileSafely(join(dir, 'a.js'), 'old\n', 'new\n');

        assert.equal(permissionsOf(await lstat(join(dir, 'a.js'))), '644', 'the strict umask did not narrow the mode');
      });
    } finally {
      process.umask(before);
    }
  });

  it('keeps the mode of a file it rewrites', { skip: !POSIX }, async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      await chmod(join(dir, 'a.js'), 0o750);
      await run({ cwd: dir, ...RANGE });

      assert.doesNotMatch(await readFile(join(dir, 'a.js'), 'utf8'), /correctFormat: true/);
      assert.equal(permissionsOf(await lstat(join(dir, 'a.js'))), '750');
    });
  });
});

describe('the write-time check that a file resolves inside the project', () => {
  /**
   * Run with a file list that holds a path whose real location is outside the project, the way a link swapped in after
   * discovery would. `discover` drops links first, so only an injected list reaches the check in `run()`.
   *
   * @param {string} dir Project directory.
   * @param {string[]} files What discovery "found".
   * @returns {Promise<Awaited<ReturnType<typeof run>>>} The outcome.
   */
  const runOn = (dir, files) => run({ cwd: dir, ...RANGE, hooks: { discover: async() => files } });

  it('does not write through a file link to a file outside the project', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await writeFile(join(outside, 'secret.js'), SOURCE);
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        if (!await tryLink(join(outside, 'secret.js'), join(dir, 'link.js'))) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const result = await runOn(dir, ['link.js']);

        assert.equal(await readFile(join(outside, 'secret.js'), 'utf8'), SOURCE, 'the outside file keeps its bytes');
        assert.equal((await lstat(join(dir, 'link.js'))).isSymbolicLink(), true);
        assert.deepEqual(result.changedFiles, []);
        assert.ok(result.report.skipped().some(entry => entry.file === 'link.js'
          && /outside the project directory/.test(entry.message)), JSON.stringify(result.report.entries));
        assert.equal(result.report.entries.filter(entry => entry.severity === 'changed').length, 0,
          'an edit that was not made is not reported as made');
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('does not write into a directory link that leads outside the project', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await writeFile(join(outside, 'inner.js'), SOURCE);
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        if (!await tryLink(outside, join(dir, 'linked'), 'dir')) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const result = await runOn(dir, ['linked/inner.js']);

        assert.equal(await readFile(join(outside, 'inner.js'), 'utf8'), SOURCE);
        assert.deepEqual(result.changedFiles, []);
        assert.ok(result.report.skipped().some(entry => entry.file === 'linked/inner.js'));
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('still writes a regular file of the same list', async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      const result = await runOn(dir, ['a.js']);

      assert.deepEqual(result.changedFiles, ['a.js']);
      assert.doesNotMatch(await readFile(join(dir, 'a.js'), 'utf8'), /correctFormat: true/);
    });
  });

  it('refuses a file that became a link between the read and the write', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await writeFile(join(outside, 'secret.js'), 'secret\n');
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        let linked = false;
        const result = await run({
          cwd: dir,
          ...RANGE,
          hooks: {
            beforeRename: async(file) => {
              await rm(join(dir, file));
              linked = await tryLink(join(outside, 'secret.js'), join(dir, file));
            },
          },
        });

        if (!linked) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        assert.equal(await readFile(join(outside, 'secret.js'), 'utf8'), 'secret\n');
        assert.equal((await lstat(join(dir, 'a.js'))).isSymbolicLink(), true, 'the link was not replaced');
        assert.ok(result.report.has('write-error'));
        assert.deepEqual(await leftovers(dir), []);
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('migrates a project that is reached through another spelling of its path, as a short name or a link is', async(context) => {
    const holder = await mkdtemp(join(tmpdir(), 'codemod-alias-'));

    try {
      await inPlainProject({ 'a.js': SOURCE, 'src/b.js': SOURCE }, async(dir) => {
        const alias = join(holder, 'alias');

        if (!await tryLink(dir, alias, 'dir')) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const result = await run({ cwd: alias, ...RANGE });

        assert.deepEqual(result.changedFiles.sort(), ['a.js', 'src/b.js']);
        assert.equal(result.report.has('write-error'), false, JSON.stringify(result.report.entries));
        assert.equal(result.exitCode, 0);

        for (const name of ['a.js', 'src/b.js']) {
          assert.doesNotMatch(await readFile(join(dir, name), 'utf8'), /correctFormat: true/, name);
        }
      });
    } finally {
      await rm(holder, { recursive: true, force: true });
    }
  });
});

describe('the --report target as the file system sees it', () => {
  it('refuses a hard link to a migrated file', async(context) => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      try {
        await link(join(dir, 'a.js'), join(dir, 'report.md'));
      } catch {
        context.skip('this file system has no hard links');

        return;
      }

      const result = await run({ cwd: dir, ...RANGE, reportPath: 'report.md' });

      assert.equal(result.exitCode, 2);
      assert.match(result.error, /would overwrite a project file/);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
    });
  });

  it('refuses a file name that differs from a project file in letter case only, where the file system ignores case',
    async(context) => {
      await inPlainProject({ 'src/a.js': SOURCE }, async(dir) => {
        if (!existsSync(join(dir, 'src', 'A.JS'))) {
          context.skip('this file system tells src/a.js and src/A.JS apart');

          return;
        }

        const result = await run({ cwd: dir, ...RANGE, reportPath: 'src/A.JS' });

        assert.equal(result.exitCode, 2, JSON.stringify(result.error));
        assert.match(result.error, /would overwrite a project file/);
        assert.equal(await readFile(join(dir, 'src', 'a.js'), 'utf8'), SOURCE);
      });
    });

  it('refuses an existing file of a type the tool migrates, also when this run does not list it', async() => {
    // `.d.ts` files are left out of every run, and still a report has no business overwriting one.
    await inPlainProject({ 'a.js': SOURCE, 'types.d.ts': 'export {};\n' }, async(dir) => {
      const result = await run({ cwd: dir, ...RANGE, reportPath: 'types.d.ts' });

      assert.equal(result.exitCode, 2);
      assert.match(result.error, /existing file of a type the tool migrates/);
      assert.equal(await readFile(join(dir, 'types.d.ts'), 'utf8'), 'export {};\n');
    });
  });

  it('refuses a report below a symbolic link, not only a link as the last component', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        if (!await tryLink(outside, join(dir, 'reports'), 'dir')) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const result = await run({ cwd: dir, ...RANGE, reportPath: 'reports/r.md' });

        assert.equal(result.exitCode, 2);
        assert.match(result.error, /symbolic link, or sits below one \(reports\)/);
        assert.equal(existsSync(join(outside, 'r.md')), false, 'nothing was written through the link');
        assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE, 'and no file was migrated');
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('names the link by the path the user typed, not by a climb out of the project', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        if (!await tryLink(outside, join(dir, 'reports'), 'dir')) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const absolute = await run({ cwd: dir, ...RANGE, reportPath: join(dir, 'reports', 'r.md') });
        const relative = await run({ cwd: dir, ...RANGE, reportPath: join('sub', '..', 'reports', 'r.md') });

        assert.equal(absolute.exitCode, 2);
        assert.ok(absolute.error.includes(`(${join(dir, 'reports')})`), absolute.error);
        assert.equal(relative.exitCode, 2);
        assert.ok(relative.error.includes('(reports)'), relative.error);

        for (const result of [absolute, relative]) {
          assert.doesNotMatch(result.error, /\.\.[\\/]/);
        }

        assert.equal(existsSync(join(outside, 'r.md')), false, 'nothing was written through the link');
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('refuses a report that is spelled outside the project and lands inside it through a link', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        if (!await tryLink(dir, join(outside, 'alias'), 'dir')) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const result = await run({ cwd: dir, ...RANGE, reportPath: join(outside, 'alias', 'r.md') });

        assert.equal(result.exitCode, 2);
        assert.ok(result.error.includes(`(${join(outside, 'alias')})`), result.error);
        assert.equal(existsSync(join(dir, 'r.md')), false, 'nothing was written into the project');
        assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE, 'and no file was migrated');
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('refuses a report that is a link itself, outside the project too', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await writeFile(join(outside, 'other.md'), 'keep\n');

      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        if (!await tryLink(join(outside, 'other.md'), join(outside, 'r.md'))) {
          context.skip('this platform cannot make a symbolic link');

          return;
        }

        const result = await run({ cwd: dir, ...RANGE, reportPath: join(outside, 'r.md') });

        assert.equal(result.exitCode, 2);
        assert.ok(result.error.includes(`(${join(outside, 'r.md')})`), result.error);
        assert.equal(await readFile(join(outside, 'other.md'), 'utf8'), 'keep\n');
        assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('accepts a report in a real directory of the project, and one that does not exist yet', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'reports/old.md': 'old\n' }, async(dir) => {
      await mkdir(join(dir, 'reports'), { recursive: true });

      const result = await run({ cwd: dir, ...RANGE, reportPath: 'reports/r.md' });

      assert.equal(result.exitCode, 0, result.error);
    });
  });
});
