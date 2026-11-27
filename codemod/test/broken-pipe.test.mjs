import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { BIN, inPlainProject } from './helpers/plain-project.mjs';

const CSS = 'a {\n  border-radius: var(--ht-wrapper-border-radius);\n}\n';

/**
 * Run the executable in a project and close the read end of its standard output at once, as `| head -1` does after
 * the first line. The tool needs far longer than that to reach its first write, so the write meets a closed pipe.
 *
 * @param {string} dir Project directory.
 * @param {string[]} args Arguments after `migrate`.
 * @returns {Promise<{code: number|null, stderr: string}>} Exit code and what the tool wrote to standard error.
 */
function runWithClosedStdout(dir, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN, 'migrate', ...args], { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';

    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.stdout.destroy();
    child.on('error', reject);
    child.on('close', code => resolve({ code, stderr }));
  });
}

describe('a reader of standard output that closes early', () => {
  const files = { 'package.json': '{ "dependencies": { "handsontable": "^17.1.0" } }\n', 'a.css': CSS, 'b.css': CSS };

  it('ends a dry run quietly with the exit code of the run', async() => {
    await inPlainProject(files, async(dir) => {
      const { code, stderr } = await runWithClosedStdout(dir, ['--from', '17.1', '--to', '18.0', '--dry-run']);

      assert.doesNotMatch(stderr, /EPIPE|Unhandled|at .*\.mjs/, stderr);
      assert.equal(code, 0);
    });
  });

  it('does not turn a run that wrote every file into a failure', async() => {
    await inPlainProject(files, async(dir) => {
      const { code, stderr } = await runWithClosedStdout(dir, ['--from', '17.1', '--to', '18.0']);

      assert.doesNotMatch(stderr, /EPIPE|Unhandled|at .*\.mjs/, stderr);
      assert.equal(code, 0);

      for (const file of ['a.css', 'b.css']) {
        assert.match(await readFile(join(dir, file), 'utf8'), /var\(--ht-border-radius\)/);
      }

      assert.match(await readFile(join(dir, 'package.json'), 'utf8'), /\^18\.0\.0/);
    });
  });
});
