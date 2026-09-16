import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

/**
 * The script ships from `public/` so it is served by URL and cached, the same
 * way `public/example-tabs.js` is. It is loaded here as source and run against
 * a stand-in `window`/`document`, the way the deferred head script runs it.
 */
const scriptPath = fileURLToPath(new URL('../../../public/scripts/design-system-updated.js', import.meta.url));
const scriptSource = readFileSync(scriptPath, 'utf8');

/**
 * Minimal stand-in for one `<p data-design-system-updated>` element.
 *
 * `display: 'none'` is the starting state the markup sets inline, so a test
 * asserting the field stayed hidden is asserting the script left it alone.
 *
 * @param {string} [prefix]
 * @returns {object}
 */
function field(prefix = '') {
  return {
    textContent: '',
    style: { display: 'none' },
    getAttribute: name => (name === 'data-prefix' ? prefix : null),
  };
}

/**
 * Runs the script against a fake page and resolves once its fetch chain has
 * settled.
 *
 * @param {object[]} fields Elements `querySelectorAll` should return.
 * @param {Function} fetchImpl Stand-in for `window.fetch`.
 * @returns {Promise<{selectors: string[], fetched: string[]}>}
 */
async function run(fields, fetchImpl) {
  const selectors = [];
  const fetched = [];
  const window = {
    fetch: fetchImpl && ((url) => {
      fetched.push(url);

      return fetchImpl(url);
    }),
  };
  const document = {
    // 'complete', not 'loading': the script must also work when it runs after
    // DOMContentLoaded has already fired, where a listener would never run.
    readyState: 'complete',
    addEventListener: () => {
      throw new Error('must not wait for DOMContentLoaded when the document is already complete');
    },
    querySelectorAll: (selector) => {
      selectors.push(selector);

      return fields;
    },
  };

  vm.runInContext(scriptSource, vm.createContext({ window, document }));

  // Let the fetch chain settle. Two turns cover the two chained `.then()`s.
  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));

  return { selectors, fetched };
}

/**
 * A `fetch` stand-in that answers the endpoint with the given JSON payload.
 *
 * @param {object} payload
 * @param {boolean} [ok]
 * @returns {Function}
 */
function respondWith(payload, ok = true) {
  return async() => ({ ok, json: async() => payload });
}

test('fills and reveals the field for a named version, using the page prefix', async() => {
  // The separator is a plain hyphen, matching the prefix the changelog page
  // sets. The docs site uses hyphens and never dashes (docs/AGENTS.md 2.2),
  // and an em dash here would look identical while rendering the wrong
  // character on the page.
  const target = field('Design system - ');

  await run([target], respondWith({ date: '2026-09-01T09:00:00Z', source: 'named-version' }));

  assert.equal(target.textContent, 'Design system - last published: September 1, 2026');
  assert.equal(target.style.display, '', 'the field must be revealed');
});

test('labels a last-touched date differently from a published one', async() => {
  // The two dates mean different things - a named version is the design team
  // marking a release, last-touched is any edit at all - so the field must not
  // present them with the same wording.
  const target = field();

  await run([target], respondWith({ date: '2026-09-15T10:00:00Z', source: 'last-touched' }));

  assert.equal(target.textContent, 'last Figma update: September 15, 2026');
  assert.equal(target.style.display, '');
});

test('fills every field on the page, not just the first', async() => {
  const first = field('A ');
  const second = field('B ');

  await run([first, second], respondWith({ date: '2026-09-01T09:00:00Z', source: 'named-version' }));

  assert.equal(first.textContent, 'A last published: September 1, 2026');
  assert.equal(second.textContent, 'B last published: September 1, 2026');
});

test('leaves the field hidden when the endpoint reports no date', async() => {
  // This is the normal state until the Figma secrets are set in Cloudflare -
  // by far the most common case, and it must look like nothing was ever added.
  const target = field();

  await run([target], respondWith({ date: null, source: null }));

  assert.equal(target.style.display, 'none');
  assert.equal(target.textContent, '');
});

test('leaves the field hidden when the endpoint errors', async() => {
  const target = field();

  await run([target], respondWith({}, false));

  assert.equal(target.style.display, 'none');
});

test('leaves the field hidden when the fetch rejects', async() => {
  const target = field();

  await run([target], async() => {
    throw new TypeError('network unreachable');
  });

  assert.equal(target.style.display, 'none');
});

test('leaves the field hidden when the date does not parse', async() => {
  const target = field();

  await run([target], respondWith({ date: 'not-a-date', source: 'named-version' }));

  assert.equal(target.style.display, 'none');
  assert.equal(target.textContent, '');
});

test('makes no request on a page that carries no field', async() => {
  // The script is injected into every docs page and used on two, so "free
  // everywhere else" is a claim worth pinning.
  const { selectors, fetched } = await run([], respondWith({ date: '2026-09-01T09:00:00Z' }));

  assert.deepEqual(selectors, ['[data-design-system-updated]']);
  assert.deepEqual(fetched, [], 'a page with no field must not call the endpoint');
});

test('makes no request when the browser has no fetch', async() => {
  const target = field();

  await run([target], null);

  assert.equal(target.style.display, 'none');
});

test('requests the same-origin worker route, never the Figma API directly', async() => {
  // A direct browser call to api.figma.com would need a public token and is
  // blocked by the site CSP's connect-src anyway.
  const { fetched } = await run(
    [field()],
    respondWith({ date: '2026-09-01T09:00:00Z', source: 'named-version' }),
  );

  assert.deepEqual(fetched, ['/docs/api/design-system-updated.json']);
});
