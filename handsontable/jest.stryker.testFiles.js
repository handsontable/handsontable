const fs = require('fs');
const path = require('path');
const jestConfig = require('./jest.config');

/**
 * The environment variable that names the unit tests a mutation run executes: comma-separated
 * paths relative to this package. `evals/score.mjs --mutate` sets it to the test file it scores.
 */
const TEST_FILES_ENV = 'HOT_MUTATION_TEST_FILES';

/**
 * Resolves one test file the way a mutation run uses it, or says why it cannot run.
 * `jest.stryker.config.js` refuses such a file, and `evals/score.mjs` refuses it before it starts
 * Stryker, which rewrites the mutated sources in place. Both call this, so the two checks cannot
 * drift apart.
 *
 * @param {string} file A path relative to this package, or an absolute one.
 * @returns {{path: string}|{problem: string}} The file's real path, in the case the file system
 * stores (the case Jest's own paths use, so `src/Helpers/…` typed on macOS still matches), or why
 * the file cannot run.
 */
function resolveTestFile(file) {
  const packageDir = fs.realpathSync.native(__dirname);
  const absolute = path.resolve(packageDir, file);
  const isInPackage = candidate => candidate.startsWith(`${packageDir}${path.sep}`);
  const outside = `${file} is outside handsontable/; the mutation layer runs core Jest unit tests only`;

  if (!fs.existsSync(absolute)) {
    return { problem: isInPackage(absolute) ? `${file} does not exist` : outside };
  }

  const real = fs.realpathSync.native(absolute);
  const roots = jestConfig.roots.map(root => root.replace('<rootDir>', packageDir) + path.sep);
  const unitTest = [jestConfig.testRegex].flat().map(pattern => new RegExp(pattern));

  if (!isInPackage(real)) {
    return { problem: outside };
  }

  if (!roots.some(root => real.startsWith(root))) {
    const names = jestConfig.roots.map(root => `${root.replace('<rootDir>/', '')}/`).join(' or ');

    return { problem: `${file} is not under ${names}, where Jest looks for tests` };
  }

  if (!unitTest.some(pattern => pattern.test(real))) {
    return {
      problem: `${file} is not a unit test file (*.unit.js or *.unit.ts); the mutation layer runs core Jest unit tests only`,
    };
  }

  return { path: real };
}

module.exports = { TEST_FILES_ENV, resolveTestFile };
