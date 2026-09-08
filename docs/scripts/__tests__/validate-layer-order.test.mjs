import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import test from 'node:test';
import {
  assetPathCandidates,
  declaredLayers,
  findOrderViolation,
  pageStylesheets,
  validateBuiltPages,
} from '../validate-layer-order.mjs';

const RESET = '@layer starlight.reset{*{margin:0}}';
const CONTENT = '@layer starlight.content{.sl-markdown-content p+p{margin-top:1.25rem}}';
const COMPONENTS = '@layer starlight.components{.sl-steps>li+li{margin-top:0}}';

test('declaredLayers lists layers in order of first appearance', () => {
  assert.deepEqual(declaredLayers(`${RESET}${CONTENT}${RESET}`), [
    'starlight.reset',
    'starlight.content',
  ]);
});

test('declaredLayers reads a layer statement as several declarations', () => {
  assert.deepEqual(declaredLayers('@layer starlight.reset, starlight.content;'), [
    'starlight.reset',
    'starlight.content',
  ]);
});

test('declaredLayers ignores an @layer quoted inside a comment', () => {
  assert.deepEqual(declaredLayers(`/* @layer starlight.components{} */${RESET}`), [
    'starlight.reset',
  ]);
});

test('Starlight order passes', () => {
  assert.equal(findOrderViolation(declaredLayers(`${RESET}${CONTENT}${COMPONENTS}`)), null);
});

test('content before reset is reported - the DEV-2742 bundle order', () => {
  // What production shipped: components and content first (they came from docs
  // stylesheets bundled early), with Starlight's reset layer last.
  const violation = findOrderViolation([
    'starlight.components',
    'starlight.content',
    'starlight.base',
    'starlight.reset',
    'starlight.core',
    'starlight.utils',
  ]);

  assert.match(violation, /starlight\.content is declared after starlight\.components/);
});

test('a stylesheet touching one layer cannot violate the order', () => {
  assert.equal(findOrderViolation(declaredLayers(COMPONENTS)), null);
});

test('non-Starlight layers do not affect the verdict', () => {
  assert.equal(findOrderViolation(['rapide', 'starlight.reset', 'starlight.content']), null);
});

test('pageStylesheets interleaves inline styles with links in document order', () => {
  const html =
    '<link rel="stylesheet" href="/docs/_astro/common.abc.css">' +
    `<style>${RESET}</style>` +
    '<link rel="stylesheet" href="/docs/_astro/ec.def.css">';

  assert.deepEqual(pageStylesheets(html), [
    { href: '/docs/_astro/common.abc.css' },
    { css: RESET },
    { href: '/docs/_astro/ec.def.css' },
  ]);
});

test('pageStylesheets keeps document order and skips non-stylesheet links', () => {
  const html =
    '<link rel="icon" href="/docs/favicon.svg">' +
    '<link rel="stylesheet" href="/docs/_astro/common.abc.css">' +
    '<link rel="preload" href="/docs/_astro/font.woff2">' +
    '<link rel="stylesheet" href="/docs/_astro/ec.def.css">';

  assert.deepEqual(pageStylesheets(html), [
    { href: '/docs/_astro/common.abc.css' },
    { href: '/docs/_astro/ec.def.css' },
  ]);
});

test('assetPathCandidates strips the base path and allows a deeper asset dir', () => {
  assert.deepEqual(assetPathCandidates('/docs/_astro/common.abc.css'), [
    'docs/_astro/common.abc.css',
    '_astro/common.abc.css',
    'common.abc.css',
  ]);
  assert.deepEqual(assetPathCandidates('/docs/_astro/chunks/common.abc.css?v=2'), [
    'docs/_astro/chunks/common.abc.css',
    '_astro/chunks/common.abc.css',
    'chunks/common.abc.css',
    'common.abc.css',
  ]);
});

test('assetPathCandidates refuses an href that cannot name a local file', () => {
  // An external stylesheet in <head> must not be read from disk, and must not
  // crash the build gate either.
  assert.deepEqual(assetPathCandidates('https://fonts.example.com/style.css'), []);
  assert.deepEqual(assetPathCandidates('//fonts.example.com/style.css'), []);
  assert.deepEqual(assetPathCandidates('data:text/css,body{margin:0}'), []);
  assert.deepEqual(assetPathCandidates('/'), []);
});

/**
 * Writes a throwaway build output tree.
 *
 * @param {Record<string, string>} files Relative path to file content.
 * @returns {Promise<string>} The tree's root directory.
 */
async function writeDist(files) {
  const distDir = await mkdtemp(join(tmpdir(), 'layer-order-'));

  for (const [path, content] of Object.entries(files)) {
    await mkdir(join(distDir, dirname(path)), { recursive: true });
    await writeFile(join(distDir, path), content);
  }

  return distDir;
}

const GUIDE_PAGE = 'javascript-data-grid/batch-operations/index.html';
const API_PAGE = 'javascript-data-grid/api/core/index.html';
const IN_ORDER = `@layer starlight.base{:root{--a:1}}${RESET}${CONTENT}${COMPONENTS}`;
const OUT_OF_ORDER = `${CONTENT}${RESET}`;

test('validateBuiltPages accepts a build whose blocks are in Starlight order', async() => {
  const distDir = await writeDist({
    [GUIDE_PAGE]: '<link rel="stylesheet" href="/docs/_astro/common.abc.css">',
    '_astro/common.abc.css': IN_ORDER,
  });
  const { errors, checked, skipped } = await validateBuiltPages(distDir);

  assert.deepEqual(errors, []);
  assert.deepEqual(checked, [GUIDE_PAGE]);
  assert.deepEqual(skipped, []);
});

test('validateBuiltPages reports reset landing after content', async() => {
  const distDir = await writeDist({
    [GUIDE_PAGE]: '<link rel="stylesheet" href="/docs/_astro/common.abc.css">',
    '_astro/common.abc.css': OUT_OF_ORDER,
  });
  const { errors } = await validateBuiltPages(distDir);

  assert.equal(errors.length, 2, errors.join('\n'));
  assert.match(errors[0], /starlight\.reset is declared after starlight\.content/);
  assert.match(errors[1], /across its stylesheets/);
});

test('validateBuiltPages catches an order broken across two stylesheets', async() => {
  // Each stylesheet is fine on its own; only the link order breaks the cascade.
  const distDir = await writeDist({
    [GUIDE_PAGE]:
      '<link rel="stylesheet" href="/docs/_astro/ec.def.css">' +
      '<link rel="stylesheet" href="/docs/_astro/common.abc.css">',
    '_astro/ec.def.css': CONTENT,
    '_astro/common.abc.css': RESET,
  });
  const { errors } = await validateBuiltPages(distDir);

  assert.equal(errors.length, 1, errors.join('\n'));
  assert.match(errors[0], /across its stylesheets/);
});

test('validateBuiltPages reads an inline <style> block in document order', async() => {
  const distDir = await writeDist({
    [GUIDE_PAGE]: `<style>${CONTENT}</style><link rel="stylesheet" href="/docs/_astro/common.abc.css">`,
    '_astro/common.abc.css': RESET,
  });
  const { errors } = await validateBuiltPages(distDir);

  assert.equal(errors.length, 1, errors.join('\n'));
  assert.match(errors[0], /across its stylesheets/);
});

test('validateBuiltPages skips an unresolvable stylesheet instead of failing', async() => {
  // A hard failure here would red the whole docs build over an external
  // stylesheet or a moved asset, neither of which is a layer-order problem.
  const distDir = await writeDist({
    [GUIDE_PAGE]:
      '<link rel="stylesheet" href="https://fonts.example.com/style.css">' +
      '<link rel="stylesheet" href="/docs/_astro/gone.abc.css">' +
      '<link rel="stylesheet" href="/docs/_astro/common.abc.css">',
    '_astro/common.abc.css': IN_ORDER,
  });
  const { errors, skipped } = await validateBuiltPages(distDir);

  assert.deepEqual(errors, []);
  assert.deepEqual(skipped, ['/docs/_astro/gone.abc.css']);
});

test('validateBuiltPages tolerates one missing page but not all of them', async() => {
  const present = await writeDist({
    [API_PAGE]: '<link rel="stylesheet" href="/docs/_astro/common.abc.css">',
    '_astro/common.abc.css': IN_ORDER,
  });
  const partial = await validateBuiltPages(present);

  assert.deepEqual(partial.errors, []);
  assert.deepEqual(partial.checked, [API_PAGE]);

  const empty = await validateBuiltPages(await writeDist({ 'index.html': '<p>hi</p>' }));

  assert.equal(empty.checked.length, 0);
  assert.match(empty.errors[0], /none of the checked pages exist/);
});
