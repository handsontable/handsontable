import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { repoRoot } from '../lib/repo-root.mjs';

// `set-package-version.mjs` writes the release version onto the docs branch's
// `handsontable/package.json`. The load-bearing case (DEV-2925 review) is that
// writing a version the file ALREADY holds is a no-op that still exits 0 -- a
// fresh minor/major branch is cut from the tag and already records that version,
// and a false failure there blocks the whole docs push.

const SCRIPT = path.join(repoRoot(), '.github/scripts/set-package-version.mjs');

// A package.json shaped like handsontable's: the version line plus an inline
// single-line object, which a JSON round-trip would reflow.
const PKG = `{
  "name": "handsontable",
  "version": "18.1.0",
  "exports": {
    ".": { "import": "./index.mjs", "require": "./index.js" }
  }
}
`;

/**
 * @param {string} contents package.json contents.
 * @returns {{ dir: string, pkg: string }} Fixture dir and the package.json path.
 */
function fixture(contents = PKG) {
  const dir = mkdtempSync(path.join(tmpdir(), 'set-package-version-'));
  const pkg = path.join(dir, 'package.json');

  writeFileSync(pkg, contents);

  return { dir, pkg };
}

/**
 * @param {string[]} args Positional args after the script path.
 * @returns {{ status: number, stdout: string, stderr: string }}
 */
function run(args) {
  try {
    const stdout = execFileSync('node', [SCRIPT, ...args], { encoding: 'utf8' });

    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    return { status: error.status ?? 1, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

test('writes a new version, changing only the version line', () => {
  const { dir, pkg } = fixture();

  try {
    const result = run(['18.1.1', pkg]);

    assert.equal(result.status, 0, result.stderr);
    assert.equal(readFileSync(pkg, 'utf8'), PKG.replace('"version": "18.1.0"', '"version": "18.1.1"'));
    // The inline exports object is untouched -- proves no JSON reflow.
    assert.match(readFileSync(pkg, 'utf8'), /"import": "\.\/index\.mjs", "require": "\.\/index\.js"/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('is a clean no-op when the version already matches (a fresh minor/major branch)', () => {
  const { dir, pkg } = fixture();

  try {
    const result = run(['18.1.0', pkg]);

    // The regression: a bare `next === source` guard exits 1 here and blocks the
    // docs push on every x.y.0 release.
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /already at version 18\.1\.0/);
    assert.equal(readFileSync(pkg, 'utf8'), PKG);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fails when there is no version line', () => {
  const { dir, pkg } = fixture('{\n  "name": "handsontable"\n}\n');

  try {
    const result = run(['18.1.1', pkg]);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /no "version" line/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('fails on missing arguments', () => {
  const result = run([]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage:/);
});
