const {
  getSidebars,
  getLatestVersion,
  parseVersion,
  parseFramework,
  getEnvDocsFramework,
  getEnvDocsVersion,
  getDocsFrameworkedVersions,
  getDocsNonFrameworkedVersions,
  isEnvDev,
  getDefaultFramework,
  FRAMEWORK_SUFFIX,
  TMP_DIR_FOR_WATCH,
} = require('../../helpers');
const { collectAllUrls, getCanonicalUrl } = require('./canonicals');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';

const DOCS_VERSION = getEnvDocsVersion();
const DOCS_FRAMEWORK = getEnvDocsFramework();

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
      $page.normalizedPath = isEnvDev() ?
        $page.path.replace(new RegExp(`^/?${TMP_DIR_FOR_WATCH}`), '') : $page.path;
      $page.frameworkedVersions = getDocsFrameworkedVersions(buildMode);
      $page.nonFrameworkedVersions = getDocsNonFrameworkedVersions(buildMode);
      $page.latestVersion = getLatestVersion();
      $page.currentVersion = parseVersion($page.normalizedPath);
      // Framework isn't stored in PATH for full build. However, it's defined in ENV variable.
      $page.currentFramework = DOCS_FRAMEWORK || parseFramework($page.normalizedPath);
      $page.defaultFramework = getDefaultFramework();
      $page.frameworkSuffix = FRAMEWORK_SUFFIX;
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.frontmatter.canonicalUrl = getCanonicalUrl($page.frontmatter.canonicalUrl);

      const isFrameworked = getDocsFrameworkedVersions(buildMode).includes($page.currentVersion);
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
    },
  };
};
