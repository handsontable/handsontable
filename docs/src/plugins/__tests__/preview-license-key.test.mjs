import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { parse as parseSfc } from '@vue/compiler-sfc';
import {
  TEST_KEY_MARKER,
  checkEveryExampleRewritten,
  checkKeyInOutput,
  injectLicenseKey,
  isExecutedExampleId,
  listExamplesWithPlaceholder,
  resolvePreviewLicenseKey,
} from '../preview-license-key.mjs';
import { TEST_LICENSE_KEY } from '../../test-license-key.mjs';

const DOCS_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const CONTENT_DIR = join(DOCS_DIR, 'content');
const KEY_JSON = JSON.stringify(TEST_LICENSE_KEY);
// The block `preprocessAngularTs()` in astro.config.mjs strips from a .ts example.
const SKIP_IN_COMPILATION = /\/\*\s*start:skip-in-compilation\s*\*\/[\s\S]*?\/\*\s*end:skip-in-compilation\s*\*\//g;

test('the docs constant holds the internal test key, which carries double quotes', () => {
  assert.ok(TEST_LICENSE_KEY.includes(TEST_KEY_MARKER));
  // The reason the rewrite emits `JSON.stringify(key)` instead of the file's own quote style.
  assert.ok(TEST_LICENSE_KEY.includes('"'));
});

test('rewrites the JavaScript and Vue placeholder in single and double quotes', () => {
  const code = [
    'const hot = new Handsontable(container, {',
    '  data,',
    "  // licenseKey: 'your-license-key', // get a key at https://handsontable.com/pricing/",
    '});',
    'const other = new Handsontable(container2, {',
    '    // licenseKey: "your-license-key", // get a key at https://handsontable.com/pricing/',
    '});',
  ].join('\n');
  const out = injectLicenseKey(code, TEST_LICENSE_KEY);

  assert.equal(out.split('\n').length, code.split('\n').length);
  assert.equal(out.split('\n')[2], `  licenseKey: ${KEY_JSON},`);
  assert.equal(out.split('\n')[5], `    licenseKey: ${KEY_JSON},`);
  assert.ok(!out.includes('your-license-key'));
});

test('rewrites the Angular `license` placeholder in HOT_GLOBAL_CONFIG', () => {
  const code = [
    '      useValue: {',
    "        // license: 'your-license-key', // get a key at https://handsontable.com/pricing/",
    '      } as HotGlobalConfig,',
  ].join('\n');

  assert.equal(injectLicenseKey(code, TEST_LICENSE_KEY).split('\n')[1], `        license: ${KEY_JSON},`);
});

test('rewrites the JSX attribute placeholder into a braced string', () => {
  const code = [
    '    <HotTable',
    '      // licenseKey="your-license-key" // get a key at https://handsontable.com/pricing/',
    '      data={data}',
    '    />',
  ].join('\n');

  assert.equal(injectLicenseKey(code, TEST_LICENSE_KEY).split('\n')[1], `      licenseKey={${KEY_JSON}}`);
});

test('leaves code without a placeholder, and prose that names it, untouched', () => {
  const code = [
    "const text = '// licenseKey: \\'your-license-key\\',';",
    "<!-- license-key=\"your-license-key\" (get a key at https://handsontable.com/pricing/) -->",
    "  licenseKey: 'real-key',",
  ].join('\n');

  assert.equal(injectLicenseKey(code, TEST_LICENSE_KEY), code);
});

test('matches only the example modules the runner executes, never a displayed or raw one', () => {
  const base = '/repo/docs/content/guides/rows/row-moving';

  assert.equal(isExecutedExampleId(`${base}/javascript/example1.js`), true);
  assert.equal(isExecutedExampleId(`${base}/javascript/example1.ts`), true);
  assert.equal(isExecutedExampleId(`${base}/react/example1.jsx`), true);
  assert.equal(isExecutedExampleId(`${base}/vue/example1.vue`), true);
  assert.equal(isExecutedExampleId(`${base}/vue/example1.js`), true);
  assert.equal(isExecutedExampleId(`${base}/angular/example1.ts`), true);

  // Displayed only: the runner never imports .tsx, and the data files feed rendered code snippets.
  assert.equal(isExecutedExampleId(`${base}/react/example1.tsx`), false);
  assert.equal(isExecutedExampleId('/repo/docs/content/data/version-highlights/15.0.json'), false);
  // A query id is another module: `?raw` exports the text, `?vue&type=` is a compiled SFC block.
  assert.equal(isExecutedExampleId(`${base}/javascript/example1.js?raw`), false);
  assert.equal(isExecutedExampleId(`${base}/vue/example1.vue?vue&type=script&setup=true&lang.ts`), false);
  assert.equal(isExecutedExampleId(`${base}/javascript/example1.html`), false);
  // The runner globs `.vue` only in a `vue/` folder.
  assert.equal(isExecutedExampleId(`${base}/javascript/example1.vue`), false);
  assert.equal(isExecutedExampleId('/repo/docs/src/scripts/example-runner.ts'), false);
  assert.equal(isExecutedExampleId('/repo/docs/content/guides/rows/row-moving/helpers.js'), false);
});

test('returns the key only for an opted-in build that is not production', () => {
  assert.equal(resolvePreviewLicenseKey({}), null);
  assert.equal(resolvePreviewLicenseKey({ DOCS_TEST_LICENSE_KEY: '1' }), null);
  assert.equal(resolvePreviewLicenseKey({ DOCS_TEST_LICENSE_KEY: 'true', BUILD_MODE: 'production' }), null);
  assert.equal(resolvePreviewLicenseKey({ DOCS_TEST_LICENSE_KEY: 'true' }), TEST_LICENSE_KEY);
  assert.equal(resolvePreviewLicenseKey({ DOCS_TEST_LICENSE_KEY: 'true', BUILD_MODE: 'preview' }), TEST_LICENSE_KEY);
});

/**
 * Lists the files under a directory.
 *
 * @param {string} dir An absolute directory path.
 * @returns {string[]} Absolute file paths.
 */
function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => (entry.isDirectory()
    ? walk(join(dir, entry.name))
    : [join(dir, entry.name)]));
}

/**
 * Returns the syntax errors of a module, as TypeScript reports them.
 *
 * @param {string} code The module text.
 * @param {string} fileName A file name whose extension picks the parser.
 * @returns {string[]} The error messages.
 */
function syntaxErrors(code, fileName) {
  const { diagnostics } = ts.transpileModule(code, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: { jsx: ts.JsxEmit.Preserve, experimentalDecorators: true },
  });

  return diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
}

/**
 * Returns the syntax errors of every script block of a module (one for js/jsx/ts, the script blocks for vue).
 *
 * @param {string} code The module text.
 * @param {string} file The file path.
 * @returns {string[]} The error messages.
 */
function moduleSyntaxErrors(code, file) {
  if (file.endsWith('.vue')) {
    const { descriptor, errors } = parseSfc(code, { filename: file });

    return [
      ...errors.map(error => String(error.message ?? error)),
      ...[descriptor.script, descriptor.scriptSetup].filter(Boolean)
        .flatMap(block => syntaxErrors(block.content, `block.${block.lang === 'ts' ? 'ts' : 'js'}`)),
    ];
  }

  return syntaxErrors(code, `module${extname(file)}`);
}

test('every executed example gets the key, and still parses', () => {
  const examples = walk(CONTENT_DIR).filter(file => isExecutedExampleId(file));
  let replaced = 0;
  const leftover = [];
  const keyless = [];
  const misplacedLicense = [];
  const broken = [];
  const stripped = [];

  for (const file of examples) {
    const code = readFileSync(file, 'utf8');
    const out = injectLicenseKey(code, TEST_LICENSE_KEY);

    const count = out.split(KEY_JSON).length - 1;

    replaced += count;

    if (out.includes('your-license-key')) {
      leftover.push(relative(DOCS_DIR, file));
    }

    // An example without a placeholder builds without a key and shows the lock screen on previews.
    if (count === 0) {
      keyless.push(relative(DOCS_DIR, file));
    }

    // `license` is the Angular `HOT_GLOBAL_CONFIG` option. Anywhere else the grid ignores it.
    if (!file.includes('/angular/') && out.includes(`license: ${KEY_JSON}`)) {
      misplacedLicense.push(relative(DOCS_DIR, file));
    }

    // Compare with the source: an example may already carry an error of its own, and the rewrite
    // must not add one.
    if (out !== code && moduleSyntaxErrors(out, file).length > moduleSyntaxErrors(code, file).length) {
      broken.push(relative(DOCS_DIR, file));
    }

    // `preprocessAngularTs()` in astro.config.mjs drops these blocks before it compiles a .ts example,
    // so a key written inside one never reaches the grid.
    if (file.endsWith('.ts')
      && out.replace(SKIP_IN_COMPILATION, '').split(KEY_JSON).length < out.split(KEY_JSON).length) {
      stripped.push(relative(DOCS_DIR, file));
    }
  }

  assert.deepEqual(leftover, [], 'These examples hold a placeholder the rewrite does not know. Use a form from '
    + 'docs/AGENTS.md, 2.5, or teach `injectLicenseKey()` the new one.');
  assert.deepEqual(keyless, [], 'These executed examples hold no license key placeholder, so their grids show the '
    + 'lock screen on the previews. Add the placeholder from docs/AGENTS.md, 2.5.');
  assert.deepEqual(misplacedLicense, [], 'These examples use the Angular `license` placeholder, which only an '
    + 'Angular `HOT_GLOBAL_CONFIG` reads. Use `licenseKey`.');
  assert.deepEqual(broken, [], 'The rewrite breaks the syntax of these examples.');
  assert.deepEqual(stripped, [], 'These Angular examples hold the placeholder inside a skip-in-compilation block, '
    + 'which the build drops. Move it out of the block.');
  assert.ok(examples.length > 1500, `Only ${examples.length} executed examples found; check isExecutedExampleId().`);
  // The build check's list of examples to rewrite is the same set.
  assert.equal(listExamplesWithPlaceholder(CONTENT_DIR).length, examples.length);
  assert.ok(replaced >= examples.length, `Only ${replaced} placeholders replaced in ${examples.length} examples.`);
});

test('the build check fails on a key in displayed output, on a key missing from an injected build, '
  + 'and on any key when nothing was injected', () => {
  const dist = mkdtempSync(join(tmpdir(), 'docs-dist-'));

  try {
    mkdirSync(join(dist, '_astro'));
    mkdirSync(join(dist, 'javascript-data-grid'));
    writeFileSync(join(dist, 'javascript-data-grid', 'index.html'), '<pre>// licenseKey: your-license-key</pre>');
    writeFileSync(join(dist, '_astro', 'page.js'), 'const page = 1;');

    // An injected build that never reached the example modules ships lock screens.
    assert.throws(() => checkKeyInOutput(dist, { injected: true }), /no script chunk holds/);
    assert.doesNotThrow(() => checkKeyInOutput(dist, { injected: false }));

    writeFileSync(join(dist, '_astro', 'example1.js'), `const key = ${KEY_JSON};`);

    // An injected build holds the key in its example chunks only.
    assert.doesNotThrow(() => checkKeyInOutput(dist, { injected: true }));
    assert.throws(() => checkKeyInOutput(dist, { injected: false }), /_astro\/example1\.js/);

    writeFileSync(join(dist, 'javascript-data-grid', 'index.html'), `<pre>licenseKey: ${KEY_JSON}</pre>`);
    assert.throws(() => checkKeyInOutput(dist, { injected: true }), /javascript-data-grid\/index\.html/);
    writeFileSync(join(dist, 'javascript-data-grid', 'index.html'), '<pre>// licenseKey: your-license-key</pre>');

    writeFileSync(join(dist, 'llms-full.txt'), `licenseKey: ${KEY_JSON}`);
    assert.throws(() => checkKeyInOutput(dist, { injected: true }), /llms-full\.txt/);
    rmSync(join(dist, 'llms-full.txt'));

    writeFileSync(join(dist, 'javascript-data-grid', 'index.md'), `licenseKey: ${KEY_JSON}`);
    assert.throws(() => checkKeyInOutput(dist, { injected: true }), /javascript-data-grid\/index\.md/);
  } finally {
    rmSync(dist, { recursive: true, force: true });
  }
});

test('the build check fails when an executed example never reached the rewrite', () => {
  const expected = ['/repo/docs/content/a/javascript/example1.js', '/repo/docs/content/a/vue/example1.vue'];

  assert.doesNotThrow(() => checkEveryExampleRewritten(expected, new Set(expected)));
  // The JS chunk holds the key, but the Vue example was skipped (for example, its id gained a query).
  assert.throws(() => checkEveryExampleRewritten(expected, new Set([expected[0]])), /1 executed examples .*vue\/example1\.vue/);
  assert.doesNotThrow(() => checkEveryExampleRewritten(['C:\\repo\\docs\\content\\a\\react\\example1.jsx'],
    new Set(['C:/repo/docs/content/a/react/example1.jsx'])));
});
