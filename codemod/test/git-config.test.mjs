import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { dirtyPaths, isGitRepo, isTracked, listFiles } from '../src/git.mjs';
import { migrate } from './helpers/plain-project.mjs';
import { createSampleProject, git } from './helpers/sample-project.mjs';

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
    await rm(dir, { recursive: true, force: true });
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
      await rm(dir, { recursive: true, force: true });
    }
  });
});
