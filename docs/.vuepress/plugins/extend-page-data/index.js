const {
  FRAMEWORK_SUFFIX,
  MULTI_FRAMEWORKED_CONTENT_DIR,
  getDefaultFramework,
  getDocsBase,
  getDocsHostname,
  getDocsRepoSHA,
  getFrameworks,
  getPrettyFrameworkName,
  getSidebars,
  getThisDocsVersion,
  parseFramework,
} = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/extend-page-data';
const now = new Date();

/**
 * Remove the slash from the beginning and ending of the string.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function removeEndingSlashes(string) {
  return string.replace(/^\//, '').replace(/\/$/, '');
}

/**
 * Dedupes the slashes in the string.
 *
 * @param {string} string String to process.
 * @returns {string}
 */
function dedupeSlashes(string) {
  return string.replace(/(\/)+/g, '$1');
}

/**
 * Returns the original (not symlinked) relative path of the MD file, which the page
 * are created from.
 *
 * @param {string} relativePath The relative path of the processed file (symlinked path).
 * @returns {string}
 */
function getOriginRelativePath(relativePath) {
  return relativePath
    .replace(new RegExp(`^/?${MULTI_FRAMEWORKED_CONTENT_DIR}`), '')
    .replace(new RegExp(`/(${getFrameworks().join('|')})${FRAMEWORK_SUFFIX}/`), '');
}

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
      const currentFramework = parseFramework($page.path);

      $page.currentVersion = getThisDocsVersion();
      $page.currentFramework = currentFramework;
      $page.frameworkName = getPrettyFrameworkName(currentFramework);
      $page.defaultFramework = getDefaultFramework();
      $page.frameworkSuffix = FRAMEWORK_SUFFIX;
      $page.buildMode = buildMode;
      $page.hostname = getDocsHostname();

      if ($page.relativePath) {
        $page.originRelativePath = getOriginRelativePath($page.relativePath);
      }

      if ($page.currentVersion === 'next') {
        $page.docsGenStamp = `<!--
Generated at ${now}
SHA: ${getDocsRepoSHA()}
-->`;
        // The `$page.lastUpdated` date is taken from `git log`. For Docs "next" it's impossible to take
        // the last change date for API files as they are added to gitignore.
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

      const frameworkPath = currentFramework + FRAMEWORK_SUFFIX;
      const hostWithBase = getDocsHostname() + getDocsBase();

      if ($page.frontmatter.canonicalUrl) {
        const canonicalShortUrl = removeEndingSlashes(frameworkPath + $page.frontmatter.canonicalUrl);

        // The "canonicalShortUrl" property is used by "dump-docs-data" plugin. The property holds the
        // canonical URL without slashes at the beginning and ending of the URL path and without Docs base.
        $page.frontmatter.canonicalShortUrl = canonicalShortUrl;
        $page.frontmatter.canonicalUrl = `${hostWithBase}${dedupeSlashes(`/${canonicalShortUrl}/`)}`;
      }

      if ($page.frontmatter.permalink) {
        $page.frontmatter.permalink = `/${frameworkPath}${$page.frontmatter.permalink}`;
      }

      // Add OpenGraph entries
      frontmatter.meta = [
        { name: 'og:url', content: `${hostWithBase}${dedupeSlashes(`/${$page.frontmatter.permalink}/`)}` },
        { name: 'og:type', content: 'website' },
        { name: 'og:title', content: frontmatter.title },
        { name: 'og:description', content: frontmatter.description },
        { name: 'og:image', content: `${hostWithBase}/img/handsontable-banner-og.png` },
      ];
    },
  };
};
