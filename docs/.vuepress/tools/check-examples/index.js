/**
 * This script performs a simple check of the example containers for every page they were defined in.
 *
 * It checks if the number of rendered Handsontable instances is the same as the number of  Handsontable
 * initialization lines in the examples' code section.
 */
const semver = require('semver');
const { logger } = require('../utils');
const {
  logCheck,
  sleep,
  firstUppercase,
  serveFiles,
  findExampleContainers,
  setupBrowser,
  fetchPermalinks,
  extendPermalink
} = require('./helpers');
const { testCases } = require('./testCases');

const [cliVersion] = process.argv.slice(2);
const PORT = 8088;
const FILE_SERVE_TIMEOUT = 300;
const EXAMPLE_INIT_TIMEOUT = 250;
const FRAMEWORKS_TO_CHECK = [
  'javascript',
  'react'
];

(async() => {
  if (cliVersion !== 'next' && !semver.valid(`${cliVersion}.0`)) {
    logger.error('Invalid version number.');
    process.exit(1);
  }

  serveFiles(PORT);

  // Wait for http-server to serve the files.
  await sleep(FILE_SERVE_TIMEOUT);

  const brokenExamplePaths = [];
  const searchResults = await findExampleContainers(cliVersion);
  const permalinks = fetchPermalinks(searchResults);
  const {
    browser,
    page
  } = await setupBrowser();

  logger.info('Checking if the examples got rendered correctly:');

  /* eslint-disable no-await-in-loop */
  for (let f = 0; f < FRAMEWORKS_TO_CHECK.length; f++) {
    const framework = FRAMEWORKS_TO_CHECK[f];

    logger.info(`\n${firstUppercase(framework)} flavor:`);

    for (let i = 0; i < permalinks.length; i++) {
      const permalink = extendPermalink(permalinks[i]);

      await page.goto(`http://localhost:${PORT}/docs${permalink}`, {});

      // Wait for the HOT instances to initialize.
      await sleep(EXAMPLE_INIT_TIMEOUT);

      for (let testIndex = 0; testIndex < testCases.length; testIndex++) {
        const pageEvaluation = await page.evaluate(testCases[testIndex]);

        if (pageEvaluation.error) {
          logger.error(`${permalink}: ${pageEvaluation.error}`);

        } else {
          logCheck(pageEvaluation.result);

          if (!pageEvaluation.result) {
            brokenExamplePaths.push({
              path: permalink,
              expected: pageEvaluation.expected,
              received: pageEvaluation.received
            });
          }
        }
      }
    }
  }
  /* eslint-enable no-await-in-loop */

  await browser.close();

  if (brokenExamplePaths.length) {
    logger.error(`\nBroken examples found in: \n\n${brokenExamplePaths.map(
      entry =>
        `${entry.path}: Expected: ${entry.expected}, Received: ${entry.received}.`).join('\n')}`
    );
    process.exit(1);

  } else {
    logger.success(`\nDid not find any broken examples for version ${cliVersion}.`);
    process.exit(0);
  }
})();
