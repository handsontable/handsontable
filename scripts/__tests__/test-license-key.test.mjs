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

// Both spellings the core accepts for the non-commercial key (`helpers/mixed.ts`).
const LITERALS = ['non-commercial-and-evaluation', 'ht68e-1f2b7-47158-70b05-0842f'];

const TEST_TREES = [
  'handsontable/src',
  'handsontable/test',
  'tests',
  'wrappers/react-wrapper/test',
  'wrappers/vue3/test',
  'wrappers/angular-wrapper/projects',
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
  'handsontable/src/__tests__/settings/licenseKey.spec.js': 'tests how the key is read',
  'handsontable/src/helpers/__tests__/mixed.unit.ts': 'tests the legacy key checks',
  'handsontable/src/helpers/__tests__/entitlementLicenseInfo.unit.js': 'tests the license state of each key',
  'handsontable/src/utils/__tests__/licenseBranding.unit.js': 'tests the lock screen text, which names the key',
  'handsontable/src/utils/entitlementLicenseKey/__tests__/extractKeyData.unit.js': 'tests key format detection',
  'tests/fixtures/demo/license-branding.html': 'builds a grid per license state',
  'tests/fixtures/pages/LicenseBrandingPage.ts': 'a comment on the lock text, which names the key',
  'tests/e2e/license-branding.spec.ts': 'asserts the lock text, which names the key',
  'wrappers/vue3/test/types/vue3.types.ts': 'a type test; it builds no grid',
};

/**
 * Whether a path is test code. Product code may name the key (the key reader, its docs) until the
 * key is removed, so only test files are scanned.
 *
 * @param {string} path The path, relative to the repository root.
 * @returns {boolean}
 */
function isTestFile(path) {
  if (!/\.(m?js|ts|tsx|html)$/.test(path)) {
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

test('no test writes the license key out; every suite reads its shared constant', () => {
  const offenders = filesWithLiteral(testFiles, readFromRoot).filter(path => !(path in ALLOWED));

  assert.deepEqual(offenders, [],
    'These tests write the license key out. Use the suite\'s constant instead: `TEST_LICENSE_KEY` '
    + '(handsontable/test/helpers/licenseKey.js, a global in Jasmine specs; licenseKey.ts in the React '
    + 'and Vue tests; test-helpers/license-key.ts in the Angular tests), `window.htTestLicenseKey` in a '
    + 'Playwright fixture (load /tests/fixtures/demo/test-license-key.js), or `:licenseKey="testLicenseKey"` '
    + 'in a Vue template. A test of the license behavior itself goes in ALLOWED, with the reason.');
});

test('every file the guard allows still holds a literal key', () => {
  // A stale entry would let a literal back into that file unnoticed.
  const holding = new Set(filesWithLiteral(Object.keys(ALLOWED).filter(path => existsSync(join(ROOT, path))),
    readFromRoot));
  const stale = Object.keys(ALLOWED).filter(path => !holding.has(path));

  assert.deepEqual(stale, [], 'ALLOWED names files that no longer hold a literal key. Remove them.');
});

test('the scan finds a literal key it is given, in either spelling', () => {
  // The guard's own control: without it, a scan that read no file would pass the first test.
  const fake = {
    'tests/fixtures/demo/new.html': `licenseKey: '${LITERALS[0]}',`,
    'wrappers/vue3/test/new.spec.ts': `licenseKey="${LITERALS[1]}"`,
    'tests/e2e/clean.spec.ts': 'licenseKey: window.htTestLicenseKey,',
  };

  assert.deepEqual(filesWithLiteral(Object.keys(fake), path => fake[path]),
    ['tests/fixtures/demo/new.html', 'wrappers/vue3/test/new.spec.ts']);
  assert.ok(testFiles.length > 500, `The scan found only ${testFiles.length} test files; check TEST_TREES.`);
});
