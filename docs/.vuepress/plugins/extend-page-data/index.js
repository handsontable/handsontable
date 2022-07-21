const {
  getSidebars,
<<<<<<< HEAD
  getLatestVersion,
  getNormalizedPath,
  parseVersion,
  parseFramework,
=======
  getThisDocsVersion,
>>>>>>> develop
  getDocsBaseUrl,
  getPrettyFrameworkName,
  getEnvDocsFramework,
  getEnvDocsVersion,
  getDocsFrameworkedVersions,
  getDocsNonFrameworkedVersions,
  isEnvDev,
  getDefaultFramework,
  FRAMEWORK_SUFFIX,
  getNotSearchableLinks,
} = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';

<<<<<<< HEAD
const DOCS_VERSION = getEnvDocsVersion();
const DOCS_FRAMEWORK = getEnvDocsFramework();

collectAllUrls();
=======
/**
 * Dedupes the slashes in the string.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function dedupeSlashes(string) {
  return string.replace(/(\/)+/g, '$1');
}
>>>>>>> develop

const notSearchableLinks = getNotSearchableLinks(buildMode);
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
<<<<<<< HEAD
      $page.DOCS_VERSION = DOCS_VERSION;
      $page.DOCS_FRAMEWORK = DOCS_FRAMEWORK;
      $page.normalizedPath = getNormalizedPath($page.path);
      $page.frameworkedVersions = getDocsFrameworkedVersions(buildMode);
      $page.nonFrameworkedVersions = getDocsNonFrameworkedVersions(buildMode);
      $page.latestVersion = getLatestVersion();
      $page.baseUrl = getDocsBaseUrl();
      $page.currentVersion = parseVersion($page.normalizedPath);
      // Framework isn't stored in PATH for full build. However, it's defined in ENV variable.
      $page.currentFramework = DOCS_FRAMEWORK || parseFramework($page.normalizedPath);
      $page.frameworkName = getPrettyFrameworkName($page.currentFramework);
      $page.defaultFramework = getDefaultFramework();
      $page.frameworkSuffix = FRAMEWORK_SUFFIX;
      $page.isFrameworked = getDocsFrameworkedVersions(buildMode).includes($page.currentVersion);
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.frontmatter.canonicalUrl = getCanonicalUrl($page.frontmatter.canonicalUrl);
      $page.isEnvDev = isEnvDev();

      if ($page.currentFramework !== void 0) {
        $page.isSearchable =
          notSearchableLinks[$page.currentFramework][$page.currentVersion]?.every(
            notSearchableLink => $page.normalizedPath.includes(notSearchableLink) === false);

      } else {
        $page.isSearchable =
          notSearchableLinks[$page.currentVersion]?.every(
            notSearchableLink => $page.normalizedPath.includes(notSearchableLink) === false);
      }

      const isFrameworked = $page.isFrameworked;
      const buildingSingleVersion = DOCS_VERSION !== void 0 && (DOCS_FRAMEWORK !== void 0 || DOCS_FRAMEWORK === void 0
        && isFrameworked === false);

      if ($page.frontmatter.permalink) {
        if (buildingSingleVersion || $page.latestVersion === $page.currentVersion) {
          $page.frontmatter.permalink = $page.frontmatter.permalink.replace(/^\/[^/]*\//, '/');

          // Only dev script need to perform build to specific place. Full build script perform moving directory separately.
          if (isEnvDev() && isFrameworked && buildingSingleVersion === false) {
            $page.frontmatter.permalink = `/${$page.currentFramework}${FRAMEWORK_SUFFIX}${$page.frontmatter.permalink}`;
          }

        // Only dev script need to perform build to specific place. Full build script perform moving directory separately.
        } else if (isEnvDev() && isFrameworked) {
          const permalinkPartsWithoutVersion = $page.frontmatter.permalink.split(`/${$page.currentVersion}`);

          $page.frontmatter.permalink = ['/', $page.currentVersion, `/${$page.currentFramework}${FRAMEWORK_SUFFIX}`,
            ...permalinkPartsWithoutVersion].join('');
        }
      }
=======
      $page.currentVersion = getThisDocsVersion();
      $page.buildMode = buildMode;
      $page.baseUrl = getDocsBaseUrl();
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.frontmatter.canonicalUrl = dedupeSlashes(`/docs${$page.frontmatter.canonicalUrl}/`);
>>>>>>> develop
    },
  };
};
