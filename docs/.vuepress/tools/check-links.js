// eslint-disable-line no-console

const { SiteChecker } = require('broken-link-checker');
const chalk = require('chalk');

const SITE_TO_CHECK = 'docs/next/api';

const brokenLinks = []; // should populate with objects, eg. {statusCode: number, url: string}

const siteChecker = new SiteChecker(
  {
    excludeInternalLinks: false,
    excludeExternalLinks: false,
    filterLevel: 0,
    acceptedSchemes: ['http', 'https'],
    excludedKeywords: [
      'linkedin', // it always throws an error even if link really works
      '*/docs/release-notes*', // there are a lot of Github links that will throw an 429 error (Github doesn't allow to unlimited requests)
      '*/docs/next/release-notes*', // same as above
      '*/docs/*.*' // exclude links on version pages
    ]
  },
  {
    error: (error) => {
      displayErrorMessage(error);
    },

    link: (result) => {
      if (result.broken) {
        if (
          result.http.response &&
          ![undefined, 200, 429].includes(result.http.response.statusCode) &&
          result.http.response.url.includes(SITE_TO_CHECK)
        ) {
          brokenLinks.push({
            statusCode: result.http.response.statusCode,
            url: result.url.original,
            internal: result.internal
          });

          if (result.internal) {
            console.log(chalk.red(`broken internal link ${result.http.response.statusCode} => ${result.url.original}`));
          } else {
            console.log(chalk.yellow(`broken external link ${result.http.response.statusCode} => ${result.url.original}`));
          }
        }
      }
    },

    end: () => {
      console.log(chalk.green('CHECK FOR BROKEN LINKS FINISHED!'));

      const internalLinksCount = brokenLinks.filter(link => link.internal).length;
      const externalLinksCount = brokenLinks.filter(link => !link.internal).length;

      if (internalLinksCount) {
        throw new Error(`
Internal broken links: ${internalLinksCount}
External broken links: ${externalLinksCount}
        `);
      }
    }
  }
);

siteChecker.enqueue(`http://127.0.0.1:8080/${SITE_TO_CHECK}`);
