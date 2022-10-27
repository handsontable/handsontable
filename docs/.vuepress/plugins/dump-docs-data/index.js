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
  patches: [],
};

module.exports = (options, context) => {
  const outputDir = options.outputDir || path.resolve(context.publicDir);

  return {
    name: pluginName,

    /**
     * Collect the canonical URLs of the currently generated Docs version.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    async extendPageData($page) {
      if ($page.frontmatter.canonicalShortUrl) {
        rawCanonicalURLs.urls.push($page.frontmatter.canonicalShortUrl);
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
      const minorsLimit = docsVersions.versions[0] === 'next' ? 7 : 6;

      docsDataCommon.urls = Array.from(canonicalURLs);
      docsDataCommon.versions = docsVersions.versions.slice(0, minorsLimit);
      docsDataCommon.latestVersion = docsVersions.latestVersion;
      docsDataCommon.patches = docsVersions.patches;

      try {
        await fsp.writeFile(`${outputDir}/common.json`, JSON.stringify(docsDataCommon));
      } catch (ex) {
        logger.error(`Something bad happens while writing to the file (${outputDir}): ${ex}`);
        process.exit(1);
      }
    }
  };
};
