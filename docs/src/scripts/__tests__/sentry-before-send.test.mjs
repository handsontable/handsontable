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

test('drops network failures on the server-side recipe pages', () => {
  // Sentry HANDSONTABLE-DOCS-1FM: these pages have no backend on the docs site, so a
  // request that never completes is as expected as the HTTP 404 above. Each engine words
  // the resulting network failure differently.
  //
  // The fixture URL is deliberately a current page. Events from an archived
  // /docs/<major>.<minor>/ build cannot reach this hook at all (that HTML ships its own
  // copy of it), so a versioned fixture here would assert coverage the site does not have.
  const url = 'https://handsontable.com/docs/angular-data-grid/recipes/data-management/server-side-nestjs/';

  for (const message of [
    'Failed to fetch',
    'NetworkError when attempting to fetch resource.',
    'Load failed',
  ]) {
    const event = errorEvent(url, message);

    assert.equal(beforeSend(event, {}), null, `expected "${message}" to be dropped`);
  }
});

test('keeps network failures raised outside the server-side recipe pages', () => {
  // A broken fetch anywhere else is a real defect and must stay visible.
  const event = errorEvent('https://handsontable.com/docs/javascript-data-grid/', 'Failed to fetch');

  assert.equal(beforeSend(event, {}), event);
});

test('drops failed dynamic imports of content-hashed chunks', () => {
  // Sentry HANDSONTABLE-DOCS-1FH and HANDSONTABLE-DOCS-1FX: stale cached HTML asking
  // for chunks a newer deployment no longer serves. These arrive through
  // onunhandledrejection, so no application-level try/catch can reach them.
  const url = 'https://handsontable.com/docs/react-data-grid/installation/';

  for (const message of [
    'Failed to fetch dynamically imported module: https://handsontable.com/docs/_astro/index.mZKjvrN9.js',
    'error loading dynamically imported module: https://handsontable.com/docs/_astro/compiler.IHUD3Be3.js',
    'Importing a module script failed.',
  ]) {
    const event = errorEvent(url, message);

    assert.equal(beforeSend(event, {}), null, `expected "${message}" to be dropped`);
  }
});

test('keeps genuine TypeErrors that merely mention a module', () => {
  // The chunk-load filter matches whole phrases, so ordinary runtime errors survive.
  const event = errorEvent(
    'https://handsontable.com/docs/react-data-grid/installation/',
    "Cannot read properties of undefined (reading 'module')"
  );

  assert.equal(beforeSend(event, {}), event);
});

test('drops errors thrown by Handsontable throwWithCause()', () => {
  const url = 'https://handsontable.com/docs/javascript-data-grid/column-summary/';
  const event = errorEvent(url, 'The provided data is not suitable for the column summary.');
  const hint = { originalException: { cause: { handsontable: true } } };

  assert.equal(beforeSend(event, hint), null);
});

/**
 * An error event whose single exception carries the given stack frames.
 */
function eventWithFrames(message, files) {
  return {
    request: { url: 'https://handsontable.com/docs/javascript-data-grid/changelog/' },
    exception: {
      values: [{ value: message, stacktrace: { frames: files.map((file) => ({ abs_path: file, filename: file })) } }],
    },
  };
}

test('drops errors raised entirely inside Google Tag Manager tags', () => {
  // Sentry HANDSONTABLE-DOCS-24E, -25A: GTM Custom HTML tags reference globals the docs
  // never load. Every frame is gtm.js, gtag/js, or the anonymous code the tag injects.
  const event = eventWithFrames('jQuery is not defined', [
    'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
    'https://www.googletagmanager.com/gtag/js?id=G-XXXX',
    '/gtm.js',
    '<anonymous>',
  ]);

  assert.equal(beforeSend(event, {}), null);
});

test('keeps a GTM-triggered error that runs through our own bundle', () => {
  // A single first-party frame means our code broke, whoever called it.
  const event = eventWithFrames("Cannot read properties of undefined (reading 'default')", [
    'https://www.googletagmanager.com/gtm.js?id=GTM-XXXX',
    '<anonymous>',
    'https://handsontable.com/docs/_astro/Head.astro_astro_type_script_index_1_lang.tTmdsO3H.js',
  ]);

  assert.equal(beforeSend(event, {}), event);
});

test('keeps an error whose frames are all anonymous, with no GTM frame', () => {
  // `<anonymous>` alone does not prove GTM injected the code, so the event stays visible.
  const event = eventWithFrames('jQuery is not defined', ['<anonymous>', '<anonymous>']);

  assert.equal(beforeSend(event, {}), event);
});

test('keeps an error that has no stack frames at all', () => {
  // The GTM rule needs at least one frame to judge by.
  const event = errorEvent('https://handsontable.com/docs/javascript-data-grid/', 'jQuery is not defined');

  assert.equal(beforeSend(event, {}), event);
});

test('drops cross-origin "Script error." reports', () => {
  // Sentry HANDSONTABLE-DOCS-24A, -245, -247: the only frame left is the page URL itself.
  const url = 'https://handsontable.com/docs/javascript-data-grid/';

  for (const message of [
    'Script error.',
    'Event `ErrorEvent` captured as exception with message `Script error.`',
  ]) {
    assert.equal(beforeSend(errorEvent(url, message), {}), null, `expected "${message}" to be dropped`);
  }

  assert.equal(beforeSend(eventWithFrames('Script error.', [url]), {}), null);
  assert.equal(beforeSend({ request: { url }, message: 'Script error.' }, {}), null);
});

test('keeps errors that merely mention a script error', () => {
  const event = errorEvent('https://handsontable.com/docs/javascript-data-grid/', 'Script error in example1.js');

  assert.equal(beforeSend(event, {}), event);
});
