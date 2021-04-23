const { SiteChecker } = require('broken-link-checker'); // eslint-disable-line import/no-unresolved
const chalk = require('chalk');
const path = require('path');
const execa = require('execa');

const ACCEPTABLE_STATUS_CODES = [undefined, 200, 429];

const brokenLinks = []; // should populate with objects, eg. {statusCode: number, url: string}

/* eslint-disable no-console, no-restricted-globals */
const logger = {
  log: message => console.log(chalk.green(message)),
  warn: message => console.warn(chalk.yellow(message)),
  error: message => console.error(chalk.red(message)),
};
/* eslint-enable no-console, no-restricted-globals */

const spawnProcess = (command, options = {}) => {
  const cmdSplit = command.split(' ');
  const mainCmd = cmdSplit[0];

  cmdSplit.shift();

  if (!options.silent) {
    options.stdin = options.stdin ?? 'inherit';
    options.stdout = options.stdout ?? 'inherit';
    options.stderr = options.stderr ?? 'inherit';
  }

  return execa(mainCmd, cmdSplit, options);
};

/**
 * Replace double slashes // with one slash /
 */
 const replaceSlashes = input => {
  return input.replace(/\/\/+/g, `/`)
}

// start server
spawnProcess(`http-server ${path.resolve('.vuepress', 'dist')} -s 8080`);

const siteChecker = new SiteChecker(
  {
    excludeInternalLinks: false,
    excludeExternalLinks: false,
    filterLevel: 0,
    acceptedSchemes: ['http', 'https'],
    excludedKeywords: [
      'linkedin', // it always throws an error even if link really works
      'github.com',
      '*/docs/*.*.*' // the old documentation
    ]
  },
  {
    error: (error) => {
      logger.error(error);
    },

    link: (result) => {
      if (result.broken) {
        if (result.http.response && !ACCEPTABLE_STATUS_CODES.includes(result.http.response.statusCode)) {

          brokenLinks.push({
            statusCode: result.http.response.statusCode,
            url: result.url.original,
            internal: result.internal
          });

          if (result.internal) {
            logger.error(`broken internal link ${result.http.response.statusCode} => ${result.url.original}`);
          } else {
            logger.warn(`broken external link ${result.http.response.statusCode} => ${result.url.original}`);
          }

        }
      }
    },

    end: () => {
      logger.log('CHECK FOR BROKEN LINKS FINISHED');
      const internalLinksCount = brokenLinks.filter(link => link.internal).length;
      const externalLinksCount = brokenLinks.filter(link => !link.internal).length;

      if (internalLinksCount) {
        logger.error(`
TOTAL BROKEN LINKS:
Internal: ${internalLinksCount}
External: ${externalLinksCount}
        `);

        process.exit(1);
      }

      if (!internalLinksCount && externalLinksCount) {
        logger.warn(`
EXTERNAL BROKEN LINKS: ${externalLinksCount}
        `);
        process.exit(0);
      }

      logger.log('EVERY LINK IS WORKING!');
      process.exit(0);
    }
  }
);

const PAGE_TO_CHECK = 'docs/next/api';

let [urlArg] = process.argv.slice(2);
urlArg = urlArg ? urlArg : 'http://127.0.0.1:8080/';

const urlToCheck = replaceSlashes(`${urlArg}${PAGE_TO_CHECK}`)

// run siteChecker
// timeout is needed because siteChecker would open URL before server started
setTimeout(() => {
  logger.log('CHECK FOR BROKEN LINKS STARTED');
  siteChecker.enqueue(urlToCheck);
}, 3000);
