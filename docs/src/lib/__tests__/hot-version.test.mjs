import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveHotVersion } from '../hot-version.mjs';

async function withFakeMonorepo(version, run) {
  const root = await mkdtemp(join(tmpdir(), 'hot-version-'));
  const docsDir = join(root, 'docs');
  const hotDir = join(root, 'handsontable');

  await mkdir(docsDir);
  await mkdir(hotDir);

  if (version !== undefined) {
    await writeFile(join(hotDir, 'package.json'), JSON.stringify({ version }));
  }

  try {
    await run(docsDir);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test('reads the version from handsontable/package.json next to the docs dir', async() => {
  await withFakeMonorepo('17.1.0', (docsDir) => {
    assert.equal(resolveHotVersion(docsDir), '17.1.0');
  });
});

test('returns empty string when package.json is missing', async() => {
  await withFakeMonorepo(undefined, (docsDir) => {
    assert.equal(resolveHotVersion(docsDir), '');
  });
});

test('returns empty string when the docs dir itself does not exist', () => {
  assert.equal(resolveHotVersion('/nonexistent/path/docs'), '');
});

test('resolves the real monorepo version (regression: must not depend on the caller module location)', () => {
  // docsRootDir must be resolved by the CALLER against ITS OWN stable
  // location (e.g. astro.config.mjs, which Astro runs directly under Node
  // and never bundles/relocates), not derived from this test file's own
  // import.meta.url -- that would defeat the point of the regression check.
  const docsRootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

  assert.match(resolveHotVersion(docsRootDir), /^\d+\.\d+\.\d+/);
});
