const {
  getSidebars,
  getNormalizedPath,
  parseFramework,
  getThisDocsVersion,
  getPrettyFrameworkName,
  getDefaultFramework,
  FRAMEWORK_SUFFIX,
  getNotSearchableLinks,
  getDocsRepoSHA,
} = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';
const now = new Date();

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
      const normalizedPath = getNormalizedPath($page.path);
      const currentFramework = parseFramework(normalizedPath);

      $page.normalizedPath = normalizedPath;
      $page.currentVersion = getThisDocsVersion();
      $page.currentFramework = currentFramework;
      $page.frameworkName = getPrettyFrameworkName($page.currentFramework);
      $page.defaultFramework = getDefaultFramework();
      $page.frameworkSuffix = FRAMEWORK_SUFFIX;
      $page.buildMode = buildMode;
      $page.isSearchable = notSearchableLinks[$page.currentFramework]?.every(
        notSearchableLink => $page.normalizedPath.includes(notSearchableLink) === false);

      if ($page.currentVersion === 'next') {
        $page.docsGenStamp = `<!--
Generated at ${now}
SHA: ${getDocsRepoSHA()}
-->`;
        // The `$page.lastUpdated` date is taken from `git log`. For Docs "next" it's impossible to take
        // the last change date for API files (for "next" they are added to gitignore).
        $page.lastUpdatedFormat = formatDate(new Date());
      } else {
        $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      }

      const frontmatter = $page.frontmatter;

      if (frontmatter[currentFramework]) {
        Object.keys(frontmatter[currentFramework]).forEach((key) => {
          frontmatter[key] = frontmatter[currentFramework][key] ?? frontmatter[key];
        });
      }

      const frameworkPath = $page.currentFramework + FRAMEWORK_SUFFIX;

      if ($page.frontmatter.canonicalUrl) {
        $page.frontmatter.canonicalUrl = dedupeSlashes(`/docs/${frameworkPath}${$page.frontmatter.canonicalUrl}/`);
      }

      if ($page.frontmatter.permalink) {
        $page.frontmatter.permalink = `/${frameworkPath}${$page.frontmatter.permalink}`;
      }
    },
  };
};
