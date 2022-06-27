const fsp = require('fs').promises;
const path = require('path');
const { logger } = require('@vuepress/shared-utils');
const {
  getThisDocsVersion,
  getVersions,
  getLatestVersion,
} = require('../../helpers');

const pluginName = 'hot/dump-docs-data';

module.exports = (options, context) => {
  const outputFile = options.outputFile || path.resolve(context.sourceDir, 'docs-data.json');

  return {
    name: pluginName,

    async chainMarkdown() {
      try {
        const content = {
          versions: getVersions(),
          latestVersion: getLatestVersion(),
        };

        await fsp.writeFile(outputFile, JSON.stringify(content));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputFile}): ${ex}`);
      }
    },
  };
};
