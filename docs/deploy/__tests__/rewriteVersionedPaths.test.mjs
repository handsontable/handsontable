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

test('leaves non-html files outside _astro untouched', async () => {
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

// Verbatim excerpt of the frozen 17.1 image's `_astro/preload-helper.zilMZTQO.js`
// (DEV-3058, Sentry HANDSONTABLE-DOCS-22T).
const PRELOAD_HELPER_17_1 =
  'const h=(function(){return"modulepreload"})(),v=function(l){return"/docs/"+l},d={},' +
  'y=function(s,i,E){if(e=v(e),e in d)return;n.addEventListener("error",' +
  '()=>p(new Error(`Unable to preload CSS for ${e}`)))};export{y as _};';

test('rewrites the preload-helper base in _astro/*.js with the version prefix', async () => {
  await withFixtureDir({ '_astro/preload-helper.zilMZTQO.js': PRELOAD_HELPER_17_1 }, async (dir) => {
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, '_astro/preload-helper.zilMZTQO.js'), 'utf-8');

    assert.equal(changedCount, 1);
    assert.equal(
      content,
      PRELOAD_HELPER_17_1.replace('v=function(l){return"/docs/"+l}', 'v=function(l){return"/docs/17.1/"+l}')
    );
  });
});

test('is idempotent on the preload-helper base', async () => {
  await withFixtureDir({ '_astro/preload-helper.js': PRELOAD_HELPER_17_1 }, async (dir) => {
    await rewriteVersionedPaths(dir, '17.1');
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, '_astro/preload-helper.js'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.match(content, /function\(l\)\{return"\/docs\/17\.1\/"\+l\}/);
  });
});

test('leaves other "/docs/" strings in _astro/*.js untouched', async () => {
  const original =
    'fetch("/docs/data/common.json");const u="/docs/"+path;' +
    'const f=function(a){return"/docs/"+b};const g=function(a){return"/docs/api/"+a};';

  await withFixtureDir({ '_astro/page.B_tncCx8.js': original }, async (dir) => {
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, '_astro/page.B_tncCx8.js'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, original);
  });
});

test('only rewrites the preload-helper base in .js files under _astro/', async () => {
  await withFixtureDir({ 'scripts/preload-helper.js': PRELOAD_HELPER_17_1 }, async (dir) => {
    const changedCount = await rewriteVersionedPaths(dir, '17.1');
    const content = await readFile(join(dir, 'scripts/preload-helper.js'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, PRELOAD_HELPER_17_1);
  });
});
