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

  // A real .md path outside /docs/_md/ pins the boundary that matters: only
  // the twins directory is overridden, not every .md on the site. The
  // .md.png path pins the extension anchor.
  for (const path of ['/docs/javascript-data-grid/foo.md', '/docs/some-page.md.png']) {
    const response = await worker.fetch(request(path), markdownAssetsEnv());

    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), 'text/markdown; charset=utf-8', path);
  }
});

// ---------------------------------------------------------------------------
// Rule 18c: Design System last-update date
// ---------------------------------------------------------------------------

const DESIGN_SYSTEM_DATE_PATH = '/docs/api/design-system-updated.json';

/**
 * Builds an env whose Figma calls are answered from a canned map instead of
 * the network. Keys are matched by substring against the request URL, so a
 * case only has to name the endpoint it cares about ('/versions', '/meta');
 * an endpoint left out answers 500, which is what the fallback paths need.
 *
 * `calls` records every URL requested, so a test can prove the second endpoint
 * was not called when the first one already answered.
 *
 * @param {object} responses
 * @param {object} [overrides] Extra env fields, e.g. to unset a credential.
 * @returns {object}
 */
function figmaEnv(responses, overrides = {}) {
  const calls = [];

  return {
    ASSETS: { fetch: async() => new Response('static-asset-passthrough') },
    FIGMA_TOKEN: 'test-token',
    FIGMA_FILE_KEY: 'test-file-key',
    FIGMA_FETCH: async(requestUrl) => {
      calls.push(requestUrl);

      const match = Object.keys(responses).find(fragment => requestUrl.includes(fragment));

      if (!match) {
        return new Response('{}', { status: 500 });
      }

      return new Response(JSON.stringify(responses[match]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    },
    calls,
    ...overrides,
  };
}

test('serves the newest NAMED version date, ignoring autosave checkpoints (rule 18c)', async() => {
  const worker = loadWorker();
  // The autosave is the newest entry by date and carries `label: null`. Taking
  // the newest entry outright - the obvious implementation, and what
  // `?page_size=1` returns - would report the autosave, so the published date
  // would move every time a designer nudged a frame. This pins that.
  const env = figmaEnv({
    '/versions': {
      versions: [
        { id: '3', created_at: '2026-09-15T10:00:00Z', label: null },
        { id: '2', created_at: '2026-09-01T09:00:00Z', label: 'v2.1 release' },
        { id: '1', created_at: '2026-06-02T08:00:00Z', label: 'v2.0 release' },
      ],
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.deepEqual(await response.json(), {
    date: '2026-09-01T09:00:00Z',
    source: 'named-version',
  });
});

test('picks the newest named version by date, not by position (rule 18c)', async() => {
  const worker = loadWorker();
  // Figma returns newest-first in practice but does not promise it, so an
  // out-of-order page must still resolve to the latest named version.
  const env = figmaEnv({
    '/versions': {
      versions: [
        { id: '1', created_at: '2026-06-02T08:00:00Z', label: 'older' },
        { id: '2', created_at: '2026-09-01T09:00:00Z', label: 'newest' },
      ],
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal((await response.json()).date, '2026-09-01T09:00:00Z');
});

test('falls back to last_touched_at when the file has no named versions (rule 18c)', async() => {
  const worker = loadWorker();
  const env = figmaEnv({
    '/versions': { versions: [{ id: '1', created_at: '2026-09-15T10:00:00Z', label: null }] },
    '/meta': { file: { name: 'Design System', last_touched_at: '2026-09-15T10:00:00Z' } },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    date: '2026-09-15T10:00:00Z',
    source: 'last-touched',
  });
});

/**
 * Serves a paginated version history: one entry per page in `pages`, linked by
 * Figma's own `pagination.next_page`. `/meta` answers a last-touched date, so
 * a test that reaches the fallback shows it plainly.
 *
 * @param {object[][]} pages One `versions` array per page, newest page first.
 * @param {object} [overrides]
 * @returns {object}
 */
function paginatedVersionsEnv(pages, overrides = {}) {
  const calls = [];

  return {
    ASSETS: { fetch: async() => new Response('static-asset-passthrough') },
    FIGMA_TOKEN: 'test-token',
    FIGMA_FILE_KEY: 'test-file-key',
    calls,
    FIGMA_FETCH: async(url) => {
      calls.push(url);

      if (url.includes('/meta')) {
        return new Response(
          JSON.stringify({ file: { last_touched_at: '2026-09-11T10:00:00Z' } }),
          { status: 200 },
        );
      }

      const page = Number(new URL(url).searchParams.get('page') ?? 0);
      const isLast = page >= pages.length - 1;

      return new Response(JSON.stringify({
        versions: pages[page] ?? [],
        pagination: isLast
          ? {}
          : { next_page: `https://api.figma.com/v1/files/test-file-key/versions?page=${page + 1}` },
      }), { status: 200 });
    },
    ...overrides,
  };
}

test('asks for the largest page of versions Figma allows (rule 18c)', async() => {
  const worker = loadWorker();
  const env = paginatedVersionsEnv([[{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }]]);

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.match(env.calls[0], /page_size=50/, 'the default of 30 buries a named version sooner');
});

test('walks past a page of autosaves to reach the named version (rule 18c)', async() => {
  const worker = loadWorker();
  // The real failure this guards: version history is mostly unnamed autosaves,
  // one per 30 minutes of editing, so a long gap since the last publish fills
  // page one with `label: null`. Reading only that page reports "no named
  // version" and silently downgrades the page to the last-touched date.
  const env = paginatedVersionsEnv([
    [
      { id: '3', created_at: '2026-09-15T10:00:00Z', label: null },
      { id: '2', created_at: '2026-09-11T10:00:00Z', label: null },
    ],
    [{ id: '1', created_at: '2026-08-20T13:29:35Z', label: 'Published to Community hub' }],
  ]);
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), {
    date: '2026-08-20T13:29:35Z',
    source: 'named-version',
  });
  assert.ok(!env.calls.some(url => url.includes('/meta')), 'the fallback must not be reached');
});

test('stops walking the history after a bounded number of pages (rule 18c)', async() => {
  const worker = loadWorker();
  // A file with no named version at all must not walk its whole history on
  // every cache miss.
  const autosaves = Array.from({ length: 8 }, (unused, index) => (
    [{ id: `${index}`, created_at: '2026-09-15T10:00:00Z', label: null }]
  ));
  const env = paginatedVersionsEnv(autosaves);
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  const versionCalls = env.calls.filter(url => url.includes('/versions'));

  assert.equal(versionCalls.length, 4);
  // And it still falls back rather than hiding the field.
  assert.deepEqual(await response.json(), {
    date: '2026-09-11T10:00:00Z',
    source: 'last-touched',
  });
});

test('never follows a next_page pointing away from Figma (rule 18c)', async() => {
  const worker = loadWorker();
  const env = paginatedVersionsEnv([[]], {
    FIGMA_FETCH: async(url) => {
      env.calls.push(url);

      if (url.includes('/meta')) {
        return new Response(JSON.stringify({ file: { last_touched_at: '2026-09-11T10:00:00Z' } }), { status: 200 });
      }

      return new Response(JSON.stringify({
        versions: [{ id: '1', created_at: '2026-09-15T10:00:00Z', label: null }],
        pagination: { next_page: 'https://example.com/v1/files/test-file-key/versions' },
      }), { status: 200 });
    },
  });

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  // Match the origin exactly. `startsWith('https://example.com')` also matches
  // `https://example.com.figma.com`, which is the substring check CodeQL flags
  // and the wrong way to ask this question.
  assert.ok(!env.calls.some(url => new URL(url).origin === 'https://example.com'));
});

test('never follows a next_page on a lookalike host (rule 18c)', async() => {
  const worker = loadWorker();
  // `api.figma.com.example.com` passes a `startsWith('https://api.figma.com')`
  // test and is a different site. The cursor arrives in a response body and the
  // worker carries a credential, so the origin is compared, not the prefix.
  const env = paginatedVersionsEnv([[]], {
    FIGMA_FETCH: async(url) => {
      env.calls.push(url);

      if (url.includes('/meta')) {
        return new Response(JSON.stringify({ file: { last_touched_at: '2026-09-11T10:00:00Z' } }), { status: 200 });
      }

      return new Response(JSON.stringify({
        versions: [{ id: '1', created_at: '2026-09-15T10:00:00Z', label: null }],
        pagination: { next_page: 'https://api.figma.com.example.com/v1/files/x/versions' },
      }), { status: 200 });
    },
  });

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.ok(!env.calls.some(url => new URL(url).origin !== 'https://api.figma.com'));
});

test('a later page failing keeps the walk from erroring out (rule 18c)', async() => {
  const worker = loadWorker();
  const env = paginatedVersionsEnv([[]], {
    FIGMA_FETCH: async(url) => {
      env.calls.push(url);

      if (url.includes('/meta')) {
        return new Response(JSON.stringify({ file: { last_touched_at: '2026-09-11T10:00:00Z' } }), { status: 200 });
      }

      if (url.includes('page=1')) {
        return new Response('{}', { status: 500 });
      }

      return new Response(JSON.stringify({
        versions: [{ id: '2', created_at: '2026-09-15T10:00:00Z', label: null }],
        pagination: { next_page: 'https://api.figma.com/v1/files/test-file-key/versions?page=1' },
      }), { status: 200 });
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  // The first page answered, so the metadata fallback is still the right path.
  assert.deepEqual(await response.json(), {
    date: '2026-09-11T10:00:00Z',
    source: 'last-touched',
  });
});

test('a rejected versions call never falls back to the metadata date (rule 18c)', async() => {
  const worker = loadWorker();
  // The two endpoints carry different scopes, so a credential granted only
  // `file_metadata:read` answers 403 here and 200 there. Falling through would
  // publish the last-touched date under the "last published" wording - the
  // exact substitution this feature exists to avoid - and say nothing.
  const env = figmaEnv({
    '/meta': { file: { last_touched_at: '2026-09-11T10:00:00Z' } },
  }, {
    FIGMA_FETCH: async(url) => {
      if (url.includes('/versions')) {
        return new Response('{}', { status: 403 });
      }

      return new Response(
        JSON.stringify({ file: { last_touched_at: '2026-09-11T10:00:00Z' } }),
        { status: 200 },
      );
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), { date: null, source: null, reason: 'figma-http-403' });
});

test('a failed metadata call reports its own status, not the versions one (rule 18c)', async() => {
  const worker = loadWorker();
  // `reason` exists to point an operator at the failing call. Reporting the
  // versions status here names a 200 as the cause of a 403.
  const env = figmaEnv({}, {
    FIGMA_FETCH: async(url) => {
      if (url.includes('/versions')) {
        return new Response(
          JSON.stringify({ versions: [{ id: '1', created_at: '2026-09-15T10:00:00Z', label: null }] }),
          { status: 200 },
        );
      }

      return new Response('{}', { status: 403 });
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), { date: null, source: null, reason: 'figma-http-403' });
});

test('a version with an unparseable date cannot win the sort (rule 18c)', async() => {
  const worker = loadWorker();
  // `Date.parse` returns NaN for a malformed value, and a comparator that
  // returns NaN leaves the sort order unspecified - one bad entry is enough to
  // publish the oldest named version as the newest.
  const env = figmaEnv({
    '/versions': {
      versions: [
        { id: '1', created_at: '2026-01-01T00:00:00Z', label: 'old' },
        { id: '2', label: 'no date at all' },
        { id: '3', created_at: 'not-a-date', label: 'malformed' },
        { id: '4', created_at: '2026-09-01T09:00:00Z', label: 'newest' },
      ],
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), {
    date: '2026-09-01T09:00:00Z',
    source: 'named-version',
  });
});

test('a 200 that is not JSON is reported as such, not as unreachable (rule 18c)', async() => {
  const worker = loadWorker();
  // A proxy error page, a maintenance notice or a challenge: Figma answered,
  // so "unreachable" sends an operator to check connectivity that is fine.
  const env = figmaEnv({}, {
    FIGMA_FETCH: async() => new Response('<html>maintenance</html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    }),
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), { date: null, source: null, reason: 'figma-bad-json' });
});

test('an OAuth refresh answering with non-JSON is reported as such (rule 18c)', async() => {
  const worker = loadWorker();
  const env = oauthEnv({}, true);

  env.FIGMA_FETCH = async() => new Response('<html>maintenance</html>', {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });

  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), {
    date: null,
    source: null,
    reason: 'oauth-refresh-bad-json',
  });
});

test('does not call the metadata endpoint when a named version answered (rule 18c)', async() => {
  const worker = loadWorker();
  const env = figmaEnv({
    '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] },
  });

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(env.calls.length, 1, 'the second Figma call would be wasted work');
  assert.ok(env.calls[0].includes('/versions'));
});

test('sends the Figma token as a header and never in the URL (rule 18c)', async() => {
  const worker = loadWorker();
  const seen = [];
  const env = figmaEnv({
    '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] },
  });
  const inner = env.FIGMA_FETCH;

  env.FIGMA_FETCH = async(requestUrl, init) => {
    seen.push({ requestUrl, init });

    return inner(requestUrl, init);
  };

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(seen[0].init.headers['X-Figma-Token'], 'test-token');
  assert.ok(!seen[0].requestUrl.includes('test-token'), 'a token in the URL leaks into logs');
});

test('answers 200 with a null date when the credentials are unset (rule 18c)', async() => {
  const worker = loadWorker();

  // Until someone sets the secrets in Cloudflare, the endpoint must still
  // answer in the page's one shape - the field just stays hidden. A 500 here
  // would surface as a console error on a page that is otherwise fine.
  //
  // `reason` names which half is missing. The two are indistinguishable from
  // outside otherwise, and that is exactly what an operator needs to know.
  const cases = [
    [{ FIGMA_TOKEN: undefined }, 'no-credentials'],
    [{ FIGMA_FILE_KEY: undefined }, 'no-file-key'],
  ];

  for (const [missing, reason] of cases) {
    const env = figmaEnv({}, missing);
    const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { date: null, source: null, reason });
  }
});

test('says which OAuth secret is missing rather than going quiet (rule 18c)', async() => {
  const worker = loadWorker();
  // A half-configured OAuth setup falls back to the personal token, so this is
  // only reachable once that token is gone - which is the state staging ends
  // up in, and the state where a silent null is hardest to explain.
  const env = figmaEnv({}, { FIGMA_TOKEN: undefined, FIGMA_CLIENT_ID: 'client-id' });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), { date: null, source: null, reason: 'oauth-incomplete' });
});

test('an unset file key short-circuits before any Figma call (rule 18c)', async() => {
  const worker = loadWorker();
  const env = figmaEnv({}, { FIGMA_FILE_KEY: undefined });

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(env.calls.length, 0, 'no point calling Figma without a file key');
});

// ---------------------------------------------------------------------------
// Rule 18c: OAuth credentials
//
// A personal access token is capped at 90 days by Figma, and a plan access
// token needs an Organization/Enterprise plan this account does not have. So
// OAuth is the only credential that keeps the date alive without a diarized
// rotation, and it must be preferred whenever it is configured.
// ---------------------------------------------------------------------------

const OAUTH_ENV = {
  FIGMA_CLIENT_ID: 'client-id',
  FIGMA_CLIENT_SECRET: 'client-secret',
  FIGMA_REFRESH_TOKEN: 'refresh-token',
};

/**
 * Records each Figma request with its init, so the auth headers can be
 * asserted. Answers the OAuth refresh with an access token, and the versions
 * endpoint with one named version.
 *
 * @param {object} [overrides] Extra env fields.
 * @param {boolean} [refreshOk] Whether the refresh call succeeds.
 * @returns {object}
 */
function oauthEnv(overrides = {}, refreshOk = true) {
  const seen = [];

  return {
    ASSETS: { fetch: async() => new Response('static-asset-passthrough') },
    FIGMA_FILE_KEY: 'test-file-key',
    ...OAUTH_ENV,
    seen,
    FIGMA_FETCH: async(url, init) => {
      seen.push({ url, init });

      if (url.includes('/oauth/refresh')) {
        return new Response(
          JSON.stringify({ access_token: 'fresh-access-token', token_type: 'bearer', expires_in: 7776000 }),
          { status: refreshOk ? 200 : 401 },
        );
      }

      return new Response(
        JSON.stringify({ versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] }),
        { status: 200 },
      );
    },
    ...overrides,
  };
}

test('exchanges the refresh token and calls Figma as Bearer (rule 18c)', async() => {
  const worker = loadWorker();
  const env = oauthEnv();
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.deepEqual(await response.json(), { date: '2026-09-01T09:00:00Z', source: 'named-version' });

  const [refresh, versions] = env.seen;

  assert.ok(refresh.url.endsWith('/v1/oauth/refresh'), 'the refresh must come first');
  assert.equal(refresh.init.method, 'POST');
  assert.equal(refresh.init.headers['Content-Type'], 'application/x-www-form-urlencoded');
  // Figma authenticates the refresh with HTTP Basic, not body parameters.
  assert.equal(refresh.init.headers.Authorization, `Basic ${btoa('client-id:client-secret')}`);
  assert.equal(refresh.init.body, 'refresh_token=refresh-token');

  // An OAuth token is a Bearer token; sending it as X-Figma-Token 401s.
  assert.equal(versions.init.headers.Authorization, 'Bearer fresh-access-token');
  assert.equal(versions.init.headers['X-Figma-Token'], undefined);
});

test('OAuth wins over a personal access token when both are set (rule 18c)', async() => {
  const worker = loadWorker();
  // The personal token is the stopgap. If someone leaves it behind after
  // setting OAuth up, the 90-day cap must not quietly come back.
  const env = oauthEnv({ FIGMA_TOKEN: 'stale-personal-token' });

  await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  const versions = env.seen.find(call => call.url.includes('/versions'));

  assert.equal(versions.init.headers.Authorization, 'Bearer fresh-access-token');
  assert.equal(versions.init.headers['X-Figma-Token'], undefined);
});

test('a rejected refresh hides the field instead of erroring (rule 18c)', async() => {
  const worker = loadWorker();
  // This is what an expired or revoked refresh token looks like.
  const env = oauthEnv({}, false);
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(response.status, 200);
  // The status is carried through: 401 is a revoked or mistyped refresh token,
  // which is the difference between "fix the secret" and "Figma is down".
  assert.deepEqual(await response.json(), {
    date: null,
    source: null,
    reason: 'oauth-refresh-http-401',
  });
  assert.equal(env.seen.length, 1, 'a failed refresh must not go on to call the API');
});

test('a partial OAuth setup falls back to the personal token (rule 18c)', async() => {
  const worker = loadWorker();

  // Half-configured OAuth must not disable a working personal token - that
  // would take the date down while someone is midway through the setup.
  for (const partial of ['FIGMA_CLIENT_ID', 'FIGMA_CLIENT_SECRET', 'FIGMA_REFRESH_TOKEN']) {
    const env = oauthEnv({ [partial]: undefined, FIGMA_TOKEN: 'personal-token' });

    await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

    const versions = env.seen.find(call => call.url.includes('/versions'));

    assert.equal(versions.init.headers['X-Figma-Token'], 'personal-token', `missing ${partial}`);
    assert.ok(!env.seen.some(call => call.url.includes('/oauth/refresh')), `missing ${partial}`);
  }
});

test('answers 200 with a null date when Figma fails outright (rule 18c)', async() => {
  const worker = loadWorker();
  // Nothing matches, so both endpoints answer 500 - a revoked token, a rate
  // limit, or an outage all land here.
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), figmaEnv({}));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { date: null, source: null, reason: 'figma-http-500' });
});

test('answers 200 with a null date when the Figma call throws (rule 18c)', async() => {
  const worker = loadWorker();
  const env = figmaEnv({}, {
    FIGMA_FETCH: async() => {
      throw new TypeError('network unreachable');
    },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { date: null, source: null, reason: 'figma-unreachable' });
});

test('a real date is cacheable for a day (rule 18c)', async() => {
  const worker = loadWorker();
  const env = figmaEnv({
    '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

  assert.equal(response.headers.get('cache-control'), 'public, max-age=86400');
});

test('a null date is cached for minutes, not a day (rule 18c)', async() => {
  const worker = loadWorker();

  // Regression for a real incident on staging: the `null` cached before the
  // Figma secrets were set outlived them, so the endpoint returned the real
  // date to a cache-busted request while the page still read a stale `null`.
  // Caching a failure for a day turns any blip - unset secret, expired token,
  // rate limit, outage - into 24 hours of blank field after it is fixed.
  for (const env of [figmaEnv({}), figmaEnv({}, { FIGMA_FILE_KEY: undefined })]) {
    const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

    assert.equal((await response.json()).date, null);
    assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
  }
});

/**
 * Installs a stand-in `caches.default` and returns the keys written to it.
 *
 * Node has no `caches`, so the worker's cache branch is otherwise dead code in
 * these tests - which is exactly why the staging cache bug got through. The
 * worker is loaded through `new Function`, so a global here is what it sees.
 *
 * @returns {{puts: string[], restore: Function}}
 */
function stubEdgeCache({ hit = null } = {}) {
  const puts = [];

  globalThis.caches = {
    default: {
      match: async() => hit ?? undefined,
      put: async(key, value) => {
        puts.push({
          url: typeof key === 'string' ? key : key.url,
          maxAge: value.headers.get('cache-control'),
        });
      },
    },
  };

  return { puts, restore: () => delete globalThis.caches };
}

test('a cache hit is served without touching Figma (rule 18c)', async() => {
  const worker = loadWorker();
  // The one path that serves a stored body, and the path the staging incident
  // ran through. It was never exercised while the stub always missed.
  const hit = new Response(JSON.stringify({ date: '2026-08-20T13:29:35Z', source: 'named-version' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
  const { puts, restore } = stubEdgeCache({ hit });
  const env = figmaEnv({
    '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'newer' }] },
  });

  try {
    const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

    assert.deepEqual(await response.json(), { date: '2026-08-20T13:29:35Z', source: 'named-version' });
    assert.deepEqual(env.calls, [], 'a hit must not call Figma at all');
    assert.deepEqual(puts, [], 'a hit must not rewrite the entry');
  } finally {
    restore();
  }
});

test('a failure is cached for minutes, a real date for a day (rule 18c)', async() => {
  const worker = loadWorker();
  const { puts, restore } = stubEdgeCache();

  // The staging incident in full: a `null` stored at the edge outlived the
  // secrets that would have fixed it, and `*.pages.dev` cannot be purged from
  // the dashboard. The TTL is what bounds that now - five minutes, not a day -
  // while still storing the failure, so a Figma outage does not make every
  // request re-run the OAuth refresh and the history walk.
  try {
    await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), figmaEnv({}));

    assert.equal(puts.length, 1, 'a failure is cached, briefly');
    assert.equal(puts[0].maxAge, 'public, max-age=300');

    await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), figmaEnv({
      '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] },
    }));

    assert.equal(puts.length, 2);
    assert.equal(puts[1].maxAge, 'public, max-age=86400');
    assert.match(puts[1].url, /\/docs\/api\/design-system-updated\.json\?v=\d+$/,
      'the cache key must carry a version, the only way to orphan a bad entry');
  } finally {
    restore();
  }
});

test('a date found after a broken walk is never pinned for a day (rule 18c)', async() => {
  const worker = loadWorker();
  const { puts, restore } = stubEdgeCache();
  // Page one holds only autosaves and points at a page two that fails. The
  // metadata date then stands in for a history nobody finished reading, so it
  // may be covering a publish further back - three weeks back, on the real
  // file. Caching that for a day pins the wrong one of the two dates.
  const env = paginatedVersionsEnv([[]], {
    FIGMA_FETCH: async(url) => {
      if (url.includes('/meta')) {
        return new Response(JSON.stringify({ file: { last_touched_at: '2026-09-11T10:00:00Z' } }), { status: 200 });
      }

      if (url.includes('page=1')) {
        return new Response('{}', { status: 429 });
      }

      return new Response(JSON.stringify({
        versions: [{ id: '2', created_at: '2026-09-15T10:00:00Z', label: null }],
        pagination: { next_page: 'https://api.figma.com/v1/files/test-file-key/versions?page=1' },
      }), { status: 200 });
    },
  });

  try {
    const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH), env);

    assert.equal(response.headers.get('cache-control'), 'public, max-age=300');
    assert.equal(puts[0].maxAge, 'public, max-age=300');
    // `provisional` is internal bookkeeping, not part of the page's contract.
    assert.deepEqual(await response.json(), {
      date: '2026-09-11T10:00:00Z',
      source: 'last-touched',
    });
  } finally {
    restore();
  }
});

test('a cache-busting query string does not create a second entry (rule 18c)', async() => {
  const worker = loadWorker();
  const { puts, restore } = stubEdgeCache();

  try {
    const env = figmaEnv({
      '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] },
    });

    await worker.fetch(request(`${DESIGN_SYSTEM_DATE_PATH}?cb=1`), env);
    await worker.fetch(request(`${DESIGN_SYSTEM_DATE_PATH}?cb=2`), env);

    assert.equal(new Set(puts.map(put => put.url)).size, 1, 'every caller shares one cache entry');
  } finally {
    restore();
  }
});

test('HEAD answers like GET, so probes do not read the endpoint as dead (rule 18c)', async() => {
  const worker = loadWorker();
  // Link checkers, uptime probes and CDN preflights default to HEAD. Falling
  // through to env.ASSETS would 404 a working endpoint.
  const env = figmaEnv({
    '/versions': { versions: [{ id: '1', created_at: '2026-09-01T09:00:00Z', label: 'v2.1' }] },
  });
  const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH, undefined, 'HEAD'), env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
});

test('other methods on the date endpoint fall through to assets (rule 18c)', async() => {
  const worker = loadWorker();

  for (const method of ['POST', 'PUT', 'DELETE']) {
    const env = figmaEnv({});
    const response = await worker.fetch(request(DESIGN_SYSTEM_DATE_PATH, undefined, method), env);

    assert.equal(await response.text(), 'static-asset-passthrough', method);
    assert.equal(env.calls.length, 0, `${method} must not reach Figma`);
  }
});
