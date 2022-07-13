const fsp = require('fs').promises;
const path = require('path');
const { logger } = require('@vuepress/shared-utils');
const { generateCommonCanonicalURLs } = require('./canonicals');
const { fetchDocsVersions } = require('./docs-versions');
const {
  getThisDocsVersion,
} = require('../../helpers');

const pluginName = 'hot/dump-canonicals';
const rawCanonicalURLs = {
  v: getThisDocsVersion(),
  urls: [],
};
const docsDataCommon = {
  versions: [],
  latestVersion: '',
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
        // Remove the slash ('/') from the beginning and ending of the URL path to reduce
        // the resulting file size
        rawCanonicalURLs.urls
          .push($page.frontmatter.canonicalUrl.replace(/^\/docs\//, '').replace(/\/$/, ''));
      }
    },

    /**
     * Save collected canonical URLs to the file.
     */
    async ready() {
      try {
        await fsp.mkdir(outputDir, { recursive: true });
        await fsp.writeFile(`${outputDir}/canonicals-raw.json`, JSON.stringify(rawCanonicalURLs));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputDir}): ${ex}`);
        process.exit(1);
      }

      const docsVersions = await fetchDocsVersions();
      const canonicalURLs = await generateCommonCanonicalURLs(rawCanonicalURLs);

      docsDataCommon.urls = Array.from(canonicalURLs);
      docsDataCommon.versions = docsVersions.versions;
      docsDataCommon.latestVersion = docsVersions.latestVersion;

      try {
        await fsp.writeFile(`${outputDir}/common.json`, JSON.stringify(docsDataCommon));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputDir}): ${ex}`);
        process.exit(1);
      }
    }
  };
};
