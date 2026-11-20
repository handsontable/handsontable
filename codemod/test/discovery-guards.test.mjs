import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { discover } from '../src/discover.mjs';
import { GitError, GitNotFoundError, dirtyPaths, gitExecutable, isGitRepo, listFiles } from '../src/git.mjs';
import { findExecutable } from '../src/lib/find-executable.mjs';
import { run } from '../src/runner.mjs';
import { GIT_ISOLATION, isolatedGitEnv } from './helpers/git-env.mjs';
import { IN_MONOREPO, skipWithoutFile } from './helpers/guide-source.mjs';
import { inPlainProject, migrate } from './helpers/plain-project.mjs';
import { git, writeFiles } from './helpers/sample-project.mjs';

const SOURCE = 'import Handsontable from \'handsontable\';\nnew Handsontable(el, { data: [], correctFormat: true });\n';
const CSS = 'a {\n  border-radius: var(--ht-wrapper-border-radius);\n}\n';
const CSS_DONE = 'a {\n  border-radius: var(--ht-border-radius);\n}\n';
const RANGE = { from: '17.1', to: '18.0' };
const POSIX = process.platform !== 'win32';

/**
 * Create a git repository with one commit under the temporary directory.
 *
 * @param {Record<string, string>} files File text by project-relative path.
 * @param {string} [prefix] Directory name prefix.
 * @returns {Promise<string>} The directory.
 */
async function repo(files, prefix = 'codemod-guards-') {
  const dir = await mkdtemp(join(tmpdir(), prefix));

  await writeFiles(dir, files);
  git(dir, ['init', '-q']);
  git(dir, ['add', '-A']);
  git(dir, ['commit', '-q', '-m', 'init']);

  return dir;
}

describe('findExecutable() resolves a program from PATH, never from the project', () => {
  /**
   * A file system that holds exactly these files. It records every path that was asked about.
   *
   * @param {string[]} files Absolute paths.
   * @returns {{isFile: (path: string) => Promise<boolean>, asked: string[]}} The probe and the log.
   */
  const fake = (files) => {
    const asked = [];

    return { asked,
      isFile: async(path) => {
        asked.push(path);

        return files.includes(path);
      } };
  };

  it('returns the first match of the directories of PATH, in order', async() => {
    const system = fake(['/usr/local/bin/git', '/usr/bin/git']);

    assert.equal(await findExecutable('git', { env: { PATH: '/opt/bin:/usr/local/bin:/usr/bin' },
      platform: 'linux',
      isFile: system.isFile }), '/usr/local/bin/git');
  });

  it('skips an empty and a relative entry, so the current directory is never searched', async() => {
    const system = fake(['/work/project/git', '/work/project/bin/git', '/usr/bin/git']);
    const found = await findExecutable('git', {
      env: { PATH: ':.:bin:./node_modules/.bin::/usr/bin' },
      platform: 'linux',
      isFile: system.isFile,
    });

    assert.equal(found, '/usr/bin/git');
    assert.deepEqual(system.asked, ['/usr/bin/git'], 'only the absolute entry was probed');
  });

  it('gives null when no directory holds the program', async() => {
    assert.equal(await findExecutable('git', { env: { PATH: '/usr/bin' }, platform: 'linux', isFile: fake([]).isFile }),
      null);
    assert.equal(await findExecutable('git', { env: {}, platform: 'linux', isFile: fake([]).isFile }), null);
  });

  it('on Windows reads Path in any case, and only starts what execFile can: .exe and .com', async() => {
    const system = fake(['C:\\tools\\git.cmd', 'C:\\tools\\git.bat', 'C:\\Git\\cmd\\git.exe', 'C:\\project\\git.exe']);
    const found = await findExecutable('git', {
      env: { Path: 'C:\\tools;"C:\\Git\\cmd"', pathext: '.COM;.EXE;.BAT;.CMD' },
      platform: 'win32',
      isFile: system.isFile,
    });

    assert.equal(found, 'C:\\Git\\cmd\\git.exe');
    assert.ok(!system.asked.some(path => path.startsWith('C:\\project')), 'the project directory was never probed');
  });

  it('on Windows skips a relative entry and falls back to .exe when PATHEXT names no direct extension', async() => {
    const system = fake(['.\\git.exe', 'C:\\project\\git.exe', 'C:\\Git\\git.exe']);

    assert.equal(await findExecutable('git', { env: { PATH: '.;;C:\\Git', PATHEXT: '.CMD' },
      platform: 'win32',
      isFile: system.isFile }), 'C:\\Git\\git.exe');
    assert.deepEqual(system.asked, ['C:\\Git\\git.exe']);
  });

  it('on a POSIX host needs the execute bit, and finds a real program', async() => {
    const found = await findExecutable('node');

    assert.ok(found && existsSync(found), String(found));
  });
});

describe('git runs from PATH, not from the project directory', () => {
  /**
   * Run a body with another `PATH`, then restore it.
   *
   * @param {string} value The new `PATH`.
   * @param {() => Promise<void>} body The body.
   * @returns {Promise<void>}
   */
  async function withPath(value, body) {
    const before = process.env.PATH;

    process.env.PATH = value;

    try {
      await body();
    } finally {
      process.env.PATH = before;
    }
  }

  it('does not run a program named git that sits in the project, although PATH names the current directory',
    { skip: !POSIX }, async(context) => {
      const real = await findExecutable('git');
      const project = await repo({ 'a.js': 'x\n' });
      const marker = join(project, 'ran');

      try {
        await writeFile(join(project, 'git'), `#!/bin/sh\ntouch '${marker}'\nexit 1\n`);
        await chmod(join(project, 'git'), 0o755);

        const path = ['.', '', dirname(real)].join(delimiter);

        // The control: a bare `git` with this PATH does run the project's program on this platform.
        try {
          execFileSync('git', ['--version'], { cwd: project, env: { ...process.env, PATH: path }, stdio: 'ignore' });
        } catch {
          // The program exits 1 on purpose.
        }

        if (!existsSync(marker)) {
          context.skip('this platform does not search a relative PATH entry from the working directory');

          return;
        }

        await rm(marker);

        await withPath(path, async() => {
          assert.equal(await isGitRepo(project), true, 'the real git answered');
          assert.equal((await listFiles(project)).includes('a.js'), true);
        });
        assert.equal(existsSync(marker), false, 'the project\'s program ran');
      } finally {
        await rm(project, { recursive: true, force: true });
      }
    });

  it('behaves as "not a git repository" when git is not on PATH and no .git entry stands above, and resolves once '
    + 'per PATH', async() => {
    const project = await repo({ 'a.js': 'x\n' });
    const plain = await mkdtemp(join(tmpdir(), 'codemod-guards-plain-'));

    try {
      await withPath(join(project, 'nowhere'), async() => {
        assert.equal(await gitExecutable(), null);
        assert.equal(await isGitRepo(plain), false);
      });
      assert.equal(await isGitRepo(project), true, 'the answer follows the PATH of the moment');
      assert.equal(await gitExecutable(), await gitExecutable(), 'one answer per PATH');
    } finally {
      await rm(project, { recursive: true, force: true });
      await rm(plain, { recursive: true, force: true });
    }
  });

  it('throws GitNotFoundError when git is not on PATH and a .git directory or file stands at or above the directory',
    async() => {
      const project = await repo({ 'src/a.js': 'x\n' });
      // The shape of a linked work tree and of a submodule: `.git` is a file.
      const linked = await mkdtemp(join(tmpdir(), 'codemod-guards-linked-'));

      try {
        await writeFile(join(linked, '.git'), 'gitdir: /elsewhere/.git/worktrees/linked\n');
        await mkdir(join(linked, 'packages', 'app'), { recursive: true });

        // The directory to ask from, and the directory that holds the `.git` entry.
        const cases = [
          [project, project],
          [join(project, 'src'), project],
          [linked, linked],
          [join(linked, 'packages', 'app'), linked],
        ];

        await withPath(join(project, 'nowhere'), async() => {
          for (const [directory, holder] of cases) {
            await assert.rejects(isGitRepo(directory), (error) => {
              assert.equal(error instanceof GitNotFoundError, true, directory);
              assert.equal(error instanceof GitError, true, 'a GitError too, so discover() walks the files');
              assert.match(error.message, /git was not found on PATH/);
              assert.equal(error.directory, holder);

              return true;
            });
          }
        });
      } finally {
        await rm(project, { recursive: true, force: true });
        await rm(linked, { recursive: true, force: true });
      }
    });
});

describe('no git program inside a repository is not the same as no repository', () => {
  const NO_GIT = join(tmpdir(), 'codemod-no-git-here');

  /**
   * Run a body with a `PATH` that holds no git.
   *
   * @param {() => Promise<void>} body The body.
   * @returns {Promise<void>}
   */
  async function withoutGit(body) {
    const before = process.env.PATH;

    process.env.PATH = NO_GIT;

    try {
      await body();
    } finally {
      process.env.PATH = before;
    }
  }

  it('refuses a run that writes, names git and --allow-dirty, and changes nothing', async() => {
    await inPlainProject({ 'a.css': CSS, '.git/HEAD': 'ref: refs/heads/main\n' }, async(dir) => {
      await withoutGit(async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

        assert.equal(result.status, 2, result.stdout + result.stderr);
        assert.match(result.stderr, /git was not found on PATH/);
        assert.match(result.stderr, /--allow-dirty/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);
      });
    });
  });

  it('refuses the same way for a .git file, and from a folder below the repository', async() => {
    await inPlainProject({ 'packages/app/a.css': CSS, '.git': 'gitdir: /elsewhere/.git/worktrees/x\n' }, async(dir) => {
      await withoutGit(async() => {
        const result = await migrate(join(dir, 'packages', 'app'), ['--from', '17.1', '--to', '18.0']);

        assert.equal(result.status, 2, result.stdout + result.stderr);
        assert.match(result.stderr, /git was not found on PATH/);
        assert.equal(await readFile(join(dir, 'packages', 'app', 'a.css'), 'utf8'), CSS);
      });
    });
  });

  it('runs without the check when --allow-dirty is passed, and says so', async() => {
    await inPlainProject({ 'a.css': CSS, '.git/HEAD': 'ref: refs/heads/main\n' }, async(dir) => {
      await withoutGit(async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--allow-dirty']);

        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stdout, /git was not found on PATH/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS_DONE);
      });
    });
  });

  it('previews on --dry-run, because nothing is written', async() => {
    await inPlainProject({ 'a.css': CSS, '.git/HEAD': 'ref: refs/heads/main\n' }, async(dir) => {
      await withoutGit(async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--dry-run']);

        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);
      });
    });
  });

  it('keeps the old behavior with no .git entry anywhere above: a project outside git, with the old warning', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      await withoutGit(async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stderr, /Not a git repository/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS_DONE);
      });
    });
  });
});

describe('a git that runs and fails is not the same as no repository', { skip: !POSIX }, () => {
  const DUBIOUS = 'fatal: detected dubious ownership in repository at \'/work/project\'\n'
    + 'To add an exception for this directory, call:\n\n\tgit config --global --add safe.directory /work/project';
  const NOT_A_REPO = 'fatal: not a git repository (or any of the parent directories): .git';

  /**
   * Run a body with a `git` on `PATH` that prints a message and exits with a code.
   *
   * @param {string} message What the fake git writes to standard error.
   * @param {number} code Its exit code.
   * @param {() => Promise<void>} body The body.
   * @returns {Promise<void>}
   */
  async function withFakeGit(message, code, body) {
    const bin = await mkdtemp(join(tmpdir(), 'codemod-fakegit-'));
    const before = process.env.PATH;

    try {
      // Only shell built-ins: `PATH` holds nothing but this directory.
      await writeFile(join(bin, 'message.txt'), `${message}\n`);
      await writeFile(join(bin, 'git'), '#!/bin/sh\nwhile IFS= read -r line; do printf \'%s\\n\' "$line" >&2; done '
        + `< "\${0%/*}/message.txt"\nexit ${code}\n`);
      await chmod(join(bin, 'git'), 0o755);
      process.env.PATH = bin;
      await body();
    } finally {
      process.env.PATH = before;
      await rm(bin, { recursive: true, force: true });
    }
  }

  it('isGitRepo() says false for "not a git repository" and throws what git said for any other failure', async() => {
    await withFakeGit(NOT_A_REPO, 128, async() => {
      assert.equal(await isGitRepo(tmpdir()), false);
    });
    await withFakeGit(DUBIOUS, 128, async() => {
      await assert.rejects(isGitRepo(tmpdir()), (error) => {
        assert.equal(error instanceof GitError, true);
        assert.match(error.message, /detected dubious ownership in repository at '\/work\/project'/);
        assert.match(error.message, /safe\.directory/);

        return true;
      });
    });
    await withFakeGit('', 3, async() => {
      await assert.rejects(isGitRepo(tmpdir()), /git exited with code 3/);
    });
  });

  it('refuses a run that writes, shows git\'s message, and changes nothing', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      await withFakeGit(DUBIOUS, 128, async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

        assert.equal(result.status, 2, result.stdout + result.stderr);
        assert.match(result.stderr, /git failed in this directory/);
        assert.match(result.stderr, /detected dubious ownership/);
        assert.match(result.stderr, /--allow-dirty/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);
      });
    });
  });

  it('runs without git when --allow-dirty is passed, and says so', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      await withFakeGit(DUBIOUS, 128, async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--allow-dirty']);

        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stdout, /git failed in this directory \(fatal: detected dubious ownership/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS_DONE);
      });
    });
  });

  it('previews without git on --dry-run, because nothing is written', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      await withFakeGit(DUBIOUS, 128, async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--dry-run']);

        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stdout, /git failed in this directory/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS);
      });
    });
  });

  it('still treats "not a git repository" as an ordinary project outside git, with the old warning', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      await withFakeGit(NOT_A_REPO, 128, async() => {
        const result = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

        assert.equal(result.status, 0, result.stdout + result.stderr);
        assert.match(result.stderr, /Not a git repository/);
        assert.equal(await readFile(join(dir, 'a.css'), 'utf8'), CSS_DONE);
      });
    });
  });
});

describe('a repository that git cannot read is not the same as no repository', () => {
  /**
   * Run a body with environment variables set, and put them back.
   *
   * @param {Record<string, string>} variables The variables.
   * @param {() => Promise<void>} body The body.
   * @returns {Promise<void>}
   */
  async function withVariables(variables, body) {
    const before = Object.fromEntries(Object.keys(variables).map(name => [name, process.env[name]]));

    Object.assign(process.env, variables);

    try {
      await body();
    } finally {
      for (const [name, value] of Object.entries(before)) {
        if (value === undefined) {
          delete process.env[name];
        } else {
          process.env[name] = value;
        }
      }
    }
  }

  /**
   * Run a body with a `git` on `PATH` whose interpreter does not exist, so that starting it fails.
   *
   * @param {() => Promise<void>} body The body.
   * @returns {Promise<void>}
   */
  async function withBrokenGit(body) {
    const bin = await mkdtemp(join(tmpdir(), 'codemod-brokengit-'));

    try {
      await writeFile(join(bin, 'git'), '#!/nonexistent/interpreter\n');
      await chmod(join(bin, 'git'), 0o755);
      await withVariables({ PATH: bin }, body);
    } finally {
      await rm(bin, { recursive: true, force: true });
    }
  }

  /**
   * Check that a run refuses, names git and `--allow-dirty`, and changes nothing, and that the same project still
   * runs with `--allow-dirty` and on `--dry-run`.
   *
   * @param {string} dir Project directory.
   * @param {string} file The file a rule would migrate, relative to `dir`.
   * @param {RegExp} said What the refusal says about git.
   * @returns {Promise<void>}
   */
  async function assertGuarded(dir, file, said) {
    const refused = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

    assert.equal(refused.status, 2, refused.stdout + refused.stderr);
    assert.match(refused.stderr, /git failed in this directory/);
    assert.match(refused.stderr, said);
    assert.match(refused.stderr, /--allow-dirty/);
    assert.doesNotMatch(refused.stderr, /Not a git repository/);
    assert.equal(await readFile(join(dir, file), 'utf8'), CSS, 'nothing was migrated');

    const preview = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--dry-run']);

    assert.equal(preview.status, 0, preview.stdout + preview.stderr);
    assert.equal(await readFile(join(dir, file), 'utf8'), CSS);

    const forced = await migrate(dir, ['--from', '17.1', '--to', '18.0', '--allow-dirty']);

    assert.equal(forced.status, 0, forced.stdout + forced.stderr);
    assert.equal(await readFile(join(dir, file), 'utf8'), CSS_DONE);
  }

  it('refuses a repository with a corrupt .git/HEAD, which git reports as "not a git repository"', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      await writeFile(join(project, '.git', 'HEAD'), 'this is not a reference\n');

      await assert.rejects(isGitRepo(project), (error) => {
        assert.equal(error instanceof GitError, true);
        assert.match(error.message, /holds a \.git entry/);

        return true;
      });
      await assertGuarded(project, 'a.css', /not a git repository, but .* holds a \.git entry/);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('refuses the same way from a folder below the repository', async() => {
    const project = await repo({ 'packages/app/a.css': CSS });

    try {
      await writeFile(join(project, '.git', 'HEAD'), 'this is not a reference\n');
      await assertGuarded(join(project, 'packages', 'app'), 'a.css', /holds a \.git entry/);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('refuses when GIT_COMMON_DIR names a directory that does not exist', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      await withVariables({ GIT_COMMON_DIR: join(project, 'no-such-common-dir') }, async() => {
        await assert.rejects(isGitRepo(project), /holds a \.git entry/);
        await assertGuarded(project, 'a.css', /holds a \.git entry/);
      });
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('refuses when git cannot be started because its interpreter is missing', { skip: !POSIX }, async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      await withBrokenGit(async() => {
        await assert.rejects(isGitRepo(project), (error) => {
          assert.equal(error instanceof GitError, true);
          assert.equal(error instanceof GitNotFoundError, false, 'git was found: it failed');
          assert.match(error.message, /git could not be started \(\w+\), and .* holds a \.git entry/);

          return true;
        });
        await assertGuarded(project, 'a.css', /git could not be started/);
      });
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('still treats a directory with no .git entry above it as outside git, whatever git says', { skip: !POSIX },
    async() => {
      await inPlainProject({ 'a.css': CSS }, async(dir) => {
        await withBrokenGit(async() => {
          assert.equal(await isGitRepo(dir), false);

          const result = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

          assert.equal(result.status, 0, result.stdout + result.stderr);
          assert.match(result.stderr, /Not a git repository/);
        });
        await withVariables({ GIT_COMMON_DIR: join(dir, 'no-such-common-dir') }, async() => {
          assert.equal(await isGitRepo(dir), false);
        });
      });
    });
});

describe('the clean-tree guard does not depend on the user\'s git configuration', () => {
  it('sees an untracked file although status.showUntrackedFiles is no', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      git(project, ['config', 'status.showUntrackedFiles', 'no']);
      await writeFile(join(project, 'new.css'), CSS);

      assert.deepEqual(await dirtyPaths(project), ['?? new.css']);

      const result = await migrate(project, ['--from', '17.1', '--to', '18.0']);

      assert.equal(result.status, 2, result.stdout + result.stderr);
      assert.match(result.stderr, /uncommitted change/);
      assert.equal(await readFile(join(project, 'a.css'), 'utf8'), CSS, 'nothing was migrated');
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('reads untracked files in a new directory one by one', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      await mkdir(join(project, 'fresh'));
      await writeFile(join(project, 'fresh', 'x.css'), CSS);

      assert.deepEqual(await dirtyPaths(project), ['?? fresh/x.css']);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('lists files by the ignore rules of git itself, the global file included', async() => {
    const project = await repo({ 'a.css': CSS, 'b.scss': CSS });

    try {
      await writeFile(join(project, 'global-ignore'), '*.scss\n');
      git(project, ['config', 'core.excludesFile', join(project, 'global-ignore')]);
      await writeFile(join(project, 'c.scss'), CSS);

      // Git hides c.scss in status, and the tool does not read it: the file list and the guard agree.
      assert.deepEqual(await dirtyPaths(project), ['?? global-ignore']);
      assert.deepEqual(await discover({ cwd: project }), ['a.css', 'b.scss']);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('runs every test that spawns git with an empty global and system configuration', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      const listing = execFileSync('git', ['config', '--list', '--show-origin'], {
        cwd: project,
        env: isolatedGitEnv(),
        encoding: 'utf8',
      });

      for (const line of listing.split('\n').filter(Boolean)) {
        assert.match(line, /^file:\.git\/config\t/, `a setting outside the repository: ${line}`);
      }

      assert.equal(process.env.GIT_CONFIG_GLOBAL, GIT_ISOLATION.GIT_CONFIG_GLOBAL);
      assert.equal(process.env.GIT_CONFIG_NOSYSTEM, '1');
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('is enforced: a test file that spawns git imports the isolation helper', async() => {
    const files = [
      ...(await readdir(new URL('.', import.meta.url))).filter(name => name.endsWith('.mjs')).map(name => ['.', name]),
      ...(await readdir(new URL('./helpers/', import.meta.url))).filter(name => name.endsWith('.mjs'))
        .map(name => ['helpers', name]),
    ];
    const missing = [];

    for (const [folder, name] of files) {
      const text = await readFile(new URL(`${folder}/${name}`, import.meta.url), 'utf8');

      const spawnsGit = /(?:execFileSync|spawnSync|execFile|spawn)\(\s*'git'/.test(text);

      if (spawnsGit && !/git-env\.mjs|isolatedGitEnv/.test(text)) {
        missing.push(`${folder}/${name}`);
      }
    }

    assert.deepEqual(missing, []);
  });
});

describe('a run that reads no file says so', () => {
  it('names the reason when a directory holds no file the tool reads, and still exits 0', async() => {
    await inPlainProject({ 'README.md': '# hi\n', 'docs/guide.md': 'x\n' }, async(dir) => {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.0', 'docs']);

      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stderr,
        /No files to migrate\. "docs" holds no source, style, template, or package\.json file/);
      assert.match(result.stdout, /No files to migrate/, 'the report says it too');
    });
  });

  it('names the reason for an explicit file of a type the tool does not read', async() => {
    await inPlainProject({ 'README.md': '# hi\n' }, async(dir) => {
      const result = await run({ cwd: dir, ...RANGE, paths: ['README.md'] });

      assert.equal(result.exitCode, 0);
      assert.ok(result.notes.some(note => /No files to migrate\. "README\.md" is not a type of file the tool reads\./
        .test(note)), JSON.stringify(result.notes));
      assert.ok(result.report.notes.length > 0);
    });
  });

  it('says that git ignores the directory, in a repository', async() => {
    const project = await repo({ '.gitignore': 'gen/\n', 'a.css': CSS });

    try {
      await mkdir(join(project, 'gen'));
      await writeFile(join(project, 'gen', 'x.css'), CSS);

      const result = await run({ cwd: project, ...RANGE, paths: ['gen'] });

      assert.equal(result.exitCode, 0);
      assert.ok(result.notes.some(note => /"gen" is ignored by git, and the tool reads no ignored file/.test(note)),
        JSON.stringify(result.notes));
      assert.equal(await readFile(join(project, 'gen', 'x.css'), 'utf8'), CSS);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('refuses an explicit file that git ignores, as it refuses the directory, and keeps its bytes', async() => {
    const project = await repo({ '.gitignore': 'gen/\nsecret.js\n', 'a.css': CSS });

    try {
      await mkdir(join(project, 'gen'));
      await writeFile(join(project, 'gen', 'x.css'), CSS);
      await writeFile(join(project, 'secret.js'), SOURCE);

      for (const file of ['gen/x.css', 'secret.js']) {
        const result = await run({ cwd: project, ...RANGE, paths: [file], allowDirty: true });

        assert.equal(result.exitCode, 0, file);
        assert.deepEqual(result.changedFiles, [], file);
        assert.ok(result.notes.some(note => note.includes(`"${file}" is ignored by git, and the tool reads no `
          + 'ignored file')), JSON.stringify(result.notes));
      }

      assert.equal(await readFile(join(project, 'gen', 'x.css'), 'utf8'), CSS);
      assert.equal(await readFile(join(project, 'secret.js'), 'utf8'), SOURCE);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('still reads an explicit file that git tracks although a pattern ignores it', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      await writeFile(join(project, '.gitignore'), 'forced.css\n');
      await writeFile(join(project, 'forced.css'), CSS);
      git(project, ['add', '-f', 'forced.css']);
      git(project, ['commit', '-q', '-m', 'forced']);

      const result = await run({ cwd: project, ...RANGE, paths: ['forced.css'], allowDirty: true });

      assert.deepEqual(result.changedFiles, ['forced.css']);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('refuses an explicit file below node_modules, in a repository and outside one', async() => {
    const files = {
      'node_modules/dep/package.json': '{ "dependencies": { "handsontable": "^17.1.0" } }\n',
      'node_modules/dep/index.js': SOURCE,
      'a.css': CSS,
    };
    const project = await repo(files);

    try {
      await inPlainProject(files, async(plain) => {
        for (const dir of [project, plain]) {
          for (const file of ['node_modules/dep/package.json', 'node_modules/dep/index.js']) {
            const result = await run({ cwd: dir, ...RANGE, paths: [file], allowDirty: true });

            assert.deepEqual(result.changedFiles, [], file);
            assert.ok(result.notes.some(note => /is below node_modules, and the tool reads no file there/.test(note)),
              JSON.stringify(result.notes));
          }

          assert.equal(await readFile(join(dir, 'node_modules/dep/index.js'), 'utf8'), SOURCE);
          assert.match(await readFile(join(dir, 'node_modules/dep/package.json'), 'utf8'), /\^17\.1\.0/);
        }
      });
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('does not add the note to a run that found a file', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      const result = await run({ cwd: dir, ...RANGE });

      assert.deepEqual(result.notes.filter(note => /No files to migrate/.test(note)), []);
    });
  });

  it('is still a usage error for a path that does not exist', async() => {
    await inPlainProject({ 'a.css': CSS }, async(dir) => {
      const result = await run({ cwd: dir, ...RANGE, paths: ['nope'] });

      assert.equal(result.exitCode, 2);
      assert.match(result.error, /"nope" does not exist/);
    });
  });

  it('reads a path argument in the letter case the file system stores, and says so', async(context) => {
    const project = await repo({ 'src/a.css': CSS });

    try {
      if (!existsSync(join(project, 'SRC'))) {
        context.skip('this file system tells src and SRC apart');

        return;
      }

      const result = await run({ cwd: project, ...RANGE, paths: ['SRC'] });

      assert.deepEqual(result.changedFiles, ['src/a.css']);
      assert.ok(result.notes.some(note => /"SRC" is spelled "src" on disk/.test(note)), JSON.stringify(result.notes));
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });
});

describe('a project that an outer repository ignores', () => {
  it('is walked instead of listed, because git lists nothing there, and the report says so', async() => {
    const outer = await repo({ '.gitignore': 'proj/\n', 'README.md': 'x\n' });

    try {
      const project = join(outer, 'proj');

      await writeFiles(project, { 'a.css': CSS, 'node_modules/x/b.css': CSS });

      const result = await run({ cwd: project, ...RANGE });

      assert.equal(result.exitCode, 0, result.error);
      assert.deepEqual(result.changedFiles, ['a.css']);
      assert.equal(await readFile(join(project, 'a.css'), 'utf8'), CSS_DONE);
      assert.equal(await readFile(join(project, 'node_modules', 'x', 'b.css'), 'utf8'), CSS, 'the walk skips it too');
      assert.ok(result.notes.some(note => /A \.gitignore above this directory ignores it/.test(note)
        && /git diff will not show what changed/.test(note)), JSON.stringify(result.notes));
      assert.ok(result.report.notes.some(note => /ignores it/.test(note)));
    } finally {
      await rm(outer, { recursive: true, force: true });
    }
  });

  it('is listed by git, as before, when it is not ignored', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      const result = await run({ cwd: project, ...RANGE });

      assert.deepEqual(result.notes.filter(note => /ignores it/.test(note)), []);
      assert.deepEqual(result.changedFiles, ['a.css']);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });
});

describe('a submodule or an embedded repository', () => {
  it('is named under "Skipped files", with the advice to run the tool inside it, and none of its files is read',
    async() => {
      const project = await repo({ 'a.css': CSS });

      try {
        await writeFiles(join(project, 'nested'), { 'b.css': CSS });
        git(join(project, 'nested'), ['init', '-q']);

        const result = await run({ cwd: project, ...RANGE, allowDirty: true });
        const entry = result.report.skipped().find(item => item.file === 'nested');

        assert.ok(entry, JSON.stringify(result.report.skipped()));
        assert.match(entry.message, /submodule or an embedded git repository.*Run the tool inside it/);
        assert.equal(await readFile(join(project, 'nested', 'b.css'), 'utf8'), CSS);
        assert.deepEqual(result.changedFiles, ['a.css']);
      } finally {
        await rm(project, { recursive: true, force: true });
      }
    });

  it('is named when it is a gitlink in the index with its directory present', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      const sha = git(project, ['rev-parse', 'HEAD']).trim();

      git(project, ['update-index', '--add', '--cacheinfo', `160000,${sha},vendor-sub`]);
      await mkdir(join(project, 'vendor-sub'));
      await writeFile(join(project, 'vendor-sub', 'c.css'), CSS);

      const result = await run({ cwd: project, ...RANGE, allowDirty: true });

      assert.ok(result.report.skipped().some(item => item.file === 'vendor-sub'),
        JSON.stringify(result.report.skipped()));
      assert.equal(await readFile(join(project, 'vendor-sub', 'c.css'), 'utf8'), CSS);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('is the reason when the path argument is the repository itself', async() => {
    const project = await repo({ 'a.css': CSS });

    try {
      await writeFiles(join(project, 'nested'), { 'b.css': CSS });
      git(join(project, 'nested'), ['init', '-q']);

      const result = await run({ cwd: project, ...RANGE, allowDirty: true, paths: ['nested'] });

      assert.deepEqual(result.changedFiles, []);
      assert.ok(result.report.skipped().some(item => item.file === 'nested'));
      assert.ok(result.notes.some(note => /No files to migrate/.test(note)));
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });
});

describe('a project outside git: the walk leaves build output and hidden folders alone, and says so', () => {
  const FILES = {
    'src/a.js': SOURCE,
    '.next/static/main.js': SOURCE,
    'out/bundle.js': SOURCE,
    '.storybook/preview.js': SOURCE,
    '.github/workflows/ci.yml': 'name: ci\n',
    'storybook-static/x.js': SOURCE,
  };

  it('migrates the source only, and names each skipped directory that held files it reads', async() => {
    await inPlainProject(FILES, async(dir) => {
      const result = await run({ cwd: dir, ...RANGE });

      assert.deepEqual(result.changedFiles, ['src/a.js']);

      const readable = ['.next/static/main.js', 'out/bundle.js', '.storybook/preview.js', 'storybook-static/x.js'];

      for (const skipped of readable) {
        assert.equal(await readFile(join(dir, skipped), 'utf8'), SOURCE, `${skipped} was rewritten`);
      }

      const names = result.report.skipped().map(item => item.file);

      assert.deepEqual(names, ['.next', '.storybook', 'out', 'storybook-static']);
      assert.match(result.report.skipped()[0].message, /To include it, name it: migrate \.next$/);
      assert.equal(names.includes('.github'), false, 'a directory with nothing the tool reads is not worth a line');
    });
  });

  it('does not name a skipped directory whose files sit only in a nested directory the walk skips too', async() => {
    await inPlainProject({
      'src/a.js': SOURCE,
      '.storybook/.cache/x.js': SOURCE,
      '.next/out/app.js': SOURCE,
      '.kept/nested/main.js': SOURCE,
    }, async(dir) => {
      const skipped = [];

      assert.deepEqual(await discover({ cwd: dir, skipped }), ['src/a.js']);
      assert.deepEqual(skipped.map(item => item.file), ['.kept'], 'naming .storybook or .next would read nothing');
      assert.deepEqual(await discover({ cwd: dir, paths: ['.storybook', '.next'], skipped: [] }), []);
      assert.deepEqual(await discover({ cwd: dir, paths: ['.kept'], skipped: [] }), ['.kept/nested/main.js']);
    });
  });

  it('reads one of them when the path argument names it', async() => {
    await inPlainProject(FILES, async(dir) => {
      const result = await run({ cwd: dir, ...RANGE, paths: ['.storybook', 'src'] });

      assert.deepEqual(result.changedFiles, ['.storybook/preview.js', 'src/a.js']);
      assert.deepEqual(result.report.skipped(), []);
    });
  });

  it('does not skip a hidden folder that git lists, because git has the ignore rules', async() => {
    const project = await repo({ 'src/a.js': SOURCE, '.storybook/preview.js': SOURCE });

    try {
      const result = await run({ cwd: project, ...RANGE });

      assert.deepEqual(result.changedFiles, ['.storybook/preview.js', 'src/a.js']);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });

  it('does not follow a link into a skipped directory, and does not crash on a dangling one', async(context) => {
    await inPlainProject({ 'src/a.js': SOURCE }, async(dir) => {
      try {
        await symlink(join(dir, 'nowhere'), join(dir, '.cache'), 'dir');
      } catch {
        context.skip('this platform cannot make a symbolic link');

        return;
      }

      const result = await run({ cwd: dir, ...RANGE });

      assert.deepEqual(result.changedFiles, ['src/a.js']);
    });
  });
});

describe('discovery checks a long list of files in batches', () => {
  it('finds every file and every link of a list longer than one batch, as a short list would', async(context) => {
    const files = {};

    for (let index = 0; index < 700; index += 1) {
      files[`src/f${String(index).padStart(4, '0')}.js`] = SOURCE;
    }

    await inPlainProject(files, async(dir) => {
      try {
        await symlink(join(dir, 'src', 'f0000.js'), join(dir, 'src', 'link-early.js'));
        await symlink(join(dir, 'src', 'f0699.js'), join(dir, 'src', 'link-late.js'));
      } catch {
        context.skip('this platform cannot make a symbolic link');

        return;
      }

      const skipped = [];
      const found = await discover({ cwd: dir, skipped });

      assert.deepEqual(found, Object.keys(files));
      assert.deepEqual(skipped.map(item => item.file).sort(), ['src/link-early.js', 'src/link-late.js']);
    });
  });
});

describe('a project outside git: a directory that cannot be read', () => {
  const unreadable = () => !POSIX || process.getuid?.() === 0;

  it('is skipped and named, and the other directories are still migrated', async(context) => {
    if (unreadable()) {
      context.skip('permissions cannot deny a read on this platform or for this user');

      return;
    }

    await inPlainProject({ 'src/a.js': SOURCE, 'locked/deep/b.js': SOURCE, 'zeta/c.js': SOURCE }, async(dir) => {
      await chmod(join(dir, 'locked'), 0o000);

      try {
        const result = await run({ cwd: dir, ...RANGE });

        assert.deepEqual(result.changedFiles, ['src/a.js', 'zeta/c.js']);

        const [entry, ...others] = result.report.skipped();

        assert.deepEqual(others, []);
        assert.equal(entry.file, 'locked');
        assert.match(entry.message,
          /^The tool could not read this directory \(EACCES\), so it skipped it and everything below it\./);
        assert.match(entry.message, /Fix the permissions and run the tool again\.$/);
        assert.doesNotMatch(entry.message, /migrate locked/, 'naming a directory the tool cannot read does not help');
      } finally {
        await chmod(join(dir, 'locked'), 0o755);
      }
    });
  });

  it('is a usage error that names the path and the reason when it is the directory the run starts from',
    async(context) => {
      if (unreadable()) {
        context.skip('permissions cannot deny a read on this platform or for this user');

        return;
      }

      await inPlainProject({ 'locked/b.js': SOURCE }, async(dir) => {
        await chmod(join(dir, 'locked'), 0o000);

        try {
          await assert.rejects(discover({ cwd: dir, paths: ['locked'] }), (error) => {
            assert.equal(error.name, 'UsageError');
            assert.match(error.message,
              /^"locked" could not be read: permission denied \(EACCES\)\. Fix the permissions/);

            return true;
          });

          const result = await run({ cwd: dir, ...RANGE, paths: ['locked'] });

          assert.equal(result.exitCode, 2);
          assert.match(result.error, /^"locked" could not be read: permission denied \(EACCES\)/);

          const cli = await migrate(dir, ['--from', '17.1', '--to', '18.0', 'locked']);

          assert.equal(cli.status, 2, cli.stdout + cli.stderr);
          assert.match(cli.stderr, /"locked" could not be read: permission denied \(EACCES\)/);
          assert.doesNotMatch(cli.stderr, /\n\s+at /, 'a stack trace reached the user');
        } finally {
          await chmod(join(dir, 'locked'), 0o755);
        }
      });
    });

  it('is a usage error for the default directory too, when the project directory cannot be listed', async(context) => {
    if (unreadable()) {
      context.skip('permissions cannot deny a read on this platform or for this user');

      return;
    }

    await inPlainProject({ 'a.js': SOURCE }, async(dir) => {
      await chmod(dir, 0o111);

      try {
        const cli = await migrate(dir, ['--from', '17.1', '--to', '18.0']);

        assert.equal(cli.status, 2, cli.stdout + cli.stderr);
        assert.match(cli.stderr, /The project directory could not be read: permission denied \(EACCES\)/);
        assert.doesNotMatch(cli.stderr, /\n\s+at /, 'a stack trace reached the user');
      } finally {
        await chmod(dir, 0o755);
      }
    });
  });

  it('is skipped by discover() with the error code for the report to name', async(context) => {
    if (unreadable()) {
      context.skip('permissions cannot deny a read on this platform or for this user');

      return;
    }

    await inPlainProject({ 'a/x.js': SOURCE, 'a/locked/y.js': SOURCE }, async(dir) => {
      await chmod(join(dir, 'a', 'locked'), 0o000);

      try {
        const skipped = [];
        const files = await discover({ cwd: dir, skipped });

        assert.deepEqual(files, ['a/x.js']);
        assert.deepEqual(skipped, [{ file: 'a/locked', kind: 'unreadable', reason: 'EACCES' }]);
      } finally {
        await chmod(join(dir, 'a', 'locked'), 0o755);
      }
    });
  });
});

describe('the tests read the monorepo files they depend on, or fail', () => {
  it('fails inside the monorepo when a file is missing, and passes for a file that is there', () => {
    assert.equal(IN_MONOREPO, true, 'this suite runs in the monorepo, where pnpm-workspace.yaml is two levels up');

    const context = { skip() {
      throw new Error('skipped');
    } };

    assert.throws(() => skipWithoutFile(context, join(tmpdir(), 'no-such-guide.md'), 'the guide'),
      /the guide is missing.*A file moved or was renamed/s);
    assert.equal(skipWithoutFile(context, fileURLToPath(new URL('docs-structure.test.mjs', import.meta.url)), 'a test'),
      false);
  });
});

describe('discovery drops a link to a file on its own, before the write-time check can', () => {
  it('lists neither a link to a file inside the project nor one outside it, in git and outside it', async(context) => {
    const outside = await mkdtemp(join(tmpdir(), 'codemod-outside-'));

    try {
      await writeFile(join(outside, 'target.css'), CSS);

      for (const inGit of [true, false]) {
        const files = { 'src/own.css': CSS };
        const project = inGit ? await repo(files) : await mkdtemp(join(tmpdir(), 'codemod-guards-'));

        try {
          if (!inGit) {
            await writeFiles(project, files);
          }

          try {
            await symlink(join(project, 'src', 'own.css'), join(project, 'src', 'inside.css'));
            await symlink(join(outside, 'target.css'), join(project, 'src', 'outside.css'));
          } catch {
            context.skip('this platform cannot make a symbolic link');

            return;
          }

          if (inGit) {
            git(project, ['add', '-A']);
            git(project, ['commit', '-q', '-m', 'links']);
          }

          const skipped = [];
          const found = await discover({ cwd: project, skipped });

          assert.deepEqual(found, ['src/own.css'], `in git: ${inGit}`);
          assert.deepEqual(skipped.map(item => item.file).sort(), ['src/inside.css', 'src/outside.css']);
        } finally {
          await rm(project, { recursive: true, force: true });
        }
      }
    } finally {
      await rm(outside, { recursive: true, force: true });
    }
  });
});

describe('a repository with a very large file list', () => {
  it('lists more files than a function call can take as arguments, and still migrates the real ones', async() => {
    const project = await repo({ 'real.css': CSS });
    const count = 150000;

    try {
      // Entries that point at the empty blob: the index lists them, and no file is created for any of them.
      const blob = execFileSync('git', ['hash-object', '-w', '--stdin'], {
        cwd: project,
        env: isolatedGitEnv(),
        encoding: 'utf8',
        input: '',
      }).trim();
      const lines = Array.from({ length: count }, (_, index) => `100644 ${blob}\tbulk/f${index}.css\n`).join('');

      execFileSync('git', ['update-index', '--add', '--index-info'], {
        cwd: project,
        env: isolatedGitEnv(),
        input: lines,
      });

      const files = await discover({ cwd: project });

      assert.deepEqual(files, ['real.css']);
    } finally {
      await rm(project, { recursive: true, force: true });
    }
  });
});
