import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Every test grid reads its license key from one constant per suite, so a new test key is a
// one-line change. A test that writes the key out again would keep the old key after that change,
// and its grid would get the lock screen once the key stops working. This guard fails on such a
// literal anywhere in the test trees, outside the files below.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// The text of the internal test key every constant holds (issued with `npm run
// generate-internal-test-key` in the private `license-key` package). It names its holder in capitals.
const TEST_KEY_MARKER = 'HANDSONTABLE INTERNAL TEST KEY';

// Both spellings of the non-commercial key, which the core reads as invalid since 19.0, and the test key.
const LITERALS = ['non-commercial-and-evaluation', 'ht68e-1f2b7-47158-70b05-0842f', TEST_KEY_MARKER];

// One constant per suite, per visual-test demo app, and one for the docs previews. They must hold the
// same key, so renewing it means pasting one new key into each of them.
const CONSTANTS = [
  'handsontable/test/helpers/licenseKey.js',
  'tests/fixtures/demo/test-license-key.js',
  'wrappers/react-wrapper/test/licenseKey.ts',
  'wrappers/vue3/test/licenseKey.ts',
  'wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/license-key.ts',
  'performance-tests/fixtures/test-license-key.js',
  'examples/next/visual-tests/js/demo/src/test-license-key.js',
  'examples/next/visual-tests/js/basic-example/src/test-license-key.js',
  'examples/next/visual-tests/react-wrapper/demo/src/test-license-key.ts',
  'examples/next/visual-tests/react-wrapper/basic-example/src/test-license-key.js',
  'examples/next/visual-tests/vue3/demo/src/test-license-key.ts',
  'examples/next/visual-tests/vue3/basic-example/src/test-license-key.ts',
  'examples/next/visual-tests/angular-wrapper/demo/src/test-license-key.ts',
  'examples/next/visual-tests/angular-wrapper/basic-example/src/test-license-key.ts',
  // Not a test: the docs staging and preview builds write it into the executed examples.
  'docs/src/test-license-key.mjs',
];

const VISUAL_DEMOS = 'examples/next/visual-tests';

const TEST_TREES = [
  'handsontable/src',
  'handsontable/test',
  'tests',
  'wrappers/react-wrapper/test',
  'wrappers/vue3/test',
  'wrappers/angular-wrapper/projects',
  // Not `performance-tests/fixtures`: `scripts/run.mjs` copies the built bundles there, and they
  // name the key. Its one tracked file is the constant itself.
  'performance-tests/scenarios',
  // The demos the visual regression suite photographs.
  VISUAL_DEMOS,
];

const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'tmp', 'test-results', 'playwright-report']);

// The files that may hold a literal key, each with the reason.
const ALLOWED = {
  'handsontable/test/helpers/licenseKey.js': 'the constant itself (unit tests and Jasmine specs)',
  'tests/fixtures/demo/test-license-key.js': 'the constant itself (Playwright fixtures)',
  'wrappers/react-wrapper/test/licenseKey.ts': 'the constant itself (React tests)',
  'wrappers/vue3/test/licenseKey.ts': 'the constant itself (Vue tests)',
  'wrappers/angular-wrapper/projects/hot-table/src/lib/test-helpers/license-key.ts':
    'the constant itself (Angular tests)',
  ...Object.fromEntries(CONSTANTS.filter(path => path.startsWith(`${VISUAL_DEMOS}/`))
    .map(path => [path, 'the constant itself (a visual-test demo app)'])),
  'handsontable/src/__tests__/settings/licenseKey.spec.js': 'tests how the key is read',
  'handsontable/src/helpers/__tests__/mixed.unit.ts': 'tests the legacy key checks',
  'handsontable/src/helpers/__tests__/entitlementLicenseInfo.unit.js': 'tests the license state of each key',
  'handsontable/src/utils/entitlementLicenseKey/__tests__/extractKeyData.unit.js': 'tests key format detection',
  'tests/fixtures/demo/license-branding.html': 'builds a grid per license state',
  'tests/e2e/license-branding.spec.ts': 'asserts the license states, and that the lock text does not name the key',
  // The capability gate: these pass the non-commercial key as a key that restricts nothing (an invalid
  // key since 19.0), which a gate must not restrict.
  'handsontable/src/core/__tests__/license.unit.js': 'keeps an invalid-key instance apart from a listed one',
  'handsontable/src/plugins/base/__tests__/licenseGate.unit.js': 'the non-commercial key unlocks every plugin',
  'handsontable/src/utils/licenseCapabilities/__tests__/resolveLicenseCapabilities.unit.js':
    'the non-commercial key resolves to unrestricted grants',
  'handsontable/src/plugins/exportFile/__tests__/exportFile.unit.js': 'a legacy key supports the xlsx export',
  'handsontable/src/plugins/exportFile/__tests__/xlsxLicenseGates.unit.js':
    'compares a legacy export with a listed one',
  'handsontable/src/plugins/exportFile/__tests__/xlsxProtectionOption.unit.js':
    'compares a legacy export with a listed one',
  'handsontable/src/plugins/importFile/__tests__/importFile.unit.js': 'a legacy key supports the xlsx import',
  'handsontable/src/plugins/importFile/__tests__/importLicenseGates.unit.js':
    'compares a legacy import with a listed one',
  'tests/fixtures/xlsxLicenseKeys.ts': 'exports the invalid key the xlsx license specs compare against',
  'wrappers/angular-wrapper/projects/hot-table/src/lib/services/hot-global-config.service.spec.ts':
    'asserts the deprecated NON_COMMERCIAL_LICENSE constant still holds the retired key',
};

/**
 * Whether a path is test code. Only test files are scanned for a literal here; product code is
 * scanned by the retired-key test below, which lets comments and docs name the key.
 *
 * @param {string} path The path, relative to the repository root.
 * @returns {boolean}
 */
function isTestFile(path) {
  if (!/\.(m?js|jsx|ts|tsx|vue|html)$/.test(path)) {
    return false;
  }

  if (path.startsWith('handsontable/src/')) {
    return /\/__tests__\//.test(path);
  }

  if (path.startsWith('wrappers/angular-wrapper/')) {
    return /\.spec\.ts$/.test(path) || path.includes('/test-helpers/');
  }

  return true;
}

/**
 * Lists the files under a directory, skipping build output and installed packages.
 *
 * @param {string} dir An absolute directory path.
 * @returns {string[]} The file paths, relative to the repository root.
 */
function walk(dir) {
  if (!existsSync(dir)) {
    return [];
  }

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory()) {
      return SKIPPED_DIRS.has(entry.name) ? [] : walk(join(dir, entry.name));
    }

    return [relative(ROOT, join(dir, entry.name)).split('\\').join('/')];
  });
}

/**
 * Finds every file that holds a literal key.
 *
 * @param {string[]} paths The paths to check.
 * @param {(path: string) => string} read Reads a file's text.
 * @returns {string[]} The paths that hold one.
 */
function filesWithLiteral(paths, read) {
  return paths.filter(path => LITERALS.some(literal => read(path).includes(literal)));
}

const readFromRoot = path => readFileSync(join(ROOT, path), 'utf8');
const testFiles = TEST_TREES.flatMap(tree => walk(join(ROOT, tree))).filter(isTestFile);

// The two spellings of the non-commercial key. Since 19.0 no product code compares a key with them.
const RETIRED_KEYS = LITERALS.slice(0, 2);

// The product source of the core and the wrappers. Their tests are scanned by the tests above.
const PRODUCT_TREES = [
  'handsontable/src',
  'wrappers/react-wrapper/src',
  'wrappers/vue3/src',
  'wrappers/angular-wrapper/projects/hot-table/src',
];

/**
 * Finds the code lines that name a retired key. A comment line, or the comment at the end of a
 * line, may name it: the docs say the key reads as invalid.
 *
 * @param {string} text A file's text.
 * @returns {string[]} The code lines that name a retired key.
 */
function codeLinesWithRetiredKey(text) {
  return text.split('\n')
    .filter(line => !/^\s*(\*|\/\/|\/\*)/.test(line))
    .filter(line => RETIRED_KEYS.some(key => line.replace(/\s\/\/.*$/, '').toLowerCase().includes(key)));
}

const productFiles = PRODUCT_TREES.flatMap(tree => walk(join(ROOT, tree)))
  .filter(path => /\.(m?js|jsx|ts|tsx|vue)$/.test(path) && !isTestFile(path) && !/\/__tests__\//.test(path));

// Product files that may hold a retired key in code, with the reason. None of them compares a key.
const PRODUCT_ALLOWED = {
  'wrappers/angular-wrapper/projects/hot-table/src/lib/services/hot-global-config.service.ts':
    'the deprecated NON_COMMERCIAL_LICENSE export, removed in 20.0',
};

test('no test writes the license key out; every suite reads its shared constant', () => {
  const offenders = filesWithLiteral(testFiles, readFromRoot).filter(path => !(path in ALLOWED));

  assert.deepEqual(offenders, [],
    'These tests write the license key out. Use the suite\'s constant instead: `TEST_LICENSE_KEY` '
    + '(handsontable/test/helpers/licenseKey.js, a global in Jasmine specs; licenseKey.ts in the React '
    + 'and Vue tests; test-helpers/license-key.ts in the Angular tests), `window.htTestLicenseKey` in a '
    + 'Playwright fixture (load /tests/fixtures/demo/test-license-key.js) or a performance fixture (load '
    + '../../fixtures/test-license-key.js), `:licenseKey="testLicenseKey"` in a Vue template, or '
    + '`TEST_LICENSE_KEY` from `src/test-license-key` in a visual-test demo app. A test of the license '
    + 'behavior itself goes in ALLOWED, with the reason.');
});

test('every test-key constant holds the same internal test key', () => {
  // Renewing the key means pasting it into each constant; one left behind would lock its suite's grids
  // once the old key stops working.
  const assignment = /^(?:export const TEST_LICENSE_KEY|window\.htTestLicenseKey) = '([^']+)';$/m;
  const keys = CONSTANTS.map((path) => {
    const match = readFromRoot(path).match(assignment);

    assert.ok(match, `${path} assigns no single-line key.`);

    return match[1];
  });

  assert.ok(keys[0].includes(TEST_KEY_MARKER), `The key in ${CONSTANTS[0]} is not the internal test key.`);
  assert.deepEqual(CONSTANTS.filter((path, index) => keys[index] !== keys[0]), [],
    `These constants hold another key than ${CONSTANTS[0]}. Paste the same key into each.`);
});

test('no Vue template passes the key in JSX braces', () => {
  // In a Vue template `licenseKey={TEST_LICENSE_KEY}` is a static attribute: the grid gets the text
  // `{TEST_LICENSE_KEY}` and shows the lock screen. Bind it (`:licenseKey="..."`) instead.
  const jsxBraces = /(?<![:\w-])licenseKey=\{/;
  const offenders = testFiles.filter(path => path.endsWith('.vue') && jsxBraces.test(readFromRoot(path)));

  assert.deepEqual(offenders, [], 'These Vue templates pass the key as the literal text in braces. Bind it with '
    + '`:licenseKey="..."` to a value the component exposes.');
  assert.ok(jsxBraces.test('licenseKey={TEST_LICENSE_KEY}') && !jsxBraces.test(':licenseKey="licenseKeyProp"'),
    'The JSX-brace check must catch the JSX form and pass a binding.');
});

test('every file the guard allows still holds a literal key', () => {
  // A stale entry would let a literal back into that file unnoticed.
  const holding = new Set(filesWithLiteral(Object.keys(ALLOWED).filter(path => existsSync(join(ROOT, path))),
    readFromRoot));
  const stale = Object.keys(ALLOWED).filter(path => !holding.has(path));

  assert.deepEqual(stale, [], 'ALLOWED names files that no longer hold a literal key. Remove them.');
});

test('no product code compares a key with the retired non-commercial key', () => {
  // Handsontable 19.0 reads the non-commercial key as invalid. A literal comparison added back to the
  // key reader or the legacy path would bring the key back without any test noticing.
  const holding = productFiles.filter(path => codeLinesWithRetiredKey(readFromRoot(path)).length > 0);
  const offenders = holding.filter(path => !(path in PRODUCT_ALLOWED));
  const stale = Object.keys(PRODUCT_ALLOWED).filter(path => !holding.includes(path));

  assert.deepEqual(offenders, [], 'These product files name the retired non-commercial key in code. '
    + 'Handsontable reads it as an invalid key since 19.0: do not recognize it again.');
  assert.deepEqual(stale, [], 'PRODUCT_ALLOWED names files that no longer hold the key. Remove them.');
  assert.ok(productFiles.length > 500,
    `The scan found only ${productFiles.length} product files; check PRODUCT_TREES.`);
});

test('the retired-key scan catches a code line and passes a comment', () => {
  // The control of the test above: without it, a check that matched nothing would pass.
  const code = '  if (key.toLowerCase() === \'non-commercial-and-evaluation\') {';
  const upperCase = '  const KEYS = [\'HT68E-1F2B7-47158-70B05-0842F\'];';
  const text = [
    code,
    upperCase,
    ' * Since 19.0, the `\'non-commercial-and-evaluation\'` key is not a valid key.',
    '  // \'ht68e-1f2b7-47158-70b05-0842f\' reads as invalid.',
    '  return state; // was \'non-commercial-and-evaluation\'',
  ].join('\n');

  assert.deepEqual(codeLinesWithRetiredKey(text), [code, upperCase]);
});

test('the scan finds a literal key it is given, in every spelling', () => {
  // The guard's own control: without it, a scan that read no file would pass the first test.
  const demo = `${VISUAL_DEMOS}/js/demo/src/demos/new/index.js`;
  const fake = {
    'tests/fixtures/demo/new.html': `licenseKey: '${LITERALS[0]}',`,
    'wrappers/vue3/test/new.spec.ts': `licenseKey="${LITERALS[1]}"`,
    [demo]: `licenseKey: 'This is a key for ${TEST_KEY_MARKER}'`,
    'tests/e2e/clean.spec.ts': 'licenseKey: window.htTestLicenseKey,',
  };

  assert.deepEqual(filesWithLiteral(Object.keys(fake), path => fake[path]),
    ['tests/fixtures/demo/new.html', 'wrappers/vue3/test/new.spec.ts', demo]);
  assert.ok(testFiles.length > 500, `The scan found only ${testFiles.length} test files; check TEST_TREES.`);
});
