import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveHotStylesId } from '../hot-styles-resolver.mjs';

/**
 * Creates a throwaway `handsontable/` package layout and runs the callback
 * against it. `files` are paths relative to the package root; each is
 * created with placeholder CSS content.
 *
 * @param {string[]} files - Files to create, relative to the fake package root.
 * @param {Function} run - Callback receiving the fake package root path.
 */
async function withFakeHotPackage(files, run) {
  const hotDir = await mkdtemp(join(tmpdir(), 'hot-styles-resolver-'));

  for (const file of files) {
    await mkdir(join(hotDir, dirname(file)), { recursive: true });
    await writeFile(join(hotDir, file), '/* css */');
  }

  try {
    await run(hotDir);
  } finally {
    await rm(hotDir, { recursive: true, force: true });
  }
}

test('prefers the built styles/ file when the build output exists', async() => {
  await withFakeHotPackage([
    'styles/ht-theme-main.min.css',
    'src/themes/static/css/theme/ht-theme-main.css',
  ], (hotDir) => {
    assert.equal(
      resolveHotStylesId('handsontable/styles/ht-theme-main.min.css', hotDir),
      join(hotDir, 'styles', 'ht-theme-main.min.css'),
    );
  });
});

test('falls back to the source theme CSS (stripping ".min") when styles/ is not built', async() => {
  await withFakeHotPackage([
    'src/themes/static/css/theme/ht-theme-main.css',
  ], (hotDir) => {
    assert.equal(
      resolveHotStylesId('handsontable/styles/ht-theme-main.min.css', hotDir),
      join(hotDir, 'src/themes/static/css/theme', 'ht-theme-main.css'),
    );
  });
});

test('resolves unminified theme imports to the same source file', async() => {
  await withFakeHotPackage([
    'src/themes/static/css/theme/ht-theme-horizon.css',
  ], (hotDir) => {
    assert.equal(
      resolveHotStylesId('handsontable/styles/ht-theme-horizon.css', hotDir),
      join(hotDir, 'src/themes/static/css/theme', 'ht-theme-horizon.css'),
    );
  });
});

test('falls back to the source icons CSS when the theme directory has no match', async() => {
  await withFakeHotPackage([
    'src/themes/static/css/icons/ht-icons-main.css',
  ], (hotDir) => {
    assert.equal(
      resolveHotStylesId('handsontable/styles/ht-icons-main.min.css', hotDir),
      join(hotDir, 'src/themes/static/css/icons', 'ht-icons-main.css'),
    );
  });
});

test('returns undefined when no local counterpart exists', async() => {
  await withFakeHotPackage([], (hotDir) => {
    assert.equal(
      resolveHotStylesId('handsontable/styles/ht-theme-main.min.css', hotDir),
      undefined,
    );
  });
});

test('ignores specifiers outside handsontable/styles/ and non-CSS imports', async() => {
  await withFakeHotPackage([
    'styles/ht-theme-main.min.css',
  ], (hotDir) => {
    assert.equal(resolveHotStylesId('handsontable', hotDir), undefined);
    assert.equal(resolveHotStylesId('handsontable/base', hotDir), undefined);
    assert.equal(resolveHotStylesId('handsontable/styles/ht-theme-main.min', hotDir), undefined);
    assert.equal(resolveHotStylesId('@handsontable/react-wrapper', hotDir), undefined);
  });
});

test('resolves every published theme entry point in the real monorepo (regression: #12890)', () => {
  // The docs dev server must resolve theme CSS to a local monorepo file even
  // when handsontable/styles/ (gitignored build output) has not been built;
  // returning undefined here is what let Vite fall through to the pnpm
  // virtual store copy of the published package.
  const hotDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', 'handsontable');
  const themeImports = [
    'handsontable/styles/ht-theme-main.min.css',
    'handsontable/styles/ht-theme-main.css',
    'handsontable/styles/ht-theme-horizon.min.css',
    'handsontable/styles/ht-theme-classic.min.css',
    'handsontable/styles/ht-icons-main.min.css',
  ];

  for (const id of themeImports) {
    const resolved = resolveHotStylesId(id, hotDir);

    assert.ok(resolved, `"${id}" must resolve to a local file, got ${resolved}`);
    assert.ok(
      resolved.startsWith(hotDir),
      `"${id}" resolved outside the workspace package: ${resolved}`,
    );
    assert.ok(
      !resolved.includes('node_modules'),
      `"${id}" resolved into an installed package copy: ${resolved}`,
    );
  }
});
