import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workerSource = readFileSync(join(__dirname, '_worker.js'), 'utf8')
  .replace('export default {', 'globalThis.worker = {');
const context = { Request, Response, URL, URLSearchParams, Headers, console };

context.globalThis = context;
vm.runInNewContext(workerSource, context, { filename: '_worker.js' });

const worker = context.worker;
const env = {
  ASSETS: {
    fetch: async() => new Response('asset', { status: 200 }),
  },
};

const vue3LegacyPages = {
  'vue3-installation': '/docs/vue-data-grid/installation/',
  'vue3-basic-example': '/docs/vue-data-grid/installation/',
  'vue3-modules': '/docs/vue-data-grid/modules/',
  'vue3-hot-column': '/docs/vue-data-grid/vue-hot-column/',
  'vue3-hot-reference': '/docs/vue-data-grid/vue-instance-reference/',
  'vue3-custom-renderer-example': '/docs/vue-data-grid/cell-renderer/',
  'vue3-custom-editor-example': '/docs/vue-data-grid/cell-editor/',
  'vue3-custom-context-menu-example': '/docs/vue-data-grid/context-menu/',
  'vue3-custom-id-class-style': '/docs/vue-data-grid/vue-custom-id-class-style/',
  'vue3-formulas-example': '/docs/vue-data-grid/formula-calculation/',
  'vue3-language-change-example': '/docs/vue-data-grid/language/',
  'vue3-setting-up-a-translation': '/docs/vue-data-grid/language/',
  'vue3-vuex-example': '/docs/vue-data-grid/vue-vuex/',
};

async function assertRedirect(path, destination) {
  const response = await worker.fetch(new Request(`https://example.test${path}`), env);

  assert.equal(response.status, 301);
  assert.equal(response.headers.get('Location'), `https://example.test${destination}`);
}

test('redirects Vue shorthand pages to the current Vue data grid installation page', async() => {
  await assertRedirect('/docs/vue', '/docs/vue-data-grid/installation/');
  await assertRedirect('/docs/vue3', '/docs/vue-data-grid/installation/');
});

test('redirects legacy Vue 3 pages under every framework prefix', async() => {
  for (const framework of ['javascript', 'react', 'angular', 'vue']) {
    for (const [page, destination] of Object.entries(vue3LegacyPages)) {
      await assertRedirect(`/docs/${framework}-data-grid/${page}/`, destination);
    }
  }
});

test('redirects versioned legacy Vue 3 pages to versioned Vue data grid pages', async() => {
  for (const [page, destination] of Object.entries(vue3LegacyPages)) {
    const versionedDestination = `/docs/15.3${destination.slice('/docs'.length)}`;

    await assertRedirect(`/docs/15.3/${page}/`, versionedDestination);
  }
});
