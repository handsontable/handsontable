/* eslint-disable jsdoc/require-description-complete-sentence */
/**
 * This script performs a simple check of the example containers for every page they were defined in.
 *
 * It checks if the number of rendered Handsontable instances is the same as the number of  Handsontable
 * initialization lines in the examples' code section.
 *
 * **Note:**
 * The documentation version that's being checked by the script needs to be pre-built using the build script, for
 * example:
 * `npm run docs:build`
 */
/* eslint-enable jsdoc/require-description-complete-sentence */
const { logger } = require('../utils');
const {
  logCheck,
  sleep,
  firstUppercase,
  serveFiles,
  findExampleContainersInFiles,
  setupBrowser,
  fetchPermalinks,
  fetchPathsWithConditions,
  extendPermalink
} = require('./helpers');
const {
  getFrameworks
} = require('../../helpers');
const { testCases } = require('./testCases');

/**
 * Port to serve the static docs pages under.
 *
 * @type {number}
 */
const PORT = 8088;

/**
 * Timeout for the http server to serve all the documentation files.
 *
 * @type {number}
 */
const FILE_SERVE_TIMEOUT = 300;

/**
 * Timout for the examples to get initialized after loading the page.
 *
 * @type {number}
 */
const EXAMPLE_INIT_TIMEOUT = 300;

/**
 * Number of tries to perform if the number of the rendered examples differs from the expected count.
 *
 * @type {number}
 */
const CHECK_TRIES = 20;

(async() => {
  const FRAMEWORKS_TO_CHECK = getFrameworks();

  serveFiles(PORT);

  // Wait for http-server to serve the files.
  await sleep(FILE_SERVE_TIMEOUT);

  const brokenExamplePaths = [];
  const searchResults = await findExampleContainersInFiles();
  const pathsWithConditions = fetchPathsWithConditions();
  const permalinks = fetchPermalinks(searchResults, pathsWithConditions);
  const {
    browser,
    page
  } = await setupBrowser();

  logger.log('Checking if the examples rendered correctly:');

  /* eslint-disable no-await-in-loop, no-continue */
  for (let f = 0; f < FRAMEWORKS_TO_CHECK.length; f++) {
    const framework = FRAMEWORKS_TO_CHECK[f];

    logger.log(`\n${firstUppercase(framework)} flavor:`);

    for (let i = 0; i < permalinks.length; i++) {
      if (permalinks[i].onlyFor && !permalinks[i].onlyFor.includes(framework)) {
        continue;
      }

      const permalink = extendPermalink(permalinks[i].permalink, framework);

      await page.goto(`http://localhost:${PORT}/docs${permalink}`, {
        waitUntil: 'networkidle0'
      });

      for (let testIndex = 0; testIndex < testCases.length; testIndex++) {
        let pageEvaluation = await page.evaluate(testCases[testIndex], permalink);
        let tryCount = 0;

        // If the test fails, do another try after a timeout (some instances might have not been initialized yet).
        while (
          (tryCount < CHECK_TRIES) &&
          (!pageEvaluation.result || pageEvaluation.elementsNotYetRendered)
        ) {
          tryCount += 1;

          // Wait for the HOT instances to initialize.
          await sleep(EXAMPLE_INIT_TIMEOUT);

          pageEvaluation = await page.evaluate(testCases[testIndex], permalink);
        }

        if (pageEvaluation.error) {
          logger.error(`${permalink}: ${pageEvaluation.error}`);

        } else {
          // Mark the check as suspicious, if the expected number of instances is 0.
          logCheck(pageEvaluation.result);

          if (!pageEvaluation.result) {
            brokenExamplePaths.push({
              path: permalink,
              expected: pageEvaluation.expected,
              received: pageEvaluation.received,
              emptyExampleContainers: pageEvaluation.emptyExampleContainers
            });
          }
        }
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  await browser.close();

  if (brokenExamplePaths.length > 0) {
    logger.error(`

Errors:
${brokenExamplePaths.map(
    (entry) => {
      let errorMessage = '';

      if (entry.expected !== entry.received) {
        errorMessage += `
  - Expected ${entry.expected} Handsontable instances, ${entry.received} were rendered.`;
      }

      if (entry.emptyExampleContainers.length > 0) {
        entry.emptyExampleContainers.forEach((exampleId) => {
          errorMessage += `
  - Empty example container ("${exampleId}")`;
        });
      }

      return `
- ${entry.path}: ${errorMessage}`;
    })
    .join('\n')}`
    );
    process.exit(1);
  }

  if (brokenExamplePaths.length === 0) {
    logger.success('\nDid not find any broken examples.');
    process.exit(0);
  }
})();
