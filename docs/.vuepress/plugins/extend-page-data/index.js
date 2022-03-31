const {
  getSidebars,
  getLatestVersion,
  getVersions,
  parseVersion,
  parseFramework,
  getDefaultFramework,
  getBuildDocsFramework,
  getBuildDocsVersion,
} = require('../../helpers');
const { collectAllUrls, getCanonicalUrl } = require('./canonicals');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';

const DOCS_VERSION = getBuildDocsVersion();
const DOCS_FRAMEWORK = getBuildDocsFramework();

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
      $page.DOCS_VERSION = DOCS_VERSION;
      $page.DOCS_FRAMEWORK = DOCS_FRAMEWORK;
      $page.versions = getVersions(buildMode);
      $page.latestVersion = getLatestVersion();
      $page.currentVersion = parseVersion($page.path);
      $page.currentFramework = parseFramework($page.path);
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.frontmatter.canonicalUrl = getCanonicalUrl($page.frontmatter.canonicalUrl);

      const isSingleBuild = DOCS_VERSION && DOCS_FRAMEWORK;
      const isFrameworkLastVersion = DOCS_FRAMEWORK &&
        $page.currentVersion === $page.latestVersion && $page.currentFramework === DOCS_FRAMEWORK;
      const isSingleVersionFramework = DOCS_VERSION &&
        $page.currentVersion === DOCS_VERSION && $page.currentFramework === getDefaultFramework();
      const everyBuild = $page.currentVersion === $page.latestVersion &&
        $page.currentFramework === getDefaultFramework();

      if ($page.frontmatter.permalink) {
        if (isSingleBuild || isFrameworkLastVersion || isSingleVersionFramework || everyBuild) {
          $page.frontmatter.permalink = $page.frontmatter.permalink.replace(/^\/[^/]*\//, '/');

        } else {
          // We store permalink in .MD files in form <VERSION>/<DASHED WORDS>.
          $page.frontmatter.permalink = `/${$page.currentFramework}${$page.frontmatter.permalink}`;
        }
      }
    },
  };
};
