import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

/**
 * `_worker.js` is written as a Cloudflare Workers ES module (`export default
 * { fetch }`), which the Wrangler/Pages runtime always treats as ESM
 * regardless of this package's CommonJS-by-default `package.json`. Node's
 * test runner would fail to `import` it directly under that mismatch, so it
 * is loaded and evaluated as a plain script instead - the same technique
 * used to sanity-check the worker locally before deploying it.
 *
 * @returns {{fetch: Function}} The worker's default export.
 */
function loadWorker() {
  const workerPath = fileURLToPath(new URL('../_worker.js', import.meta.url));
  const source = readFileSync(workerPath, 'utf8')
    .replace('__LATEST_DOCS_VERSION__', '99.9') // Arbitrary version outside every range under test.
    .replace('export default {', 'module.exports = {');
  const module = { exports: {} };

  new Function('module', 'exports', `${source}\nreturn module.exports;`)(module, module.exports);

  return module.exports;
}

function request(path, cookie, method = 'GET') {
  return {
    url: `https://handsontable.com${path}`,
    method,
    headers: { get: (name) => (name === 'Cookie' && cookie ? `docs_fw=${cookie}` : null) },
  };
}

const env = { ASSETS: { fetch: async() => new Response('static-asset-passthrough') } };

async function redirectLocationOf(worker, path, cookie) {
  const response = await worker.fetch(request(path, cookie), env);

  return response.headers.get('location');
}

async function assertRedirect(worker, path, destination, status = 301) {
  const response = await worker.fetch(request(path), env);

  assert.equal(response.status, status);
  assert.equal(response.headers.get('location'), `https://handsontable.com${destination}`);
}

test('bare old-version URL with the angular cookie keeps the requested version (regression for DEV-1981)', async() => {
  const worker = loadWorker();

  // Versions 12.1-15.3 have no dedicated per-version Angular docs, so the
  // cookie-based framework redirect must not point at "angular-data-grid"
  // there - doing so used to get collapsed by the legacy-angular rule into
  // the unversioned latest docs, silently dropping the requested version.
  assert.equal(
    await redirectLocationOf(worker, '/docs/14.4', 'angular'),
    'https://handsontable.com/docs/14.4/javascript-data-grid',
  );
  assert.equal(
    await redirectLocationOf(worker, '/docs/15.3', 'angular'),
    'https://handsontable.com/docs/15.3/javascript-data-grid',
  );
  assert.equal(
    await redirectLocationOf(worker, '/docs/12.1', 'angular'),
    'https://handsontable.com/docs/12.1/javascript-data-grid',
  );
});

test('bare version URL with the angular cookie still targets angular-data-grid once dedicated docs exist (16.0+)', async() => {
  const worker = loadWorker();

  assert.equal(
    await redirectLocationOf(worker, '/docs/16.2', 'angular'),
    'https://handsontable.com/docs/16.2/angular-data-grid',
  );
  assert.equal(
    await redirectLocationOf(worker, '/docs/17.1', 'angular'),
    'https://handsontable.com/docs/17.1/angular-data-grid',
  );
});

test('non-angular cookies and versions before the Angular package are unaffected', async() => {
  const worker = loadWorker();

  assert.equal(
    await redirectLocationOf(worker, '/docs/14.4', 'javascript'),
    'https://handsontable.com/docs/14.4/javascript-data-grid',
  );
  assert.equal(
    await redirectLocationOf(worker, '/docs/14.4', 'react'),
    'https://handsontable.com/docs/14.4/react-data-grid',
  );
  assert.equal(
    await redirectLocationOf(worker, '/docs/14.4', undefined),
    'https://handsontable.com/docs/14.4/javascript-data-grid',
  );

  // Pre-12.1 versions predate the Angular package entirely and are served
  // as-is (no framework subpath to redirect to).
  const response = await worker.fetch(request('/docs/12.0', 'angular'), env);

  assert.equal(response.status, 200);
});

test('direct links to the legacy angular-data-grid path still collapse to the unversioned latest docs', async() => {
  const worker = loadWorker();

  assert.equal(
    await redirectLocationOf(worker, '/docs/14.4/angular-data-grid/installation'),
    'https://handsontable.com/docs/angular-data-grid/',
  );
  assert.equal(
    await redirectLocationOf(worker, '/docs/12.0/angular-data-grid'),
    'https://handsontable.com/docs/javascript-data-grid/',
  );
});

// Old integrate-with-vue3 slugs redirect to the current Vue data grid pages.
// Keep in sync with VUE3_LEGACY_PAGES in _worker.js.
// 'vue3-custom-id-class-style' is deliberately omitted here and exercised
// separately below: its *unversioned* form is intercepted by the
// crossFramework map (rule 6) ahead of this map, since the current docs
// unified it into an all-framework 'custom-id-class-style' page. Its
// *versioned* form still needs the entry in VUE3_LEGACY_PAGES, because frozen
// historical doc versions never received that rename.
const vue3LegacyPages = {
  'vue3-installation': '/docs/vue-data-grid/installation/',
  'vue3-basic-example': '/docs/vue-data-grid/installation/',
  'vue3-modules': '/docs/vue-data-grid/modules/',
  'vue3-hot-column': '/docs/vue-data-grid/vue-hot-column/',
  'vue3-hot-reference': '/docs/vue-data-grid/vue-instance-reference/',
  'vue3-custom-renderer-example': '/docs/vue-data-grid/cell-renderer/',
  'vue3-custom-editor-example': '/docs/vue-data-grid/cell-editor/',
  'vue3-custom-context-menu-example': '/docs/vue-data-grid/context-menu/',
  'vue3-formulas-example': '/docs/vue-data-grid/formula-calculation/',
  'vue3-language-change-example': '/docs/vue-data-grid/language/',
  'vue3-setting-up-a-translation': '/docs/vue-data-grid/language/',
  'vue3-vuex-example': '/docs/vue-data-grid/vue-vuex/',
};

test('redirects Vue shorthand pages to the current Vue data grid installation page', async() => {
  const worker = loadWorker();

  await assertRedirect(worker, '/docs/vue', '/docs/vue-data-grid/installation/');
  await assertRedirect(worker, '/docs/vue3', '/docs/vue-data-grid/installation/');
});

test('redirects legacy Vue 3 pages under every framework prefix', async() => {
  const worker = loadWorker();

  for (const framework of ['javascript', 'react', 'angular', 'vue']) {
    for (const [page, destination] of Object.entries(vue3LegacyPages)) {
      await assertRedirect(worker, `/docs/${framework}-data-grid/${page}/`, destination);
    }
  }
});

test('redirects versioned legacy Vue 3 pages to versioned Vue data grid pages', async() => {
  const worker = loadWorker();

  for (const [page, destination] of Object.entries(vue3LegacyPages)) {
    const versionedDestination = `/docs/15.3${destination.slice('/docs'.length)}`;

    await assertRedirect(worker, `/docs/15.3/${page}/`, versionedDestination);
  }

  // Frozen historical versions still have this page at its old slug - only the
  // current/latest docs got the 'custom-id-class-style' unification.
  await assertRedirect(
    worker,
    '/docs/15.3/vue3-custom-id-class-style/',
    '/docs/15.3/vue-data-grid/vue-custom-id-class-style/',
  );
});

test('vue3-custom-id-class-style redirects to the unified custom-id-class-style page (unversioned only)', async() => {
  const worker = loadWorker();

  for (const framework of ['javascript', 'react', 'angular', 'vue']) {
    await assertRedirect(
      worker,
      `/docs/${framework}-data-grid/vue3-custom-id-class-style/`,
      `/docs/${framework}-data-grid/custom-id-class-style/`,
    );
  }
});

test('redirects disabled cells guide slugs to the read-only cells guide', async() => {
  const worker = loadWorker();

  for (const framework of ['javascript', 'react', 'angular', 'vue']) {
    await assertRedirect(
      worker,
      `/docs/${framework}-data-grid/disabled-cells/`,
      `/docs/${framework}-data-grid/read-only-cells/`,
    );
  }

  const oldFlatResponse = await worker.fetch(request('/docs/disabled-cells', 'react'), env);

  assert.equal(oldFlatResponse.status, 302);
  assert.equal(
    oldFlatResponse.headers.get('location'),
    'https://handsontable.com/docs/react-data-grid/read-only-cells/',
  );

  const newFlatResponse = await worker.fetch(request('/docs/read-only-cells', 'angular'), env);

  assert.equal(newFlatResponse.status, 302);
  assert.equal(
    newFlatResponse.headers.get('location'),
    'https://handsontable.com/docs/angular-data-grid/read-only-cells/',
  );
});

test('Content-Security-Policy frame-src allows the Figma embed (regression for DEV-2032)', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(request('/docs/vue-data-grid/handsontable-design-system/'), env);
  const csp = response.headers.get('Content-Security-Policy');
  const frameSrc = csp.split(';').find((directive) => directive.trim().startsWith('frame-src'));

  assert.ok(frameSrc, 'expected a frame-src directive in the Content-Security-Policy header');

  const frameSrcSources = frameSrc.trim().split(/\s+/).slice(1); // drop the "frame-src" keyword
  const hasSource = (source) => frameSrcSources.some((entry) => entry === source);

  assert.ok(hasSource('https://embed.figma.com'));

  // Other embeds documented elsewhere in the guides must keep working too.
  assert.ok(hasSource('https://www.youtube.com'));
  assert.ok(hasSource('https://codesandbox.io'));
});

test('Content-Security-Policy frame-src allows the demos.handsontable.com embed used by theme recipes', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(request('/docs/vue-data-grid/handsontable-design-system/'), env);
  const csp = response.headers.get('Content-Security-Policy');
  const frameSrc = csp.split(';').find((directive) => directive.trim().startsWith('frame-src'));

  assert.ok(frameSrc, 'expected a frame-src directive in the Content-Security-Policy header');

  const frameSrcSources = frameSrc.trim().split(/\s+/).slice(1); // drop the "frame-src" keyword
  const hasSource = (source) => frameSrcSources.some((entry) => entry === source);

  assert.ok(hasSource('https://demos.handsontable.com'));
});

test('keeps versioned demo redirects on historical disabled cells slugs', async() => {
  const worker = loadWorker();

  await assertRedirect(
    worker,
    '/docs/11.1/demo-read-only.html',
    '/docs/11.1/disabled-cells',
    302,
  );
  await assertRedirect(
    worker,
    '/docs/15.3/demo-disabled-editing.html',
    '/docs/15.3/javascript-data-grid/disabled-cells',
    302,
  );
});

test('a flat legacy HTML page redirects to its current framework page (rule 15)', async() => {
  const worker = loadWorker();

  await assertRedirect(worker, '/docs/Hooks.html', '/docs/javascript-data-grid/api/hooks/', 302);
  await assertRedirect(worker, '/docs/tutorial-introduction.html', '/docs/javascript-data-grid/', 302);
  await assertRedirect(worker, '/docs/tutorial-known-limitations.html', '/docs/javascript-data-grid/third-party-licenses/', 302);
  assert.equal(
    await redirectLocationOf(worker, '/docs/demo-date.html', 'react'),
    'https://handsontable.com/docs/react-data-grid/date-cell-type/',
  );
});

test('a page of a docs version older than 9.0 redirects to its current page (PRO-1371)', async() => {
  const worker = loadWorker();

  // Versions below 9.0 are not deployed, so rules 13 and 14 sent these
  // URLs to a /docs/7.4/... path that answered 404.
  await assertRedirect(worker, '/docs/7.4/Hooks.html', '/docs/javascript-data-grid/api/hooks/', 302);
  await assertRedirect(worker, '/docs/7.4.2/Hooks.html', '/docs/javascript-data-grid/api/hooks/', 302);
  await assertRedirect(worker, '/docs/7.2.2/tutorial-performance-tips.html', '/docs/javascript-data-grid/performance/', 302);
  await assertRedirect(worker, '/docs/0.15.0-beta5/demo-date.html', '/docs/javascript-data-grid/date-cell-type/', 302);
  await assertRedirect(worker, '/docs/8.0.0/tutorial-known-limitations.html', '/docs/javascript-data-grid/third-party-licenses/', 302);
  assert.equal(
    await redirectLocationOf(worker, '/docs/7.4.2/demo-numeric.html', 'react'),
    'https://handsontable.com/docs/react-data-grid/numeric-cell-type/',
  );
  // A framework wrapper page keeps its own framework whatever the cookie says.
  assert.equal(
    await redirectLocationOf(worker, '/docs/7.2.1/frameworks-wrapper-for-react-installation.html', 'angular'),
    'https://handsontable.com/docs/react-data-grid/installation/',
  );
});

test('the root, or an unknown page, of a docs version older than 9.0 lands on the framework home', async() => {
  const worker = loadWorker();

  // A deliberate soft landing: the version no longer exists, and the
  // framework home serves the reader better than a 404.
  await assertRedirect(worker, '/docs/6.2.2/', '/docs/javascript-data-grid/', 302);
  await assertRedirect(worker, '/docs/8.4', '/docs/javascript-data-grid/', 302);
  await assertRedirect(worker, '/docs/7.0.0/CellRange.html', '/docs/javascript-data-grid/', 302);
  await assertRedirect(worker, '/docs/7.4/api/hooks', '/docs/javascript-data-grid/', 302);
  assert.equal(
    await redirectLocationOf(worker, '/docs/8.4.0/', 'react'),
    'https://handsontable.com/docs/react-data-grid/',
  );
});

test('a three-part version from 9.0 up redirects to its MAJOR.MINOR docs', async() => {
  const worker = loadWorker();

  await assertRedirect(worker, '/docs/9.0.1/tutorial-introduction.html', '/docs/9.0/tutorial-introduction.html');
  await assertRedirect(worker, '/docs/12.4.0/', '/docs/12.4/');
  await assertRedirect(worker, '/docs/16.1.0', '/docs/16.1');
});

test('deployed versions and look-alike paths are not caught by the old-version rule', async() => {
  const worker = loadWorker();

  // 9.0 to 12.0 are served from the assets as they are.
  const response = await worker.fetch(request('/docs/9.0/'), env);

  assert.equal(response.status, 200);
  await assertRedirect(worker, '/docs/9.0/tutorial-introduction.html', '/docs/9.0/', 302);

  const lookAlike = await worker.fetch(request('/docs/16.1javascript-data-grid/batch-operations/'), env);

  assert.equal(lookAlike.status, 200);
  assert.equal(await lookAlike.text(), 'static-asset-passthrough');
});

test('a flat page link with a sentence\'s punctuation glued to it still redirects (PRO-1371)', async() => {
  const worker = loadWorker();
  const language = '/docs/javascript-data-grid/language/#load-the-prepared-language-files';

  // Older Handsontable versions print this link at the end of a console
  // sentence, so a click carries the period into the URL.
  await assertRedirect(worker, '/docs/i18n/missing-language-code', language, 302);
  await assertRedirect(worker, '/docs/i18n/missing-language-code.', language, 302);
  await assertRedirect(worker, '/docs/i18n/missing-language-code.\'', language, 302);
  await assertRedirect(worker, '/docs/api/core.', '/docs/javascript-data-grid/api/core/', 302);
});

test('answers POST to the saving-data demo\'s save.json mock instead of 405ing (regression for DEV-2034)', async() => {
  const worker = loadWorker();

  const response = await worker.fetch(request('/docs/scripts/json/save.json', undefined, 'POST'), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.deepEqual(body, { result: 'ok' });
});

test('still serves save.json as a static asset for GET/HEAD', async() => {
  const worker = loadWorker();

  const getResponse = await worker.fetch(request('/docs/scripts/json/save.json', undefined, 'GET'), env);

  assert.equal(await getResponse.text(), 'static-asset-passthrough');

  const headResponse = await worker.fetch(request('/docs/scripts/json/save.json', undefined, 'HEAD'), env);

  assert.equal(await headResponse.text(), 'static-asset-passthrough');
});

test('serves the React and Angular variants of the multi-framework cell-type recipes instead of bouncing them to the index', async() => {
  const worker = loadWorker();

  for (const slug of ['flatpickr', 'pikaday', 'moment-date', 'moment-time', 'numbro']) {
    for (const framework of ['react', 'angular']) {
      const path = `/docs/${framework}-data-grid/recipes/cell-types/${slug}/`;
      const response = await worker.fetch(request(path), env);

      assert.equal(await response.text(), 'static-asset-passthrough', `${path} must be served, not redirected`);
    }
  }
});

test('still maps cell-type recipes that have a framework-specific counterpart page', async() => {
  const worker = loadWorker();

  await assertRedirect(
    worker,
    '/docs/react-data-grid/recipes/cell-types/color-picker/',
    '/docs/react-data-grid/recipes/cell-types/colorful-picker/',
  );
  await assertRedirect(
    worker,
    '/docs/angular-data-grid/recipes/cell-types/react-rating/',
    '/docs/angular-data-grid/recipes/cell-types/rating/',
  );
});

// ---------------------------------------------------------------------------
// Rule 18b: agent-facing text files are served as text/plain
// ---------------------------------------------------------------------------

/**
 * ASSETS mock that serves every request as `text/markdown`, the content type
 * Cloudflare Pages assigns to .md assets — the exact behavior rule 18b exists
 * to override.
 *
 * @param {number} [status]
 * @returns {object}
 */
function markdownAssetsEnv(status = 200) {
  return {
    ASSETS: {
      fetch: async() => new Response(status === 200 ? '# Installation' : 'not found', {
        status,
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      }),
    },
  };
}

test('a /docs/_md/ Markdown twin is served as text/plain (rule 18b)', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    request('/docs/_md/react-data-grid/installation.md'),
    markdownAssetsEnv(),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8');
  assert.equal(await response.text(), '# Installation');
});

test('llms.txt and llms-full.txt are served as text/plain (rule 18b)', async() => {
  const worker = loadWorker();

  for (const path of ['/docs/llms.txt', '/docs/llms-full.txt']) {
    const response = await worker.fetch(request(path), markdownAssetsEnv());

    assert.equal(response.status, 200, `${path} must serve`);
    assert.equal(response.headers.get('content-type'), 'text/plain; charset=utf-8', path);
  }
});

test('a missing _md twin passes the 404 through without a content-type override', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    request('/docs/_md/react-data-grid/no-such-page.md'),
    markdownAssetsEnv(404),
  );

  assert.equal(response.status, 404);
  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
});

test('non-agent assets keep the content type Pages assigned them', async() => {
  const worker = loadWorker();

  // A real .md path outside /docs/_md/ pins the boundary that matters: only
  // the twins directory is overridden, not every .md on the site. The
  // .md.png path pins the extension anchor.
  for (const path of ['/docs/javascript-data-grid/foo.md', '/docs/some-page.md.png']) {
    const response = await worker.fetch(request(path), markdownAssetsEnv());

    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8', path);
  }
});
