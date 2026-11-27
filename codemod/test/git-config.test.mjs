import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { dirtyPaths, isGitRepo, isTracked, listFiles } from '../src/git.mjs';
import { migrate } from './helpers/plain-project.mjs';
import { createSampleProject, git, removeSampleProject } from './helpers/sample-project.mjs';

// The configuration is shell text, which a Windows shell reads differently. The program only has to create a file.
const SKIP = process.platform === 'win32';

/**
 * A repository with a marker program in its own configuration for one key, and the path the program creates.
 *
 * @param {string} key The configuration key.
 * @returns {Promise<{dir: string, marker: string, cleanup: () => Promise<void>}>} The project and the marker path.
 */
async function projectWithProgram(key) {
  const dir = await createSampleProject();
  const outside = await mkdtemp(join(tmpdir(), 'codemod-marker-'));
  const marker = join(outside, 'ran');

  git(dir, ['config', key, `touch '${marker}'; echo`]);

  const cleanup = async() => {
    await rm(outside, { recursive: true, force: true });
    await removeSampleProject(dir);
  };

  return { dir, marker, cleanup };
}

describe('the configuration of the project runs no program', { skip: SKIP }, () => {
  it('core.fsmonitor does not run during --dry-run', async() => {
    const { dir, marker, cleanup } = await projectWithProgram('core.fsmonitor');

    try {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.1', '--dry-run']);

      assert.equal(result.status, 0, result.stderr);
      assert.equal(existsSync(marker), false, 'core.fsmonitor ran');
    } finally {
      await cleanup();
    }
  });

  it('core.fsmonitor does not run during a real run, which also checks the tree and the report target', async() => {
    const { dir, marker, cleanup } = await projectWithProgram('core.fsmonitor');

    try {
      const result = await migrate(dir, ['--from', '17.1', '--to', '18.1', '--report', 'migration-report.md']);

      assert.equal(result.status, 0, result.stderr + result.stdout);
      assert.equal(existsSync(marker), false, 'core.fsmonitor ran');
      assert.match(await readFile(join(dir, 'migration-report.md'), 'utf8'), /^# Handsontable migration report/);
    } finally {
      await cleanup();
    }
  });

  it('core.fsmonitor does not run for any git function of the tool', async() => {
    const { dir, marker, cleanup } = await projectWithProgram('core.fsmonitor');

    try {
      await writeFile(join(dir, 'untracked.js'), 'x\n');
      assert.equal(await isGitRepo(dir), true);
      assert.ok((await listFiles(dir)).includes('untracked.js'));
      assert.ok((await dirtyPaths(dir)).length > 0);
      assert.equal(await isTracked(dir, join(dir, 'untracked.js')), false);
      assert.equal(existsSync(marker), false, 'core.fsmonitor ran');
    } finally {
      await cleanup();
    }
  });

  it('core.pager and pager.status do not run', async() => {
    const { dir, marker, cleanup } = await projectWithProgram('core.pager');

    try {
      git(dir, ['config', 'pager.status', `touch '${marker}'; cat`]);
      await writeFile(join(dir, 'untracked.js'), 'x\n');
      await dirtyPaths(dir);
      assert.equal(existsSync(marker), false, 'a pager ran');
    } finally {
      await cleanup();
    }
  });

  it('still lists, tracks, and detects changes in a project that has no such configuration', async() => {
    const dir = await createSampleProject();

    try {
      await writeFile(join(dir, 'new.js'), 'x\n');

      assert.ok((await listFiles(dir)).includes('new.js'));
      assert.deepEqual((await dirtyPaths(dir)).map(line => line.slice(3)), ['new.js']);
      assert.equal(await isTracked(dir, join(dir, 'new.js')), false);
      assert.equal(await isTracked(dir, join(dir, 'package.json')), true);
    } finally {
      await removeSampleProject(dir);
    }
  });
});

describe('a run inside a git hook or with a stray repository variable still looks at the project', () => {
  /**
   * Set environment variables for the duration of a callback. The tool builds the environment of git from
   * `process.env` on every call, so the variables reach it, as they would from a hook.
   *
   * @param {Record<string, string>} variables Variables to set.
   * @param {() => Promise<void>} body Test body.
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
   * Make the other repository differ from the project, so a git that read it instead would call the project dirty.
   *
   * @param {string} other Project directory of the other repository.
   * @returns {Promise<void>}
   */
  async function commitWithoutPackage(other) {
    git(other, ['rm', '-q', 'package.json']);
    git(other, ['commit', '-q', '-m', 'drop the manifest']);
  }

  const SPELLINGS = [
    ['GIT_DIR', other => ({ GIT_DIR: join(other, '.git') })],
    ['GIT_WORK_TREE', other => ({ GIT_WORK_TREE: other })],
    ['GIT_INDEX_FILE', other => ({ GIT_INDEX_FILE: join(other, 'not-an-index') })],
  ];

  for (const [name, variables] of SPELLINGS) {
    it(`sees a dirty project and refuses it although ${name} points elsewhere`, async() => {
      const dir = await createSampleProject();
      const other = await createSampleProject();

      try {
        await commitWithoutPackage(other);
        await writeFile(join(other, 'not-an-index'), 'this is not a git index');
        await writeFile(join(dir, 'untracked.js'), 'x\n');

        await withVariables(variables(other), async() => {
          const result = await migrate(dir, ['--from', '17.1', '--to', '18.1']);

          assert.equal(result.status, 2, result.stdout + result.stderr);
          assert.match(result.stderr, /The git tree has 1 uncommitted change\./);
        });
      } finally {
        await removeSampleProject(dir);
        await removeSampleProject(other);
      }
    });

    it(`migrates a clean project without a note about a missing repository although ${name} points elsewhere`,
      async() => {
        const dir = await createSampleProject();
        const other = await createSampleProject();

        try {
          await commitWithoutPackage(other);
          await writeFile(join(other, 'not-an-index'), 'this is not a git index');

          await withVariables(variables(other), async() => {
            const result = await migrate(dir, ['--from', '17.1', '--to', '18.1']);

            assert.equal(result.status, 0, result.stdout + result.stderr);
            assert.doesNotMatch(result.stderr, /git repository|git failed/i);
            assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /"handsontable": "\^18\.1\.0"/);
          });
        } finally {
          await removeSampleProject(dir);
          await removeSampleProject(other);
        }
      });
  }
});
