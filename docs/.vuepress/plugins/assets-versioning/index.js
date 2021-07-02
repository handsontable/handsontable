const helpers = require('../../helpers');

const buildMode = process.env.BUILD_MODE;

module.exports = (options, context) => {
  const pluginName = 'hot/assets-versioning';
  const defaultPluginOptions = {
    name: pluginName,

    ready() {
      context.themeConfig.sidebar = helpers.getSidebars(buildMode)
    }
  }

  return Object.assign(defaultPluginOptions, {
    /**
     * Extends and updates a page with additional information for versioning.
     */
    extendPageData($page) {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const twoDigitDay = date.getDate();
        const shortMonthName = date.toLocaleString('default', { month: 'short' });

        return `${shortMonthName} ${twoDigitDay}, ${date.getFullYear()}`;
      };

      $page.versions = helpers.getVersions();
      $page.latestVersion = helpers.getLatestVersion();
      $page.currentVersion = helpers.parseVersion($page.path);
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);

      if ($page.currentVersion === $page.latestVersion && $page.frontmatter.permalink) {
        $page.frontmatter.permalink = $page.frontmatter.permalink.replace(/^\/[^/]*\//, '/');
        $page.frontmatter.canonicalUrl = undefined;
      }

      if ($page.currentVersion !== $page.latestVersion && $page.frontmatter.canonicalUrl) {
        $page.frontmatter.canonicalUrl = `https://handsontable.com/docs${$page.frontmatter.canonicalUrl}`;
      }
    }
  })
}
