import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { interruptedLine, main } from '../src/cli.mjs';
import { run } from '../src/runner.mjs';
import { isolatedGitEnv } from './helpers/git-env.mjs';

const BIN = fileURLToPath(new URL('../bin/handsontable-codemod.mjs', import.meta.url));
const SLOW_RENAME = fileURLToPath(new URL('./helpers/slow-rename.mjs', import.meta.url));
const CSS = 'a {\n  border-radius: var(--ht-wrapper-border-radius);\n}\n';
const FILE_COUNT = 30;

/**
 * Make a project of stylesheets that every run rewrites, plus a `package.json` that the run would bump, and commit it
 * when asked.
 *
 * @param {boolean} repo Whether to initialize a git repository and commit.
 * @returns {Promise<{dir: string, files: string[]}>} The directory and the names of the stylesheets.
 */
async function makeProject(repo) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-interrupt-'));
  const files = Array.from({ length: FILE_COUNT }, (_, index) => `styles/s${String(index).padStart(2, '0')}.css`);

  await mkdir(join(dir, 'styles'));
  await writeFile(join(dir, 'package.json'), '{ "dependencies": { "handsontable": "^17.1.0" } }\n');

  for (const file of files) {
    await writeFile(join(dir, file), CSS);
  }

  if (repo) {
    const env = isolatedGitEnv();
    const identity = ['-c', 'user.name=T', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false'];

    for (const args of [['init', '-q'], ['add', '-A'], [...identity, 'commit', '-q', '-m', 'init']]) {
      execFileSync('git', args, { cwd: dir, env, stdio: 'ignore' });
    }
  }

  return { dir, files };
}

/**
 * Sort the files of a project into those the tool rewrote and those it left as they were, and fail for any other text:
 * a file that is neither is half written.
 *
 * @param {string} dir The project.
 * @param {string[]} files The stylesheets.
 * @returns {Promise<{written: string[], untouched: string[]}>} The two groups.
 */
async function sortFiles(dir, files) {
  const written = [];
  const untouched = [];

  for (const file of files) {
    const text = await readFile(join(dir, file), 'utf8');

    if (text === CSS) {
      untouched.push(file);
    } else {
      assert.match(text, /var\(--ht-border-radius\)/, `${file} is neither the original nor migrated:\n${text}`);
      written.push(file);
    }
  }

  return { written, untouched };
}

describe('an interrupted run', () => {
  it('finishes the file it is on, starts no other, and leaves package.json alone', async() => {
    const { dir, files } = await makeProject(false);
    const controller = new AbortController();
    let renames = 0;

    try {
      const result = await run({
        cwd: dir,
        from: '17.1',
        to: '18.0',
        signal: controller.signal,
        hooks: {
          beforeRename: () => {
            renames += 1;

            // The signal arrives while the second file waits for its rename.
            if (renames === 2) {
              controller.abort();
            }
          },
        },
      });
      const { written, untouched } = await sortFiles(dir, files);

      assert.equal(result.interrupted, true);
      assert.equal(result.inGit, false);
      assert.equal(written.length, 2, 'the file in progress is finished, and no later file starts');
      assert.deepEqual(result.changedFiles, written);
      assert.equal(untouched.length, FILE_COUNT - 2);
      assert.equal(await readFile(join(dir, 'package.json'), 'utf8'),
        '{ "dependencies": { "handsontable": "^17.1.0" } }\n', 'the dependency pass is skipped');
      assert.deepEqual((await readdir(join(dir, 'styles'))).sort(), files.map(file => file.slice('styles/'.length)),
        'no temporary file is left behind');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('is a normal run when nothing asks it to stop', async() => {
    const { dir, files } = await makeProject(false);

    try {
      const result = await run({ cwd: dir, from: '17.1', to: '18.0', signal: new AbortController().signal });
      const { untouched } = await sortFiles(dir, files);

      assert.equal(result.interrupted, false);
      assert.equal(untouched.length, 0);
      assert.ok(result.changedFiles.includes('package.json'));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('with a signal that is already aborted writes nothing', async() => {
    const { dir, files } = await makeProject(false);

    try {
      const result = await run({ cwd: dir, from: '17.1', to: '18.0', signal: AbortSignal.abort() });

      assert.equal(result.interrupted, true);
      assert.deepEqual(result.changedFiles, []);
      assert.equal((await sortFiles(dir, files)).untouched.length, FILE_COUNT);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('prints one line on standard error, nothing on standard output, and exits with 130', async() => {
    const { dir } = await makeProject(true);
    let out = '';
    let err = '';

    try {
      const code = await main(['migrate', '--from', '17.1', '--to', '18.0'], {
        cwd: dir,
        stdout: (text) => {
          out += text;
        },
        stderr: (text) => {
          err += text;
        },
        signal: AbortSignal.abort(),
      });

      assert.equal(code, 130);
      assert.equal(out, '');
      assert.equal(err, 'Interrupted before the first file was written, so there is nothing to undo.\n');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it('says that a dry run wrote nothing', async() => {
    const { dir } = await makeProject(false);
    let out = '';
    let err = '';

    try {
      const code = await main(['migrate', '--from', '17.1', '--to', '18.0', '--dry-run'], {
        cwd: dir,
        stdout: (text) => {
          out += text;
        },
        stderr: (text) => {
          err += text;
        },
        signal: AbortSignal.abort(),
      });

      assert.equal(code, 130);
      assert.equal(out, '');
      assert.equal(err, 'Interrupted. --dry-run changes no file, so there is nothing to undo.\n');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('the line of an interrupted run', () => {
  const plain = { dryRun: false, allowDirty: false };

  it('counts the files and gives the undo that matches what a run can promise', () => {
    assert.equal(interruptedLine({ changedFiles: ['a.css'], inGit: true }, plain),
      'Interrupted after 1 file was written, so the migration is incomplete. To undo, run: git checkout -- .');
    assert.equal(interruptedLine({ changedFiles: ['a.css', 'b.css'], inGit: true }, plain),
      'Interrupted after 2 files were written, so the migration is incomplete. To undo, run: git checkout -- .');
  });

  it('does not offer git checkout where it would discard the edits of the user or there is no git', () => {
    const dirty = interruptedLine({ changedFiles: ['a.css'], inGit: true }, { ...plain, allowDirty: true });
    const noGit = interruptedLine({ changedFiles: ['a.css'], inGit: false }, plain);

    assert.match(dirty, /^Interrupted after 1 file was written, .* --allow-dirty, so git checkout -- \. would discard/);
    assert.match(noGit, /not a git repository, so restore the files from a backup\.$/);
    assert.equal(dirty.includes('\n') || noGit.includes('\n'), false, 'one line');
  });
});

// `kill('SIGINT')` ends a process on Windows without running its handler, so a signal from outside cannot be tested there.
const SIGNAL_SKIP = process.platform === 'win32' && 'Windows ends a process on SIGINT without letting it handle it';

describe('Ctrl-C of the executable', { skip: SIGNAL_SKIP }, () => {
  it('stops after the file in progress, names how many were written, and exits with 130', async() => {
    const { dir, files } = await makeProject(true);

    try {
      const args = ['--import', SLOW_RENAME, BIN, 'migrate', '--from', '17.1', '--to', '18.0'];
      const child = spawn(process.execPath, args, {
        cwd: dir,
        env: isolatedGitEnv({ CODEMOD_TEST_RENAME_DELAY_MS: '100' }),
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let out = '';
      let err = '';

      child.stdout.on('data', (chunk) => {
        out += chunk;
      });
      child.stderr.on('data', (chunk) => {
        err += chunk;
      });

      const exited = new Promise((resolve) => {
        child.on('close', (code, signal) => resolve({ code, signal }));
      });

      // Every write takes at least 100 ms, so the run cannot end before the first file is on disk and the signal is
      // sent: thirty files take three seconds.
      for (;;) {
        const changed = (await Promise.all(files.map(file => readFile(join(dir, file), 'utf8'))))
          .filter(text => text !== CSS).length;

        if (changed > 0) {
          break;
        }

        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });
      }

      child.kill('SIGINT');

      const { code, signal } = await exited;
      const { written, untouched } = await sortFiles(dir, files);

      assert.equal(signal, null, 'the process ended by itself');
      assert.equal(code, 130);
      assert.equal(out, '');
      assert.ok(written.length >= 1 && untouched.length >= 1,
        `written ${written.length}, untouched ${untouched.length}`);
      assert.equal(err.trim().split('\n').length, 1, `one line on standard error:\n${err}`);
      assert.equal(err, `Interrupted after ${written.length} file${written.length === 1 ? ' was' : 's were'} written, `
        + 'so the migration is incomplete. To undo, run: git checkout -- .\n');
      assert.equal(await readFile(join(dir, 'package.json'), 'utf8'),
        '{ "dependencies": { "handsontable": "^17.1.0" } }\n');
      assert.deepEqual((await readdir(join(dir, 'styles'))).sort(), files.map(file => file.slice('styles/'.length)),
        'no temporary file is left behind');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
