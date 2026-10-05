const path = require('path');
const base = require('./jest.config');
const { TEST_FILES_ENV, resolveTestFile } = require('./jest.stryker.testFiles');

/**
 * Resolves the unit tests a mutation run is scoped to, and refuses to run without them.
 *
 * Left unscoped, a run executes far more than the scored test. With
 * `jest.enableFindRelatedTests`, Stryker's jest runner asks Jest for
 * `--findRelatedTests <mutated file>` in one process, which for a widely imported helper is
 * most of the unit suite (333 of 461 suites for `src/helpers/errors.ts`, so the initial run
 * outlasted Stryker's five-minute `dryRunTimeoutMinutes`); without it, Jest runs every suite.
 * Stryker's own `--testFiles` does not scope the mutant runs: under `coverageAnalysis: "all"`
 * every covered mutant is static, and the jest runner passes the test file paths to such a
 * mutant as a test-name filter, which matches no test. Each mutant run then times out without
 * running a test, and a timeout counts as a detected mutant.
 *
 * @returns {string[]} The real paths of the test files, in the case the file system stores.
 */
function resolveTestFiles() {
  const files = (process.env[TEST_FILES_ENV] ?? '').split(',').map(file => file.trim()).filter(Boolean);

  if (files.length === 0) {
    throw new Error(`${TEST_FILES_ENV} is not set. Name the unit test file(s) to check the mutants against, ` +
      `relative to handsontable/, for example ${TEST_FILES_ENV}=src/helpers/__tests__/errors.unit.js`);
  }

  return files.map((file) => {
    const resolved = resolveTestFile(file);

    if (resolved.problem) {
      throw new Error(`${TEST_FILES_ENV}: ${resolved.problem}`);
    }

    return resolved.path;
  });
}

/**
 * Jest config for Stryker mutation runs. Identical to the normal unit config, except for two
 * things. The Babel transform is pinned to this package's babel.config.js: Stryker's jest
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
