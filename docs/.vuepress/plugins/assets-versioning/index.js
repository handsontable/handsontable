const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const helpers = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/assets-versioning';

module.exports = (options, context) => {
  return {
    name: pluginName,

    ready() {
      context.themeConfig.sidebar = helpers.getSidebars(buildMode);
    },

    /**
     * Extends and updates a page with additional information for versioning.
     *
     * @param {object} $page The $page value of the page you’re currently reading.
     */
    extendPageData($page) {
      const formatDate = (dateString) => {
        const date = new Date(dateString);
        const twoDigitDay = date.getDate();
        const shortMonthName = date.toLocaleString('default', { month: 'short' });

        return `${shortMonthName} ${twoDigitDay}, ${date.getFullYear()}`;
      };

      $page.versions = helpers.getVersions(buildMode);
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
    },

    chainWebpack(config) {
      const files = helpers.getVersions(buildMode).map(version => ({
        context: path.resolve(context.sourceDir, version, 'public'),
        from: '**/*',
        to: `${version}/`,
        force: true,
      }));

      config
        .plugin(`${pluginName}:assets-copy`)
        .use(CopyPlugin, [files]);
    },
  };
};
