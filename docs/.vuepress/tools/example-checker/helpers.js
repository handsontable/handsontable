const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const replaceInFiles = require('replace-in-files');
const puppeteer = require('puppeteer');
const { spawnProcess } = require('../utils');
const {
  FRAMEWORK_SUFFIX
} = require('../../helpers');

const mdDir = path.resolve(__dirname, '../../../content/guides/');

/**
 * Log a dot indicating the result of a check.
 *
 * @param {boolean} valid `true` if the check was successful, `false` otherwise.
 */
function logCheck(valid) {
  let logColor = 'red';

  if (valid) {
    logColor = 'green';
  }

  process.stdout.write(chalk[logColor]('.'));
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
      setTimeout(resolve, timeout || 100);
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
 * @returns {Promise}
 */
async function findExampleContainersInFiles() {
  return replaceInFiles({
    files: path.join(mdDir, '**/*.md'),
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
    args: ['--headless', '--disable-gpu', '--mute-audio', '--no-sandbox'],
  });
  const page = await browser.newPage();

  return {
    browser,
    page
  };
}

/**
 * Get the paths from the `sidebar.js` file along with their inherited `onlyFor` conditions.
 *
 * @returns {object}
 */
function fetchPathsWithConditions() {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const { sidebar } = require('../../../content/guides/sidebar');
  const paths = {};

  sidebar.forEach((menuEntry) => {
    menuEntry.children.forEach((childEntry) => {
      if (!paths[childEntry.path]) {
        paths[childEntry.path] = {
          onlyFor: []
        };
      }

      const pathEntry = paths[childEntry.path];

      if (childEntry.onlyFor) {
        pathEntry.onlyFor.push(...childEntry.onlyFor);
      }

      if (menuEntry.onlyFor) {
        pathEntry.onlyFor.push(...menuEntry.onlyFor);
      }

      if (pathEntry.onlyFor.length) {
        // remove duplicates
        pathEntry.onlyFor = [...new Set(pathEntry.onlyFor)];

      } else {
        delete pathEntry.onlyFor;
      }
    });
  });

  return paths;
}

/**
 * Get the permalinks of all the pages containing the `::: example` container.
 *
 * @param {object} searchResults Search results returned from the `findExampleContainersInFiles` function.
 * @param {object} pathsWithConditions Paths along with their conditional frameworks.
 * @returns {string[]}
 */
function fetchPermalinks(searchResults, pathsWithConditions) {
  const permalinks = [];

  searchResults.paths.forEach((filePath) => {
    const relativePathWithoutExtension = filePath.split('docs/content/')[1].replace('.md', '');
    const onlyFor = pathsWithConditions[relativePathWithoutExtension].onlyFor;

    const mdFile = fs.readFileSync(filePath, {
      encoding: 'utf8'
    });

    const permalink = /permalink: (.*)\n/g.exec(mdFile)[1];

    permalinks.push({
      permalink,
      onlyFor
    });
  });

  return permalinks;
}

/**
 * Extend the permalink with the framework information and modify the url to match the versioned structure.
 *
 * @param {string} permalink The permalink to be modified.
 * @param {string} framework The framework to be processed.
 * @returns {string}
 */
function extendPermalink(permalink, framework) {
  permalink = permalink.replace('/', `/${framework}${FRAMEWORK_SUFFIX}/`);

  return permalink;
}

module.exports = {
  logCheck,
  sleep,
  firstUppercase,
  serveFiles,
  findExampleContainersInFiles,
  setupBrowser,
  fetchPermalinks,
  fetchPathsWithConditions,
  extendPermalink
};
