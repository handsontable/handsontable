import assert from 'node:assert/strict';
import test from 'node:test';
import {
  declaredLayers,
  findOrderViolation,
  linkedStylesheets,
  pageStylesheets,
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

test('linkedStylesheets keeps document order and skips non-stylesheet links', () => {
  const html =
    '<link rel="icon" href="/docs/favicon.svg">' +
    '<link rel="stylesheet" href="/docs/_astro/common.abc.css">' +
    '<link rel="preload" href="/docs/_astro/font.woff2">' +
    '<link rel="stylesheet" href="/docs/_astro/ec.def.css">';

  assert.deepEqual(linkedStylesheets(html), [
    '/docs/_astro/common.abc.css',
    '/docs/_astro/ec.def.css',
  ]);
});
