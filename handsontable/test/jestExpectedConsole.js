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
  // The license specs build keys that are invalid or that lack a token.
  /^The license key for Handsontable is invalid\./,
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

['warn', 'error', 'log', 'info'].forEach((level) => {
  const original = console[level];

  console[level] = (...args) => {
    if (!isExpected(args)) {
      original.apply(console, args);
    }
  };
});

module.exports = { EXPECTED_MESSAGES, isExpected };
