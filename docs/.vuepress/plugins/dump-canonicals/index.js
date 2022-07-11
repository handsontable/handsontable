const fsp = require('fs').promises;
const path = require('path');
const { logger } = require('@vuepress/shared-utils');
const {
  getThisDocsVersion,
} = require('../../helpers');

const pluginName = 'hot/dump-canonicals';
const canonicals = {
  v: getThisDocsVersion(),
  urls: [],
};

module.exports = (options, context) => {
  const outputFile = options.outputDir || path.resolve(context.publicDir);

  return {
    name: pluginName,

    /**
     * Based on the permalink of the latest docs version generate nginx redirect rules.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    async extendPageData($page) {
      if ($page.frontmatter.permalink) {
        // Remove the slash ('/') from the beginning of the URL path to reduce file size
        canonicals.urls.push($page.frontmatter.permalink.replace(/^\//, ''));
      }
    },

    /**
     * Save collected canonical URLs to the file.
     */
    async ready() {
      try {
        await fsp.writeFile(`${outputFile}/raw.json`, JSON.stringify(canonicals));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputFile}): ${ex}`);
      }
    }
  };
};
