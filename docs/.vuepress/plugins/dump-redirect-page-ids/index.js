const fsp = require('fs').promises;
const path = require('path');
const { logger } = require('@vuepress/shared-utils');

const pluginName = 'hot/dump-redirect-page-ids';
const pageIdsMap = new Map();

module.exports = (options, context) => {
  const outputFile = options.outputFile || path.resolve(context.sourceDir, 'redirect-page-ids.json');

  return {
    name: pluginName,

    /**
     * Collect the canonical URLs of the currently generated Docs version.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    async extendPageData($page) {
      const pageId = $page.frontmatter.id;

      if ($page.regularPath !== '/404.html' && !pageId) {
        throw new Error(`The pageId for the page ${$page.regularPath} is missing`);
      }

      if (pageIdsMap.has(pageId)) {
        throw new Error(`The pageId (${pageId}) is already taken!`);
      }

      pageIdsMap.set(pageId, `/${$page.frontmatter.permalink}/`.replace(/(\/)+/g, '$1'));
    },

    /**
     * Save collected canonical URLs to the file.
     */
    async ready() {
      const pageIdsAsObject = Array.from(pageIdsMap.entries()).reduce((object, [key, value]) => {
        object[key] = value;

        return object;
      }, {});

      try {
        await fsp.writeFile(outputFile, JSON.stringify(pageIdsAsObject));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputFile}): ${ex}`);
        process.exit(1);
      }
    }
  };
};
