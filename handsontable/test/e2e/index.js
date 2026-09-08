require('jasmine-co').install();

// Needs to be loaded after `jasmine-co`'s `install`, to avoid being handled by its `wrapFn` logic for globals.
require('../helpers/it-themes-extension');

// Every pattern here must match a spec file's context key for the file to load.
const testPathRegExps = [];

if (typeof __ENV_ARGS__ === 'object' && __ENV_ARGS__.testPathPattern) {
  // Remove string between % signs. On Windows' machines an empty env variable was visible as '%{variable_name}%' so it must be stripped.
  // See https://github.com/handsontable/handsontable/issues/4378).
  const pattern = __ENV_ARGS__.testPathPattern.replace(/^%(.*)%$/, '');

  if (pattern) {
    testPathRegExps.push(new RegExp(pattern, 'i'));
  }
}

// Allow filtering test files at runtime via URL query parameter (e.g., ?spec=i18n or
// ?specFile=<path pattern>). This enables running a subset of tests without rebuilding the
// bundle; with a pattern baked in at build time (`--testPathPattern`), the parameter narrows it.
//
// `specFile` exists because Jasmine's own boot also reads `spec`, as a filter on the spec NAMES
// (`HtmlSpecFilter`), so a `spec` value shaped like a file path loads the file and then runs none
// of its specs. The runner's isolation probe passes `specFile`.
if (typeof window !== 'undefined' && window.location) {
  const urlParams = new URLSearchParams(window.location.search);
  const specPattern = urlParams.get('specFile') || urlParams.get('spec');

  if (specPattern) {
    testPathRegExps.push(new RegExp(specPattern, 'i'));
  }
}

// The spec file each top-level suite came from, keyed by its Jasmine suite id. A suite is added to
// the top suite while its file is being required, so the children that appear during one
// `req(filePath)` are that file's. The bridge reporter reads this map to stamp every result with
// its file, which is what lets a red CI run name the spec file and re-run it alone.
//
// `topSuite()` must be called anew for every read: it returns a proxy that memoizes `children` on
// first access, so one proxy kept from before a `require` never shows the suites that file added.
const specFiles = {};
const topSuiteChildren = () => jasmine.getEnv().topSuite().children;

window.__hotSpecFiles = specFiles;

[
  { req: require.context('.', true, /^(?:(?!\/mobile\/).)*\.spec\.js$/), base: 'handsontable/test/e2e/' },
  {
    req: require.context('./../../src/', true, /^(?:(?!\/(3rdparty|mobile)\/).)*\.spec\.js$/),
    base: 'handsontable/src/',
  },
].forEach(({ req, base }) => {
  req.keys().forEach((filePath) => {
    if (testPathRegExps.every(regExp => regExp.test(filePath))) {
      const childrenBefore = topSuiteChildren().length;

      req(filePath);

      topSuiteChildren().slice(childrenBefore).forEach((suite) => {
        specFiles[suite.id] = base + filePath.replace(/^\.\//, '');
      });
    }
  });
});

require('./MemoryLeakTest');
