const {
  getSidebars,
  getLatestVersion,
  getThisDocsVersion,
  getVersions,
  getDocsBaseUrl,
} = require('../../helpers');
const { collectAllUrls, getCanonicalUrl } = require('./canonicals');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';

collectAllUrls();

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const twoDigitDay = date.getDate();
  const shortMonthName = date.toLocaleString('default', { month: 'short' });

  return `${shortMonthName} ${twoDigitDay}, ${date.getFullYear()}`;
};

module.exports = (options, context) => {
  return {
    name: pluginName,

    ready() {
      context.themeConfig.sidebar = getSidebars(buildMode);
    },

    /**
     * Extends and updates a page with additional information for versioning.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    extendPageData($page) {
      $page.versions = getVersions(buildMode);
      $page.latestVersion = getLatestVersion();
      $page.currentVersion = getThisDocsVersion();
      $page.baseUrl = getDocsBaseUrl();
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.frontmatter.canonicalUrl = getCanonicalUrl($page.frontmatter.canonicalUrl);
    },
  };
};
