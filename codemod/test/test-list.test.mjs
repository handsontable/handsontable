import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const PACKAGE_ROOT = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8'));
const testScript = pkg.scripts.test;

describe('the test script', () => {
  it('runs node --test with literal file paths only', () => {
    assert.match(testScript, /^node --test /);
    assert.doesNotMatch(testScript, /[*?[\]{}]/, 'a glob turns a missing file into a green "tests 0"');
  });

  it('names every test file in test/ and nothing else', async() => {
    const named = testScript.replace(/^node --test /, '').split(/\s+/).filter(Boolean);
    const onDisk = (await readdir(join(PACKAGE_ROOT, 'test')))
      .filter(name => name.endsWith('.test.mjs'))
      .map(name => `test/${name}`);

    assert.deepEqual([...named].sort(), [...onDisk].sort());
    assert.equal(new Set(named).size, named.length, 'a file is listed twice');
  });
});
