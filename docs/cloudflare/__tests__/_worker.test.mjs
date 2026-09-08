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
    // replaceAll, not replace: the placeholder appears in the comment above
    // the declaration as well, so a single replacement substituted the prose
    // and left LATEST_VERSION as the literal placeholder - which made rule 1b
    // silently untestable. Production uses `sed ... /g`, so it was never hit
    // there. Arbitrary version, outside every range under test.
    .replaceAll('__LATEST_DOCS_VERSION__', '99.9')
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

/**
 * Same shape as `request()`, but on an arbitrary hostname. The host-collapse
 * rule is the only rule that reads `url.hostname`, so it is the only one that
 * cannot be exercised through the handsontable.com-pinned helper above.
 *
 * @param {string} host
 * @param {string} path
 * @param {string} [method]
 * @returns {object} A minimal Request stand-in.
 */
function requestOn(host, path, method = 'GET') {
  return {
    url: `https://${host}${path}`,
    method,
    headers: { get: () => null },
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
// Legacy hostname collapse (docs.handsontable.com → handsontable.com)
// ---------------------------------------------------------------------------

/**
 * The legacy host must never answer with content, only with a 301 onto the
 * canonical host.
 *
 * @param {{fetch: Function}} worker
 * @param {string} path
 * @param {string} destination – expected absolute Location value.
 */
async function assertLegacyCollapse(worker, path, destination) {
  const response = await worker.fetch(requestOn('docs.handsontable.com', path), env);

  assert.equal(response.status, 301, `${path} must be a permanent redirect`);
  assert.equal(response.headers.get('location'), destination);
}

test('the legacy docs host 301s a content page to the same path on the canonical host', async() => {
  const worker = loadWorker();

  // Before this, the legacy host answered 200 with a byte-identical copy of
  // the canonical page, leaving the whole /docs tree live on two hostnames.
  await assertLegacyCollapse(
    worker,
    '/docs/angular-data-grid/row-parent-child/',
    'https://handsontable.com/docs/angular-data-grid/row-parent-child/',
  );
});

test('the legacy host collapse keeps the query string', async() => {
  const worker = loadWorker();

  await assertLegacyCollapse(
    worker,
    '/docs/javascript-data-grid/?foo=1&bar=2',
    'https://handsontable.com/docs/javascript-data-grid/?foo=1&bar=2',
  );
});

test('a path rule matched on the legacy host resolves the path AND crosses hosts in one hop', async() => {
  const worker = loadWorker();

  // This is the whole point of canonicalising the origin inside `abs()`
  // instead of collapsing the host before the path rules run. Sending
  // `/docs/next/x` to `handsontable.com/docs/next/x` would be a plain
  // host swap; the reader must land on the page the path actually means.
  await assertLegacyCollapse(
    worker,
    '/docs/next/javascript-data-grid/',
    'https://handsontable.com/docs/javascript-data-grid/',
  );
});

test('legacy non-/docs paths keep working, because only /docs reaches this worker on the canonical host', async() => {
  const worker = loadWorker();

  // handsontable.com serves the marketing site everywhere except /docs, so
  // these paths 404 there. Collapsing the host before the path rules ran
  // would have bounced each of them onto a marketing 404 - the legacy URLs
  // have to be resolved to their real destination on the way out.
  await assertLegacyCollapse(worker, '/', 'https://handsontable.com/docs');
  await assertLegacyCollapse(
    worker,
    '/0.8.0/',
    'https://handsontable.com/docs/javascript-data-grid/changelog',
  );
  await assertLegacyCollapse(worker, '/demo/foo', 'https://handsontable.com/demo');
  await assertLegacyCollapse(worker, '/customers/foo', 'https://handsontable.com/customers/');
});

test('an unmatched path on the legacy host is caught rather than served as a 200', async() => {
  const worker = loadWorker();

  // The catch-all lives in the `fetch` export, after `route()`, so a path
  // that reaches the static-asset fallback cannot leak content on this host.
  await assertLegacyCollapse(
    worker,
    '/i18n/missing-language-code',
    'https://handsontable.com/i18n/missing-language-code',
  );
});

test('a 304 from the asset fallback on the legacy host is still redirected', async() => {
  const worker = loadWorker();
  // Placement sentinel for rule 12a. The rule sits above the asset fallback,
  // so a GET on a legacy host is redirected before ASSETS is ever consulted
  // and this 304 mock is never reached. Move 12a below the fallback and the
  // 304 escapes (it carries no Location) and this goes red. Cloudflare Pages
  // really does answer a conditional request with 304 - verified against the
  // live host - and its etags are content hashes that survive a deploy, so a
  // recrawl sending If-None-Match would take exactly that path.
  const notModified = { ASSETS: { fetch: async() => new Response(null, { status: 304 }) } };
  const response = await worker.fetch(
    requestOn('docs.handsontable.com', '/docs/angular-data-grid/row-parent-child/'),
    notModified,
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://handsontable.com/docs/angular-data-grid/row-parent-child/',
  );
});

test('the external HyperFormula redirect survives the legacy host untouched', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    requestOn('docs.handsontable.com', '/docs/hyperformula/guide/basic-usage'),
    env,
  );

  // Rule 4 builds a full external URL instead of going through `abs()`, and
  // it sits above rule 12a, so the host collapse never sees this request.
  // Neither piece of the legacy-host handling may rewrite it onto
  // handsontable.com.
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://hyperformula.handsontable.com/guide/basic-usage',
  );
});

test('the cookie-reading rules 13-17 answer the legacy host with a 301, not their usual 302', async() => {
  const worker = loadWorker();

  // Regression for the review finding on this PR's first commit: rules 13-17
  // deliberately use 302 (their destination depends on the docs_fw cookie),
  // and with the collapse done only at the end of the pipeline these paths
  // reached those rules and left the legacy host with a 302. A 302 is not a
  // canonicalisation signal, so `/docs`, `/docs/` and every flat slug - the
  // most commonly linked legacy URLs - would have stayed in the index.
  await assertLegacyCollapse(worker, '/docs', 'https://handsontable.com/docs');
  await assertLegacyCollapse(worker, '/docs/', 'https://handsontable.com/docs/');
  await assertLegacyCollapse(worker, '/docs/14.4', 'https://handsontable.com/docs/14.4');
  await assertLegacyCollapse(
    worker,
    '/docs/installation',
    'https://handsontable.com/docs/installation',
  );
});

test('the legacy host ignores the framework cookie and lets the canonical host decide', async() => {
  const worker = loadWorker();
  const withCookie = {
    url: 'https://docs.handsontable.com/docs/installation',
    method: 'GET',
    headers: { get: (name) => (name === 'Cookie' ? 'docs_fw=react' : null) },
  };
  const response = await worker.fetch(withCookie, env);

  // Cookies are host-scoped, so a preference saved on handsontable.com is not
  // readable here. Resolving the framework from this host's jar would default
  // a React reader to the JavaScript page; the bare path plus a 301 hands the
  // decision to the origin that actually holds the cookie.
  assert.equal(response.status, 301);
  assert.equal(response.headers.get('location'), 'https://handsontable.com/docs/installation');
});

test('rule 1b resolves the version on the legacy host in one hop', async() => {
  const worker = loadWorker();

  // Only reachable now that loadWorker() substitutes LATEST_VERSION with
  // replaceAll - a single replace() left the placeholder in place and this
  // assertion could not fail.
  await assertLegacyCollapse(
    worker,
    '/docs/99.9/javascript-data-grid/',
    'https://handsontable.com/docs/javascript-data-grid/',
  );
});

test('rule 18 still leaves the legacy host, in two hops rather than one', async() => {
  const worker = loadWorker();

  // Rule 18 sits below the 12a cut, so the first hop is a plain host swap and
  // the canonical host then applies rule 18. Two 301s, which passes link
  // equity and terminates - the cost of not reordering rule 18 above the cut,
  // where it would take precedence over rule 13 for a `.html` path.
  await assertLegacyCollapse(
    worker,
    '/docs/14.4/react-installation',
    'https://handsontable.com/docs/14.4/react-installation',
  );
});

test('a trailing-dot legacy hostname is collapsed too', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    requestOn('docs.handsontable.com.', '/docs/javascript-data-grid/'),
    env,
  );

  // The URL parser lowercases the host but preserves the fully-qualified
  // trailing dot, so an exact-match Set lookup missed it and served 200.
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://handsontable.com/docs/javascript-data-grid/',
  );
});

test('an uppercase legacy hostname is collapsed (the parser normalises case)', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    requestOn('DOCS.Handsontable.com', '/docs/javascript-data-grid/'),
    env,
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://handsontable.com/docs/javascript-data-grid/',
  );
});

test('a HEAD request on the legacy host collapses like a GET', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    requestOn('docs.handsontable.com', '/docs/angular-data-grid/row-parent-child/', 'HEAD'),
    env,
  );

  // Rule 12a's predicate is GET-or-HEAD, and the POST test below covers only
  // the rejecting side of it. Without this, half the method restriction was
  // unasserted: narrowing the rule to GET alone would still have passed.
  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://handsontable.com/docs/angular-data-grid/row-parent-child/',
  );
});

test('the saving-data POST mock still answers on the legacy host', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    {
      url: 'https://docs.handsontable.com/docs/scripts/json/save.json',
      method: 'POST',
      headers: { get: () => null },
    },
    env,
  );

  // Rule 12a is GET/HEAD only. A 301 is downgraded to GET by every client and
  // loses the request body, and a POST is never indexed, so there is nothing
  // to canonicalise here.
  assert.equal(response.status, 200);

  const body = await response.json();

  assert.equal(body.result, 'ok');
});

test('a legacy-host redirect still carries HSTS, but not the document-only headers', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    requestOn('docs.handsontable.com', '/docs/angular-data-grid/row-parent-child/'),
    env,
  );

  // Every GET/HEAD on the legacy host is a redirect now, so if redirects were
  // left bare the host would stop refreshing its own HSTS pin and the promise
  // would age out. The apex sends includeSubDomains, which covers the
  // subdomain, but that would leave this host relying on apex config.
  assert.equal(
    response.headers.get('Strict-Transport-Security'),
    'max-age=31536000; includeSubDomains; preload',
  );

  // A redirect has no body, so these have nothing to act on.
  assert.equal(response.headers.get('Content-Security-Policy'), null);
  assert.equal(response.headers.get('X-Frame-Options'), null);
});

test('the canonical host is never collapsed, and its path rules still run', async() => {
  const worker = loadWorker();

  await assertRedirect(worker, '/docs/next/javascript-data-grid/', '/docs/javascript-data-grid/');
});

test('staging, preview and production apex hosts serve their own content untouched', async() => {
  const worker = loadWorker();

  // The allowlist is exact-match on purpose. A negative match ("any host that
  // is not handsontable.com") would 301 every one of these into production and
  // silently break docs review.
  const untouched = [
    'handsontable-docs-staging.pages.dev',
    'develop.handsontable-docs-staging.pages.dev',
    'pr-13414.handsontable-docs-staging.pages.dev',
    'rc-18.1.0.handsontable-docs-staging.pages.dev',
    'handsontable-docs.pages.dev',
  ];

  for (const host of untouched) {
    const response = await worker.fetch(
      requestOn(host, '/docs/angular-data-grid/row-parent-child/'),
      env,
    );

    assert.equal(response.status, 200, `${host} must still serve its own content`);
    assert.equal(
      response.headers.get('location'),
      null,
      `${host} must not be redirected anywhere`,
    );
  }
});

test('a path rule matched on a preview host stays on that host', async() => {
  const worker = loadWorker();
  const response = await worker.fetch(
    requestOn('pr-13414.handsontable-docs-staging.pages.dev', '/docs/next/javascript-data-grid/'),
    env,
  );

  assert.equal(response.status, 301);
  assert.equal(
    response.headers.get('location'),
    'https://pr-13414.handsontable-docs-staging.pages.dev/docs/javascript-data-grid/',
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
  const response = await worker.fetch(request('/docs/some-page.md.png'), markdownAssetsEnv());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8');
});
