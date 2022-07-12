const fsp = require('fs').promises;
const path = require('path');
const { logger } = require('@vuepress/shared-utils');
const { generateCommonCanonicalURLs } = require('./canonicals');
const {
  getThisDocsVersion,
} = require('../../helpers');

const pluginName = 'hot/dump-canonicals';
const canonicals = {
  v: getThisDocsVersion(),
  urls: [],
};

module.exports = (options, context) => {
  const outputDir = options.outputDir || path.resolve(context.publicDir);

  return {
    name: pluginName,

    /**
     * Based on the permalink of the latest docs version generate nginx redirect rules.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    async extendPageData($page) {
      if ($page.frontmatter.permalink) {
        // Remove the slash ('/') from the beginning of the URL path to reduce the resulting file size
        canonicals.urls.push($page.frontmatter.permalink.replace(/^\//, ''));
      }
    },

    /**
     * Save collected canonical URLs to the file.
     */
    async ready() {
      try {
        await fsp.mkdir(outputDir, { recursive: true });
        await fsp.writeFile(`${outputDir}/raw.json`, JSON.stringify(canonicals));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputDir}): ${ex}`);
        process.exit(1);
      }

      const canonicalURLs = await generateCommonCanonicalURLs(canonicals);
      const processedURLs = {
        urls: Array.from(canonicalURLs)
      };

      try {
        await fsp.writeFile(`${outputDir}/processed.json`, JSON.stringify(processedURLs));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputDir}): ${ex}`);
        process.exit(1);
      }
    }
  };
};
