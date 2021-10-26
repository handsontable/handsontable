const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const helpers = require('../../helpers');
const { getLatestVersion } = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/assets-versioning';

const DOCS_VERSION = helpers.getBuildDocsVersion();

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

      $page.DOCS_VERSION = DOCS_VERSION;
      $page.versions = helpers.getVersions(buildMode);
      $page.latestVersion = helpers.getLatestVersion();
      $page.currentVersion = helpers.parseVersion($page.path);
      $page.lastUpdatedFormat = formatDate($page.lastUpdated);
      $page.frontmatter.canonicalUrl =
        `https://handsontable.com/docs${($page.frontmatter.canonicalUrl ?? '').replace(/^\/?/, '/')}`;

      if ((DOCS_VERSION || $page.currentVersion === $page.latestVersion) && $page.frontmatter.permalink) {
        $page.frontmatter.permalink = $page.frontmatter.permalink.replace(/^\/[^/]*\//, '/');
      }
    },

    chainWebpack(config) {
      const files = helpers.getVersions(buildMode)
        .filter(v => DOCS_VERSION === v || !DOCS_VERSION)
        .map(version => ({
          context: path.resolve(context.sourceDir, version, 'public'),
          from: '**/*',
          to: `${!DOCS_VERSION || version === getLatestVersion() ? version : '.'}/`,
          force: true,
        }));

      config
        .plugin(`${pluginName}:assets-copy`)
        .use(CopyPlugin, [files]);
    },
  };
};
