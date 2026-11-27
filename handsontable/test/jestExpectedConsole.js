/**
 * Keeps the console output the specs provoke on purpose out of the Jest log, for Jest only.
 *
 * A full run printed about 330 console blocks, and every one traced to a spec that feeds the grid
 * the input the message describes: a paste of HTML into a grid with no `sanitizer`, an XLSX file
 * with a feature an engine drops, a plugin option of the wrong type, a theme config missing icons.
 * The specs that care assert the message through a spy of their own; the rest let it print, and
 * a warning nobody expected drowned in them.
 *
 * One allowlist, here, instead of a spy in every such spec. A message that matches an entry is
 * swallowed, anything else prints as before, so a new warning still stands out in a run. Keep the
 * patterns anchored and specific: an entry that is too wide hides a regression of the same
 * message in a spec that never meant to provoke it.
 *
 * The methods are replaced by plain functions on the file's own `console` (Jest gives each test
 * file one), not by Jest mocks, so a spec's `jest.spyOn(console, 'warn')` keeps working exactly as
 * before: it spies on the wrapper, counts only what its own code logs, and `mockRestore()` puts
 * the wrapper back.
 *
 * Registered in `jest.config.js` only, for the reason `jsdomWindowScroll.js` gives.
 */
const EXPECTED_MESSAGES = [
  // The sanitizer nudge: copyPaste, parseTable and loading specs write HTML into grids without one.
  /^HTML content is being written to the DOM \("[^"]+"\) without a sanitizer\./,
  // The import and export specs assert the same report through the `dropped` list.
  /^The (?:built-in|ExcelJS) xlsx engine dropped features it cannot write or read: /,
  /^The xlsx export skipped features your license does not unlock: /,
  // `importScoping` imports `values.xlsx` without `colHeaders: 'firstRow'`, so the header row lands
  // in the inferred date and time columns; `sourceDataValidator.unit.js` names its own message.
  /^Source data warning \(\d+ cells?\)\. /,
  /^sourceDataValidator spec: the value was rejected$/,
  // Partial theme configs, built on purpose in the theme engine specs.
  /^\[ThemeBuilder\] Missing (?:icon|token)\(s\) in /,
  /^Theme "[^"]+" is already registered\. Registration skipped\.$/,
  // `replacedDataDestination.unit.js` loads data shorter than the summary's destination.
  /^One of the Column Summary plugins' destination points you provided is beyond the table boundaries!$/,
  // FormulaBuilder specs: a stub without popup containers, `formulas: false`, malicious colors.
  /^The `popups\.(?:suggestions|fnHelp)\.container` option of the FormulaBuilder plugin names no element/,
  /^The FormulaBuilder plugin requires the Formulas plugin to be enabled with a configured engine\.$/,
  /^FormulaBuilder: ignored a highlight with the unsupported color /,
  // Plugin settings validation, fed values of the wrong type on purpose.
  /^\w+ Plugin: (?:"[^"]+" )?(?:option|function \(\) result\s*) ?is not valid and (?:it )?will be ignored\.$/,
  /^The `\w+` plugin cannot be used with the `\w+` option\. This combination is not supported\./,
  // Specs that enable CollapsibleColumns on a grid with no `nestedHeaders` anywhere, on purpose;
  // `nestedHeadersWarning.unit.js` asserts the warning through a spy of its own.
  /^You need to configure the Nested Headers plugin in order to use collapsible headers\.$/,
  // DataProvider specs reject a save; the hook payload is what they assert.
  /^Row update failed:/,
  /^The "data" setting is ignored when "hasExternalDataSource" returns `true`\.$/,
  /^The `data` setting is ignored when `sheetsBar\.sheets` declares a workbook/,
  /^The sheet "[^"]+" passes the HyperFormula class with a sheetName\./,
  // `docsExamples.unit.js` runs the getting-started demo, which logs
  // `Handsontable: v${version} (${buildDate})` itself.
  /^Handsontable: v\d+\.\d+\.\d+\S* \(/,
  // Inputs the specs describe: 2000 rendered rows, an unsupported view state, a string
  // `dateFormat`, nine malformed date formats, a 32-character sheet name, a non-ISO datetime.
  /^Performance tip: Handsontable rendered more than 1000 visible rows\./,
  /^setViewState\(\): /,
  /^The dateFormat option as a string is not supported\./,
  /^The date format "[^"]*" is ignored\./,
  /^Worksheet name \S+ exceeds 31 chars\./,
  /^IntlDatetimeEditor: value must be in ISO date-time format/,
  // Deprecations under test print once per page; the specs that pin them spy on their own.
  /^Writing past the last column of an object data source /,
];

/**
 * Tells whether a console call is one a spec provokes on purpose.
 *
 * @param {Array} args The arguments of the console call.
 * @returns {boolean}
 */
function isExpected(args) {
  const message = String(args[0]);

  return EXPECTED_MESSAGES.some(pattern => pattern.test(message));
}

/**
 * The message a grid logs for a missing, an invalid, or an expired legacy license key. Every test grid
 * takes the internal test key (`test/helpers/licenseKey.js`), which logs nothing, so a test that logs
 * one built a grid without it, and that grid sits behind the license lock.
 */
const LICENSE_KEY_MESSAGE = /^The license key for Handsontable (?:is missing|is invalid|expired)\b/;

/**
 * The test files that build such keys on purpose: they test how a key is read, what a key unlocks,
 * or what an export or an import does without a valid key. A path matches when it contains one of
 * these fragments.
 */
const LICENSE_TEST_FILES = [
  '/utils/entitlementLicenseKey/',
  '/utils/licenseCapabilities/',
  '/utils/__tests__/licenseBranding',
  '/utils/__tests__/licenseNotification',
  '/helpers/__tests__/mixed.unit',
  '/helpers/__tests__/entitlementLicenseInfo',
  '/core/__tests__/license.unit',
  '/plugins/base/__tests__/licenseGate',
  '/utils/xlsxEngine/__tests__/licenseCapabilities',
  '/utils/xlsxEngine/__tests__/xlsxEntitlement',
  '/plugins/exportFile/__tests__/exportFile.unit',
  '/plugins/exportFile/__tests__/xlsxLicenseGates',
  '/plugins/exportFile/__tests__/xlsxProtectionOption',
  '/plugins/importFile/__tests__/importFile.unit',
  '/plugins/importFile/__tests__/importLicenseGates',
];

/**
 * Tells whether the running test file may log a license key message.
 *
 * @param {string} testPath The absolute path of the running test file.
 * @returns {boolean}
 */
function isLicenseTestFile(testPath) {
  const path = String(testPath).split('\\').join('/');

  return LICENSE_TEST_FILES.some(fragment => path.includes(fragment));
}

// What a file that is not a license test showed since the last check: the license key messages it
// logged, and the license locks its grids mounted.
const unexpectedLicenseMessages = [];

['warn', 'error', 'log', 'info'].forEach((level) => {
  const original = console[level];

  console[level] = (...args) => {
    if (LICENSE_KEY_MESSAGE.test(String(args[0]))) {
      if (!isLicenseTestFile(expect.getState().testPath)) {
        unexpectedLicenseMessages.push(`logged "${String(args[0])}"`);
      }

      return;
    }

    if (!isExpected(args)) {
      original.apply(console, args);
    }
  };
});

/**
 * The class of the lock a grid without a valid key mounts (`src/utils/licenseBranding/lockScreen.ts`).
 */
const LICENSE_LOCK_SELECTOR = '.ht-license-lock';

/**
 * Records a grid that mounted the license lock. A global `afterInit` hook, so it sees every grid of the
 * file's module registry, whatever a spec does to `console`.
 *
 * The console message alone is not enough. The core prints the legacy message once per test file, and a
 * spec that spies `console.warn` with `mockImplementation()`, or replaces it, takes that one message, so
 * every later grid built without a key in the file passed. The lock mounts for every such grid, during
 * `init()`, before `afterInit`.
 *
 * @this {Handsontable}
 */
function recordLicenseLock() {
  if (this.rootOverlaysElement?.querySelector(LICENSE_LOCK_SELECTOR)
      && !isLicenseTestFile(expect.getState().testPath)) {
    unexpectedLicenseMessages.push('shows the license lock');
  }
}

// The setup file runs in the test file's module registry, so this is the singleton the file's grids use.
// A spec that calls `jest.resetModules()` gets a new one without the hook; the console path still
// catches the first grid there.
require('../src/core/hooks').Hooks.getSingleton().add('afterInit', recordLicenseLock);

/**
 * Throws when a grid in a test that is not a license test logged a license key message or mounted the
 * license lock since the last call, and forgets them either way.
 */
function assertNoUnexpectedLicenseMessage() {
  if (unexpectedLicenseMessages.length > 0) {
    const what = [...new Set(unexpectedLicenseMessages.splice(0))].join(', and ');

    throw new Error(`A grid in this test was built without the test license key and ${what}. `
      + 'Pass `licenseKey: TEST_LICENSE_KEY` (import it from `test/helpers/licenseKey.js`). A test of the '
      + 'license behavior itself goes in LICENSE_TEST_FILES in `test/jestExpectedConsole.js`.');
  }
}

afterEach(assertNoUnexpectedLicenseMessage);

module.exports = {
  EXPECTED_MESSAGES,
  LICENSE_KEY_MESSAGE,
  LICENSE_TEST_FILES,
  assertNoUnexpectedLicenseMessage,
  isExpected,
  isLicenseTestFile,
};
