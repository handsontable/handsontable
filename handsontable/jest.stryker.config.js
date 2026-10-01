const fs = require('fs');
const path = require('path');
const base = require('./jest.config');

/**
 * The environment variable that names the unit tests a mutation run executes: comma-separated
 * paths relative to this package. `evals/score.mjs --mutate` sets it to the test file it scores.
 */
const TEST_FILES_ENV = 'HOT_MUTATION_TEST_FILES';

/**
 * Resolves the unit tests a mutation run is scoped to, and refuses to run without them.
 *
 * Unscoped, Stryker's jest runner asks Jest for `--findRelatedTests <mutated file>` in one
 * process. For a widely imported helper that is most of the unit suite (333 of 461 suites for
 * `src/helpers/errors.ts`), so the initial test run outlasts Stryker's five-minute
 * `dryRunTimeoutMinutes`. Stryker's own `--testFiles` does not scope the mutant runs: under
 * `coverageAnalysis: "all"` every covered mutant is static, and the jest runner passes the test
 * file paths to such a mutant as a test-name filter, which matches no test. Each mutant run then
 * loads every related suite until it times out, and a timeout counts as a detected mutant.
 *
 * @returns {string[]} The real paths of the test files.
 */
function resolveTestFiles() {
  const files = (process.env[TEST_FILES_ENV] ?? '').split(',').map(file => file.trim()).filter(Boolean);

  if (files.length === 0) {
    throw new Error(`${TEST_FILES_ENV} is not set. Name the unit test file(s) to check the mutants against, ` +
      `relative to handsontable/, for example ${TEST_FILES_ENV}=src/helpers/__tests__/errors.unit.js`);
  }

  const unitTest = new RegExp(base.testRegex);

  return files.map((file) => {
    const absolute = path.resolve(__dirname, file);

    if (!unitTest.test(absolute) || !fs.existsSync(absolute)) {
      throw new Error(`${TEST_FILES_ENV}: "${file}" is not a unit test file (*.unit.js or *.unit.ts) in handsontable/`);
    }

    return fs.realpathSync(absolute);
  });
}

/**
 * Jest config for Stryker mutation runs. Identical to the normal unit config, except for two
 * things. The Babel transform is pinned to this package's babel.config.js — Stryker's jest
 * worker changes cwd, which breaks babel-jest's cwd-relative config discovery (raw `import`
 * statements then crash the dry run). And `testRegex` matches only the files named in
 * `HOT_MUTATION_TEST_FILES`, so the initial run and every mutant run execute those tests and
 * nothing else.
 */
module.exports = {
  ...base,
  rootDir: __dirname,
  testRegex: resolveTestFiles().map(file => `^${file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: path.resolve(__dirname, 'babel.config.js'), envName: 'commonjs' }],
  },
};
