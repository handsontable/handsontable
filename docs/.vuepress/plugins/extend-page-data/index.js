const {
  getSidebars,
  getNormalizedPath,
  parseFramework,
  getThisDocsVersion,
  getDocsBaseUrl,
  getPrettyFrameworkName,
  getEnvDocsFramework,
  isEnvDev,
  getDefaultFramework,
  FRAMEWORK_SUFFIX,
  getNotSearchableLinks,
} = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';

const DOCS_FRAMEWORK = getEnvDocsFramework();

/**
 * Dedupes the slashes in the string.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function dedupeSlashes(string) {
  return string.replace(/(\/)+/g, '$1');
}

const notSearchableLinks = getNotSearchableLinks();
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
      context.themeConfig.sidebar = getSidebars();
    },

    /**
     * Extends and updates a page with additional information for versioning.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    extendPageData($page) {
      $page.normalizedPath = getNormalizedPath($page.path);
      $page.baseUrl = getDocsBaseUrl();
      $page.currentVersion = getThisDocsVersion();
      // Framework isn't stored in PATH for full build. However, it's defined in ENV variable.
      $page.currentFramework = DOCS_FRAMEWORK || parseFramework($page.normalizedPath);
      $page.frameworkName = getPrettyFrameworkName($page.currentFramework);
      $page.defaultFramework = getDefaultFramework();
      $page.frameworkSuffix = FRAMEWORK_SUFFIX;
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.isEnvDev = isEnvDev();
      $page.buildMode = buildMode;
      $page.frontmatter.canonicalUrl = dedupeSlashes(`/docs${$page.frontmatter.canonicalUrl}/`);
      $page.isSearchable =
        notSearchableLinks[$page.currentFramework]?.every(
          notSearchableLink => $page.normalizedPath.includes(notSearchableLink) === false);

      if ($page.frontmatter.permalink) {
        if ($page.currentVersion !== 'next') {
          $page.frontmatter.permalink = $page.frontmatter.permalink.replace(/^\/[^/]*\//, '/');
        }

        // Only dev script need to perform build to specific place. Full build script perform moving directory separately.
        if (isEnvDev()) {
          $page.frontmatter.permalink = `/${$page.currentFramework}${FRAMEWORK_SUFFIX}${$page.frontmatter.permalink}`;
        }
      }
    },
  };
};
