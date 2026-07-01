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

function request(path, cookie) {
  return {
    url: `https://handsontable.com${path}`,
    headers: { get: (name) => (name === 'Cookie' && cookie ? `docs_fw=${cookie}` : null) },
  };
}

const env = { ASSETS: { fetch: async() => new Response('static-asset-passthrough') } };

async function redirectLocationOf(worker, path, cookie) {
  const response = await worker.fetch(request(path, cookie), env);

  return response.headers.get('location');
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
