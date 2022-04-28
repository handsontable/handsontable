const chalk = require('chalk');
const path = require('path');
const replaceInFiles = require('replace-in-files');
const puppeteer = require('puppeteer');
const fs = require('fs');
const { spawnProcess } = require('../utils');
const { getLatestVersion } = require('../../helpers');

const mdDir = path.resolve(__dirname, '../../../');

/**
 * Log a dot indicating the result of a check.
 *
 * @param {boolean} valid `true` if the check was successful, `false` otherwise.
 */
function logCheck(valid) {
  process.stdout.write(chalk[(valid ? 'green' : 'red')]('.'));
}

/**
 * Wait for the amount of milliseconds passed as an argument.
 *
 * @param {number} timeout Number of milliseconds to wait.
 * @returns {Promise}
 */
async function sleep(timeout) {
  return Promise.resolve({
    then(resolve) {
      setTimeout(resolve, timeout || 300);
    }
  });
}

/**
 * Make the provided string to have the first letter uppercased.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function firstUppercase(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Serve the pre-build documentation files.
 *
 * @param {number} PORT The port for the files to be served on.
 */
function serveFiles(PORT) {
  spawnProcess(`http-server ${path.resolve(__dirname, '../../dist')} -s -p ${PORT}`, {});
}

/**
 * Go through the `.md` files looking for `::: example` containers and return the search results.
 *
 * @param {string} version Version of the docs to look for in.
 * @returns {Promise}
 */
async function findExampleContainers(version) {
  return replaceInFiles({
    files: path.join(mdDir, version, '**/*.md'),
    from: /::: example/g,
    onlyFindPathsWithoutReplace: true
  });
}

/**
 * Setup the headless browser.
 *
 * @returns {Promise<{browser: Browser, page: Page}>}
 */
async function setupBrowser() {
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--headless', '--disable-gpu', '--mute-audio'],
  });
  const page = await browser.newPage();

  return {
    browser,
    page
  };
}

/**
 * Get the permalinks of all the pages containing the `::: example` container.
 *
 * @param {object} searchResults Search results returned from the `findExampleContainers` function.
 * @returns {string[]}
 */
function fetchPermalinks(searchResults) {
  const permalinks = [];

  searchResults.paths.forEach((filePath) => {
    const mdFile = fs.readFileSync(filePath, {
      encoding: 'utf8'
    });

    const permalink = /permalink: (.*)\n/g.exec(mdFile)[1];

    permalinks.push(permalink);
  });

  return permalinks;
}

/**
 * Extend the permalink with the framework information and modify the url to match the versioned structure (the
 * latest version is available as an url without a version number).
 *
 * @param {string} permalink The permalink to be modified.
 * @returns {string}
 */
function extendPermalink(permalink) {
  const latestVersion = getLatestVersion();

  // Workaround for the latest version not being put in a subdirectory.
  if (permalink.includes(latestVersion)) {
    permalink = permalink.replace(`${latestVersion}/`, '');
  }

  // --start-TODO: test after merging the multi-build setup to the epic branch.
  // // Workaround for the latest version not being put in a subdirectory.
  // if (permalink.includes(latestVersion)) {
  //   permalink = permalink.replace(`${latestVersion}/`, `${framework}-data-grid/`);
  //
  // } else {
  //   permalink = permalink.replace(`${latestVersion}/`, `${latestVersion}/${framework}-data-grid/`);
  // }
  // --end-TODO

  return permalink;
}

module.exports = {
  logCheck,
  sleep,
  firstUppercase,
  serveFiles,
  findExampleContainers,
  setupBrowser,
  fetchPermalinks,
  extendPermalink
};
