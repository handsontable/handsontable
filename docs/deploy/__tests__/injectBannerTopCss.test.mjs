import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { injectBannerTopCss } from '../injectBannerTopCss.mjs';

const HEAD = '<head><title>Docs</title></head>';

// The broken layout: the banner renders after the content (14.6-17.0 builds).
const BOTTOM_BANNER_PAGE =
  `<html>${HEAD}<body><main class="page">` +
  '<div class="breadcrumbs">15.0.0</div>' +
  '<div class="theme-default-content content__default"><h1>Introduction</h1></div>' +
  '<div class="page-top" style="display:none;"><div class="custom-block tip version-alert">' +
  '<p>There is a newer version of Handsontable available.</p></div></div>' +
  '<footer class="footer"></footer>' +
  '</main></body></html>';

// The already-correct layout: the banner renders before the content (<= 14.0 builds).
const TOP_BANNER_PAGE =
  `<html>${HEAD}<body><main class="page">` +
  '<div class="page-top" style="display:none;"><div class="custom-block tip version-alert">' +
  '<p>There is a newer version of Handsontable available.</p></div></div>' +
  '<div class="theme-default-content content__default"><h1>Introduction</h1></div>' +
  '</main></body></html>';

async function withFixtureDir(files, run) {
  const dir = await mkdtemp(join(tmpdir(), 'inject-banner-top-css-'));

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

test('injects the reorder CSS before </head> on a bottom-banner page', async () => {
  await withFixtureDir({ 'javascript-data-grid/index.html': BOTTOM_BANNER_PAGE }, async (dir) => {
    const changedCount = await injectBannerTopCss(dir);
    const content = await readFile(join(dir, 'javascript-data-grid/index.html'), 'utf-8');

    assert.equal(changedCount, 1);
    assert.match(content, /<style id="hot-banner-top">.*<\/style><\/head>/);
    assert.match(content, /main\.page>\.page-top\{order:-1\}/);
    // The markup itself is untouched -- only the head gains a style tag.
    assert.ok(content.includes('<div class="page-top" style="display:none;">'));
  });
});

test('injects the style tag exactly once per file', async () => {
  await withFixtureDir({ 'index.html': BOTTOM_BANNER_PAGE }, async (dir) => {
    await injectBannerTopCss(dir);
    const content = await readFile(join(dir, 'index.html'), 'utf-8');

    assert.equal(content.split('hot-banner-top').length - 1, 1);
  });
});

test('is idempotent: a second run changes nothing', async () => {
  await withFixtureDir({ 'index.html': BOTTOM_BANNER_PAGE }, async (dir) => {
    const firstRun = await injectBannerTopCss(dir);
    const afterFirst = await readFile(join(dir, 'index.html'), 'utf-8');
    const secondRun = await injectBannerTopCss(dir);
    const afterSecond = await readFile(join(dir, 'index.html'), 'utf-8');

    assert.equal(firstRun, 1);
    assert.equal(secondRun, 0);
    assert.equal(afterSecond, afterFirst);
  });
});

test('skips pages whose banner already renders before the content', async () => {
  await withFixtureDir({ 'index.html': TOP_BANNER_PAGE }, async (dir) => {
    const changedCount = await injectBannerTopCss(dir);
    const content = await readFile(join(dir, 'index.html'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, TOP_BANNER_PAGE);
  });
});

test('skips pages without the banner', async () => {
  const bannerlessPage =
    `<html>${HEAD}<body><main class="page">` +
    '<div class="theme-default-content content__default"><h1>Introduction</h1></div>' +
    '</main></body></html>';

  await withFixtureDir({ 'index.html': bannerlessPage }, async (dir) => {
    const changedCount = await injectBannerTopCss(dir);
    const content = await readFile(join(dir, 'index.html'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, bannerlessPage);
  });
});

test('only touches .html files', async () => {
  const jsonContent = '{"pageTop": "theme-default-content then class=\\"page-top\\""}';

  await withFixtureDir({ 'data/common.json': jsonContent }, async (dir) => {
    const changedCount = await injectBannerTopCss(dir);
    const content = await readFile(join(dir, 'data/common.json'), 'utf-8');

    assert.equal(changedCount, 0);
    assert.equal(content, jsonContent);
  });
});

test('processes files nested in subdirectories', async () => {
  await withFixtureDir(
    {
      'react-data-grid/installation/index.html': BOTTOM_BANNER_PAGE,
      'javascript-data-grid/index.html': TOP_BANNER_PAGE,
    },
    async (dir) => {
      const changedCount = await injectBannerTopCss(dir);
      const nested = await readFile(join(dir, 'react-data-grid/installation/index.html'), 'utf-8');

      assert.equal(changedCount, 1);
      assert.match(nested, /hot-banner-top/);
    }
  );
});
