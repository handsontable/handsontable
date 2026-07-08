import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { rewriteVersionedPaths } from '../rewriteVersionedPaths.mjs';

async function withFixtureDir(files, run) {
  const dir = await mkdtemp(join(tmpdir(), 'rewrite-versioned-paths-'));

  try {
    for (const [relativePath, content] of Object.entries(files)) {
      const filePath = join(dir, relativePath);
      await mkdir(join(filePath, '..'), { recursive: true });
      await writeFile(filePath, content, 'utf-8');
    }

    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('rewrites root-relative href/src references with the version prefix', async () => {
  await withFixtureDir(
    {
      'javascript-data-grid/index.html':
        '<a href="/docs/react-data-grid/installation/">React</a>' +
        '<script src="/docs/_astro/chunk.js"></script>',
    },
    async (dir) => {
      const changedCount = await rewriteVersionedPaths(dir, '17.1');
      const content = await readFile(join(dir, 'javascript-data-grid/index.html'), 'utf-8');

      assert.equal(changedCount, 1);
      assert.match(content, /href="\/docs\/17\.1\/react-data-grid\/installation\/"/);
      assert.match(content, /src="\/docs\/17\.1\/_astro\/chunk\.js"/);
    }
  );
});

test('leaves fully-qualified URLs untouched, even ones containing "/docs/"', async () => {
  const original = '<a href="https://handsontable.com/docs/data/common.json">live data</a>';

  await withFixtureDir({ 'index.html': original }, async (dir) => {
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, 'index.html'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, original);
  });
});

test('is idempotent: does not double-prefix already-versioned paths', async () => {
  const alreadyPrefixed = '<a href="/docs/17.1/react-data-grid/installation/">React</a>';

  await withFixtureDir({ 'index.html': alreadyPrefixed }, async (dir) => {
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, 'index.html'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, alreadyPrefixed);
  });
});

test('only touches .html files', async () => {
  const original = '{"href": "/docs/react-data-grid/installation/"}';

  await withFixtureDir({ 'data/common.json': original }, async (dir) => {
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, 'data/common.json'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, original);
  });
});

test('rewrites references nested in subdirectories', async () => {
  await withFixtureDir(
    {
      'react-data-grid/installation/index.html': '<a href="/docs/angular-data-grid/installation/">Angular</a>',
    },
    async (dir) => {
      const changedCount = await rewriteVersionedPaths(dir, '9.0');
      const content = await readFile(join(dir, 'react-data-grid/installation/index.html'), 'utf-8');

      assert.equal(changedCount, 1);
      assert.match(content, /href="\/docs\/9\.0\/angular-data-grid\/installation\/"/);
    }
  );
});
