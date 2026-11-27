import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { PACKAGE_ROOT } from '../src/manifest.mjs';
import { skipWithoutFile } from './helpers/guide-source.mjs';

describe('the license of the package', () => {
  it('carries the license file of the repository, byte for byte', async(context) => {
    const root = join(PACKAGE_ROOT, '..', 'LICENSE.txt');

    if (skipWithoutFile(context, root, 'the LICENSE.txt of the repository')) {
      return;
    }

    const own = await readFile(join(PACKAGE_ROOT, 'LICENSE.txt'));

    assert.ok(own.equals(await readFile(root)), 'codemod/LICENSE.txt differs from the LICENSE.txt of the repository');
  });

  it('names the file in the license field and lists it in files', async() => {
    const manifest = JSON.parse(await readFile(join(PACKAGE_ROOT, 'package.json'), 'utf8'));

    assert.equal(manifest.license, 'SEE LICENSE IN LICENSE.txt');
    assert.ok(manifest.files.includes('LICENSE.txt'), 'files does not list LICENSE.txt');
  });
});
