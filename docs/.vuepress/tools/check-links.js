const { SiteChecker } = require('broken-link-checker'); // eslint-disable-line import/no-unresolved
const path = require('path');
const execa = require('execa');
const { logger } = require('./utils');

const ACCEPTABLE_STATUS_CODES = [undefined, 200, 429];

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

// start server
spawnProcess(`http-server ${path.resolve('.vuepress', 'dist')} -s 8080`);
const stats = {
  brokenInternal: 0,
  brokenExternal: 0,
  external: 0,
  internal: 0,
  _set: new Set()
};
const siteChecker = new SiteChecker(
  {
    excludeInternalLinks: false,
    excludeExternalLinks: false,
    excludeLinksToSamePage: true,
    filterLevel: 2,
    acceptedSchemes: ['http', 'https'],
    excludedKeywords: [
      'linkedin.com', // it always throws an error even if link really works
      'github.com',
      'https://jsfiddle.net/api/post/library/pure/', // from "edit in jsfiddle" button
      '*/docs/*.*.*' // the old documentation
    ]
  },
  {
    error: (error) => {
      logger.error(error);
    },

    link: (result) => {
      const isUnique = !stats._set.has(result.url.resolved);

      stats._set.add(result.url.resolved);

      const status = result.http.response.statusCode;

      if (result.broken) {
        if (result.http.response && !ACCEPTABLE_STATUS_CODES.includes(status)) {
          if (result.internal) {
            // eslint-disable-next-line max-len
            logger.error(`on: ${result.base.resolved}  \t  broken internal link ${status} => ${result.url.resolved} \t ${result.url.original} ;`);
            stats.brokenInternal += isUnique;
          } else {
            logger.warn(`on: ${result.base.resolved}  \t  broken external link ${status} => ${result.url.resolved};`);
            stats.brokenExternal += isUnique;
          }
        }
      } else if (result.internal) {
        stats.internal += isUnique;
      } else {
        logger.log(`on: ${result.base.resolved}  \t  external link ${status} => ${result.url.resolved};`);
        stats.external += isUnique;
      }
    },

    end: () => {
      logger.info('\nCHECK FOR BROKEN LINKS FINISHED');
      logger.info(`Checked internals : ${stats.internal + stats.brokenInternal}`);
      logger.info(`Checked externals : ${stats.external + stats.brokenExternal}`);

      if (stats.brokenInternal || stats.brokenExternal) {
        logger.error(`Broken internals: ${stats.brokenInternal}`);
        logger.error(`Broken external: ${stats.brokenExternal}`);

        if (stats.brokenInternal) {
          logger.error('\nINTERNAL BROKEN LINKS DETECTED!');
          process.exit(1);
        } else {
          logger.warn('\nEXTERNAL BROKEN LINKS DETECTED!');
          process.exit(0);
        }
      }
      logger.success('\nNO BROKEN LINKS DETECTED!');
      process.exit(0);
    }
  }
);

const ARGUMENT_URL_DEFAULT = 'http://127.0.0.1:8080/docs/next/api';

let [urlArg] = process.argv.slice(2);

urlArg = urlArg || ARGUMENT_URL_DEFAULT;

// run siteChecker
// timeout is needed because siteChecker would open URL before server started
setTimeout(() => {
  logger.success('CHECK FOR BROKEN LINKS STARTED');
  siteChecker.enqueue(urlArg);
}, 3000);
