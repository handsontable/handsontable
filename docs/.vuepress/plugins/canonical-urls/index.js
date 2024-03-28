const {
  getDocsHostname,
  getThisDocsVersion,
} = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/canonical-urls';

module.exports = (options, context) => {
  return {
    name: pluginName,

    async ready() {
      let pathVersion = '';

      // Change path for `/data/common.json` file for developing released docs versions locally.
      if (buildMode !== 'production' && getThisDocsVersion() !== 'next') {
        pathVersion = `${getThisDocsVersion()}/`;
      }

      const response = await fetch(`${getDocsHostname(false)}/docs/${pathVersion}data/common.json`);
      const docsData = await response.json();
      const canonicalURLs = new Map(docsData.urls);

      context.pages.forEach(($page) => {
        const frontmatter = $page.frontmatter;
        const canonicalShortUrl = frontmatter.canonicalShortUrl;
        const docsVersion = canonicalURLs.get(canonicalShortUrl);
        const docsVersionPath = docsVersion === '' ? '' : `/${docsVersion}`;

        frontmatter.canonicalUrl = `${getDocsHostname()}/docs${docsVersionPath}/${canonicalShortUrl}/`;
      });
    },
  };
};
