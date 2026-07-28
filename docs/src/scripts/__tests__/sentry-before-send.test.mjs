import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import vm from 'node:vm';

const configPath = fileURLToPath(new URL('../../../astro.config.mjs', import.meta.url));
const configSource = readFileSync(configPath, 'utf8');

const loaderScript = configSource.match(/content: `(window\.sentryOnLoad[\s\S]*?)`,\n/);

assert.ok(loaderScript, 'astro.config.mjs must inline a window.sentryOnLoad Sentry Loader hook');

/**
 * Runs the inlined Sentry Loader hook and returns the `beforeSend` it registers.
 */
function loadBeforeSend() {
  const window = {};
  let options = null;
  const context = vm.createContext({
    window,
    Sentry: {
      init(initOptions) {
        options = initOptions;
      },
    },
  });

  // The hook is authored inside a template literal, so the source read from disk still
  // carries its escapes (`\\d{3}`). Evaluating it as a template literal yields the exact
  // script the browser receives.
  const script = vm.runInContext(`\`${loaderScript[1]}\``, context);

  vm.runInContext(script, context);
  window.sentryOnLoad();

  assert.ok(options && typeof options.beforeSend === 'function');

  return options.beforeSend;
}

const beforeSend = loadBeforeSend();

/**
 * Minimal shape of the fields `beforeSend` reads off an error event.
 */
function errorEvent(url, message) {
  return { request: { url }, exception: { values: [{ value: message }] } };
}

test('drops errors from opaque-origin documents (about:blank crawler renders)', () => {
  // Sentry HANDSONTABLE-DOCS-206: headless crawlers inject the page with
  // `page.setContent()`, leaving every frame at about:blank.
  const event = errorEvent(
    'about:blank',
    "Failed to read the 'localStorage' property from 'Window': Access is denied for this document."
  );

  assert.equal(beforeSend(event, {}), null);
});

test('keeps errors from real documentation pages', () => {
  const event = errorEvent(
    'https://handsontable.com/docs/javascript-data-grid/',
    "Cannot read properties of undefined (reading 'getPlugin')"
  );

  assert.equal(beforeSend(event, {}), event);
});

test('drops expected HTTP errors from the server-side data recipe pages', () => {
  const event = errorEvent(
    'https://handsontable.com/docs/javascript-data-grid/recipes/data-management/server-side-data/',
    'HTTP 404'
  );

  assert.equal(beforeSend(event, {}), null);
});

test('keeps HTTP errors raised outside the server-side data recipe pages', () => {
  const event = errorEvent('https://handsontable.com/docs/javascript-data-grid/', 'HTTP 404');

  assert.equal(beforeSend(event, {}), event);
});

test('drops errors thrown by Handsontable throwWithCause()', () => {
  const url = 'https://handsontable.com/docs/javascript-data-grid/column-summary/';
  const event = errorEvent(url, 'The provided data is not suitable for the column summary.');
  const hint = { originalException: { cause: { handsontable: true } } };

  assert.equal(beforeSend(event, hint), null);
});
