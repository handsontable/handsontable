import assert from 'node:assert/strict';
import { chmod, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';
import { git, writeFiles } from './helpers/sample-project.mjs';

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

  it('names the directory of a target outside the project as the user typed it, not as a ../../.. path', async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      const outside = join(tmpdir(), 'codemod-no-such-folder', 'deeper', 'r.md');
      const result = await migrate(dir, [...RANGE, '--report', outside, '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      const folder = join(tmpdir(), 'codemod-no-such-folder', 'deeper');

      assert.ok(result.stderr.includes(`--report ${outside}: the directory ${folder} does not exist.`), result.stderr);
      assert.doesNotMatch(result.stderr, /\.\.\//);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
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

describe('a file that git tracks is never overwritten by the report', () => {
  /**
   * Run a callback in a committed git repository with a tracked file the tool does not migrate.
   *
   * @param {Record<string, string>} files File text by project-relative path.
   * @param {(dir: string) => Promise<void>} body Test body.
   * @returns {Promise<void>}
   */
  async function inRepository(files, body) {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-tracked-'));

    try {
      await writeFiles(dir, files);
      git(dir, ['init', '-q']);
      git(dir, ['add', '-A']);
      git(dir, ['commit', '-q', '-m', 'init']);
      await body(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  const FILES = { 'a.js': SOURCE, LICENSE: 'the license\n', 'notes.txt': 'my notes\n', 'docs/guide.txt': 'a guide\n' };

  for (const target of ['LICENSE', 'notes.txt', './notes.txt', 'docs/guide.txt']) {
    it(`refuses --report ${target}, exits 2, and changes no byte`, async() => {
      await inRepository(FILES, async(dir) => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--report', target, '.']);

        assert.equal(result.status, 2, result.stdout + result.stderr);
        assert.match(result.stderr, /would overwrite a project file/);

        for (const [name, text] of Object.entries(FILES)) {
          assert.equal(await readFile(join(dir, name), 'utf8'), text, name);
        }
      });
    });
  }

  it('refuses an absolute path to a tracked file', async() => {
    await inRepository(FILES, async(dir) => {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--report', join(dir, 'notes.txt'), '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /would overwrite a project file/);
      assert.equal(await readFile(join(dir, 'notes.txt'), 'utf8'), FILES['notes.txt']);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
    });
  });

  it('refuses the same file in another letter case on a case-insensitive file system', async(context) => {
    await inRepository(FILES, async(dir) => {
      if (!existsSync(join(dir, 'notes.TXT'))) {
        context.skip('this file system tells notes.txt from notes.TXT');

        return;
      }

      const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--report', 'notes.TXT', '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /would overwrite a project file/);
      assert.equal(await readFile(join(dir, 'notes.txt'), 'utf8'), FILES['notes.txt']);
    });
  });

  it('writes a report next to the tracked files when the target is new', async() => {
    await inRepository(FILES, async(dir) => {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--report', 'migration-report.md', '.']);

      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.match(await readFile(join(dir, 'migration-report.md'), 'utf8'), /^# Handsontable migration report/);
      assert.equal(await readFile(join(dir, 'notes.txt'), 'utf8'), FILES['notes.txt']);
    });
  });
});

describe('a link outside the project does not block the report', () => {
  it('writes the report below a link that lies outside the project, as /tmp does on macOS', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await mkdir(join(outside, 'real'));

      try {
        await symlink(join(outside, 'real'), join(outside, 'linked'), 'dir');
      } catch {
        context.skip('this platform cannot make a symbolic link');

        return;
      }

      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        const report = join(outside, 'linked', 'r.md');
        const result = await migrate(dir, [...RANGE, '--report', report, '.']);

        assert.equal(result.status, 0, result.stderr);
        assert.match(await readFile(join(outside, 'real', 'r.md'), 'utf8'), /^# Handsontable migration report/);
        assert.notEqual(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE, 'the file was migrated');
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
});

describe('a report that cannot be written', () => {
  it('is refused before any file changes when it exists and is read-only', { skip: !CAN_BLOCK_WRITES }, async() => {
    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      await writeFile(join(dir, 'r.md'), 'old report');
      await chmod(join(dir, 'r.md'), 0o444);

      const result = await migrate(dir, [...RANGE, '--report', 'r.md', '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /--report r\.md exists and is not writable/);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
      assert.equal(await readFile(join(dir, 'r.md'), 'utf8'), 'old report');
    });
  });

  it('after the run (the disk fills up) prints the summary and the next steps, names the file on stderr, and exits 1',
    async() => {
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        const failing = async() => {
          throw Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' });
        };
        const result = await migrate(dir, [...RANGE, '--report', 'r.md', '.'], { writeReport: failing });

        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.match(result.stdout, /Summary: 1 file changed/);
        assert.match(result.stdout, /Next: /);
        assert.match(result.stderr, /Could not write the report to r\.md: EACCES/);
        assert.doesNotMatch(result.stderr, /\n\s+at /, 'a stack trace reached the user');
        assert.doesNotMatch(await readFile(join(dir, 'a.js'), 'utf8'), /correctFormat: true/);
      });
    });
});

describe('the report replaces only a previous report', () => {
  const HEADER = '# Handsontable migration report: 17.1 to 18.0 (2026-01-01)\n\nold body\n';

  it('replaces an existing file whose first line is the report header', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'r.md': HEADER }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--report', 'r.md', '.']);

      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(await readFile(join(dir, 'r.md'), 'utf8'), /old body/);
    });
  });

  it('replaces an existing report that starts with a byte order mark or ends its lines with CRLF', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'r.md': `\uFEFF${HEADER.replace(/\n/g, '\r\n')}` }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--report', 'r.md', '.']);

      assert.equal(result.status, 0, result.stderr);
      assert.doesNotMatch(await readFile(join(dir, 'r.md'), 'utf8'), /old body/);
    });
  });

  it('replaces an existing empty file', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'r.md': '' }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--report', 'r.md', '.']);

      assert.equal(result.status, 0, result.stderr);
      assert.match(await readFile(join(dir, 'r.md'), 'utf8'), /^# Handsontable migration report/);
    });
  });

  for (const target of ['notes.txt', 'out/f.txt', 'data.bin']) {
    it(`refuses an existing file that is not a report (${target}), exits 2, and changes no byte`, async() => {
      const text = target === 'data.bin' ? Buffer.from([0, 1, 2, 255]) : 'my notes\n';

      await inPlainProject({ 'a.js': SOURCE, [target]: text }, async(dir) => {
        const result = await migrate(dir, [...RANGE, '--report', target, '.']);

        assert.equal(result.status, 2, result.stdout + result.stderr);
        assert.match(result.stderr, new RegExp(`--report ${target.replace('.', '\\.')} exists and is not a report`));
        assert.deepEqual(await readFile(join(dir, target)), Buffer.from(text));
        assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE, 'a file was migrated');
      });
    });
  }

  it('refuses a file whose header is not on its first line', async() => {
    await inPlainProject({ 'a.js': SOURCE, 'notes.txt': `intro\n${HEADER}` }, async(dir) => {
      const result = await migrate(dir, [...RANGE, '--report', 'notes.txt', '.']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.equal(await readFile(join(dir, 'notes.txt'), 'utf8'), `intro\n${HEADER}`);
    });
  });

  it('refuses an existing file outside the project that is not a report, and keeps it', async() => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await writeFile(join(outside, 'f.txt'), 'precious\n');
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        const result = await migrate(dir, [...RANGE, '--report', join(outside, 'f.txt'), '.']);

        assert.equal(result.status, 2, result.stdout + result.stderr);
        assert.match(result.stderr, /exists and is not a report/);
        assert.equal(await readFile(join(outside, 'f.txt'), 'utf8'), 'precious\n');
        assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('writes a new report outside the project, and replaces a previous one there', async() => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
        const target = join(outside, 'r.md');

        assert.equal((await migrate(dir, [...RANGE, '--report', target, '.'])).status, 0);
        assert.match(await readFile(target, 'utf8'), /^# Handsontable migration report/);
        await writeFile(join(dir, 'b.js'), SOURCE);
        assert.equal((await migrate(dir, [...RANGE, '--report', target, '.'])).status, 0);
      });
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });

  it('refuses a target inside .git, new or existing, and leaves the repository alone', async() => {
    const dir = await mkdtemp(join(tmpdir(), 'codemod-gitdir-'));

    try {
      await writeFiles(dir, { 'a.js': SOURCE });
      git(dir, ['init', '-q']);

      const config = await readFile(join(dir, '.git', 'config'), 'utf8');

      for (const target of ['.git/config', '.git/new-report.md', './.git/config', 'sub/../.git/config']) {
        const result = await migrate(dir, [...RANGE, '--report', target, '.']);

        assert.equal(result.status, 2, `${target}: ${result.stdout}${result.stderr}`);
        assert.match(result.stderr, /inside the \.git directory/, target);
      }

      assert.equal(await readFile(join(dir, '.git', 'config'), 'utf8'), config);
      assert.equal(existsSync(join(dir, '.git', 'new-report.md')), false);
      assert.equal(await readFile(join(dir, 'a.js'), 'utf8'), SOURCE);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
