import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { buildManifest, hashContent, writeManifest } from '../utils/manifest.mjs';

/**
 * Creates a temporary directory with the given files.
 *
 * @param {Record<string, string>} files Relative path to content.
 * @returns {string} The directory.
 */
function makeTree(files) {
  const dir = mkdtempSync(join(tmpdir(), 'ht-theme-manifest-'));

  Object.entries(files).forEach(([file, content]) => {
    const fullPath = join(dir, file);

    mkdirSync(join(fullPath, '..'), { recursive: true });
    writeFileSync(fullPath, content);
  });

  return dir;
}

test('buildManifest hashes every file recursively, keyed by a sorted relative path', (t) => {
  const dir = makeTree({
    'variables/tokens/main.ts': 'const a = 1;\n',
    'css/theme/ht-theme-main.css': '.a { color: red; }\n',
  });

  t.after(() => rmSync(dir, { recursive: true }));

  const manifest = buildManifest(dir);

  assert.deepEqual(Object.keys(manifest), ['css/theme/ht-theme-main.css', 'variables/tokens/main.ts']);
  assert.equal(manifest['variables/tokens/main.ts'], hashContent('const a = 1;\n'));
});

test('buildManifest skips dotfiles such as a .DS_Store that Finder creates', (t) => {
  const dir = makeTree({
    'css/.DS_Store': 'finder\n',
    '.hidden/a.css': 'x\n',
    'css/a.css': 'y\n',
  });

  t.after(() => rmSync(dir, { recursive: true }));

  assert.deepEqual(Object.keys(buildManifest(dir)), ['css/a.css']);
});

test('hashContent ignores CRLF line endings, so an autocrlf checkout matches the manifest', () => {
  assert.equal(hashContent('a\r\nb\r\n'), hashContent('a\nb\n'));
});

test('hashContent changes when one character of a value changes', () => {
  assert.notEqual(hashContent('--ht-a: #000000ff;\n'), hashContent('--ht-a: #000000fe;\n'));
});

test('writeManifest writes the manifest as JSON that buildManifest reproduces', (t) => {
  const dir = makeTree({ 'a.css': 'x\n' });
  const manifestPath = join(dir, '..', `${basename(dir)}.json`);

  t.after(() => {
    rmSync(dir, { recursive: true });
    rmSync(manifestPath);
  });

  writeManifest(dir, manifestPath);

  assert.deepEqual(JSON.parse(readFileSync(manifestPath, 'utf8')), buildManifest(dir));
});
