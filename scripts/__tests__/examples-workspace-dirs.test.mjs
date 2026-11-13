import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { expandWorkspaceDirs } from '../../examples/scripts/workspace-dirs.mjs';

/**
 * The Angular examples' postinstall (`examples/scripts/link-packages.mjs`) links packages into every workspace
 * its framework `package.json` declares. The framework manifests use `"workspaces": ["*"]` so Dependabot can
 * expand them, and a raw `glob("*")` also returns the framework's own `package.json`, `package-lock.json`,
 * and `node_modules`, which made the linker write under those paths and fail the install.
 */

/**
 * Build a framework directory with two workspaces, a directory without a manifest, and the root files.
 *
 * @returns {string} The framework directory.
 */
function frameworkFixture() {
  const dir = mkdtempSync(path.join(tmpdir(), 'examples-workspaces-'));

  ['demo', 'basic-example'].forEach((name) => {
    mkdirSync(path.join(dir, name));
    writeFileSync(path.join(dir, name, 'package.json'), '{}');
  });
  mkdirSync(path.join(dir, 'assets'));
  mkdirSync(path.join(dir, 'node_modules'));
  writeFileSync(path.join(dir, 'node_modules', '.package-lock.json'), '{}');
  writeFileSync(path.join(dir, 'package.json'), '{}');
  writeFileSync(path.join(dir, 'package-lock.json'), '{}');

  return dir;
}

['*', '@(!(node_modules))/'].forEach((entry) => {
  test(`"${entry}" expands to the workspace directories only`, () => {
    const dir = frameworkFixture();

    try {
      const names = expandWorkspaceDirs(dir, entry).map(workspace => path.basename(workspace)).sort();

      assert.deepEqual(names, ['basic-example', 'demo']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
