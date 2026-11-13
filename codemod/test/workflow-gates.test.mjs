import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT } from '../src/manifest.mjs';

const WORKFLOWS = join(PACKAGE_ROOT, '..', '.github', 'workflows');
const CHECKS = join(WORKFLOWS, 'checks.yml');
const LINT = join(WORKFLOWS, 'lint.yml');

/**
 * The lines of a YAML file from a line that matches a pattern to the next line that is indented no deeper than it.
 *
 * @param {string} text The file text.
 * @param {RegExp} start Matches the first line.
 * @returns {string} The block, or an empty string when no line matches.
 */
function blockFrom(text, start) {
  const lines = text.split('\n');
  const first = lines.findIndex(line => start.test(line));

  if (first === -1) {
    return '';
  }

  const indent = lines[first].match(/^ */)[0].length;
  const rest = lines.slice(first + 1);
  const length = rest.findIndex(line => line.trim() !== '' && line.match(/^ */)[0].length <= indent);

  return [lines[first], ...(length === -1 ? rest : rest.slice(0, length))].join('\n');
}

describe('the workflows that run the codemod suite', { skip: !existsSync(CHECKS) }, () => {
  it('runs the Windows and Node matrix when the lockfile changes, not only when the package does', async() => {
    const filter = blockFrom(await readFile(CHECKS, 'utf8'), /^\s+test-codemod:\s*$/);

    assert.match(filter, /'\.\/codemod\/\*\*'/);
    assert.match(filter, /'\.\/pnpm-lock\.yaml'/);
  });

  it('runs the suite of the core job only when the codemod scope changed', async() => {
    const lint = await readFile(LINT, 'utf8');
    const step = blockFrom(lint, /^\s+- name: Codemod tests\s*$/);

    assert.match(step, /if: inputs\.run-codemod/, 'the step of the core job must be gated');
    assert.match(step, /npm run test --prefix codemod/);
  });

  it('keeps the matrix job on the same gate, with the Node versions the package supports', async() => {
    const lint = await readFile(LINT, 'utf8');
    const job = blockFrom(lint, /^ {2}codemod:\s*$/);
    const engines = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8')).engines.node;

    assert.match(job, /if: inputs\.run-codemod/);
    assert.match(job, /os: windows-/);
    assert.equal(engines, '>=20');
    assert.match(job, /node: 20\b/);
    assert.match(job, /node: 24\b/);
  });
});
