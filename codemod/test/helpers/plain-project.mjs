import { spawnSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { main } from '../../src/cli.mjs';

export const BIN = fileURLToPath(new URL('../../bin/handsontable-codemod.mjs', import.meta.url));

/**
 * Run a callback in a temporary project that is not a git repository, and remove it afterwards.
 *
 * @param {Record<string, string|Uint8Array>} files File contents by relative path.
 * @param {(dir: string) => Promise<void>} body Test body.
 * @returns {Promise<void>}
 */
export async function inPlainProject(files, body) {
  const dir = await mkdtemp(join(tmpdir(), 'codemod-plain-'));

  try {
    for (const [name, content] of Object.entries(files)) {
      await mkdir(dirname(join(dir, name)), { recursive: true });
      await writeFile(join(dir, name), content);
    }

    await body(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

/**
 * Run the command line in this process, with the output captured. It is the same `main()` the executable calls, without
 * the cost of a new process for each case. `migrateBin()` runs the executable itself.
 *
 * @param {string} dir Working directory.
 * @param {string[]} args Arguments after `migrate`.
 * @returns {Promise<{status: number, stdout: string, stderr: string}>} Exit code and output.
 */
export async function migrate(dir, args) {
  let stdout = '';
  let stderr = '';
  const status = await main(['migrate', ...args], {
    cwd: dir,
    stdout: (text) => {
      stdout += text;
    },
    stderr: (text) => {
      stderr += text;
    },
    progress: false,
  });

  return { status, stdout, stderr };
}

/**
 * Run the real executable.
 *
 * @param {string} dir Working directory.
 * @param {string[]} args Arguments after `migrate`.
 * @returns {{status: number, stdout: string, stderr: string}} Exit code and output.
 */
export function migrateBin(dir, args) {
  const result = spawnSync(process.execPath, [BIN, 'migrate', ...args], { cwd: dir, encoding: 'utf8' });

  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
