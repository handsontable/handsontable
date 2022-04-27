const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {
  getEnvDocsVersion,
  getSidebars,
  getLatestVersion,
  getVersions,
} = require('../../helpers');

const buildMode = process.env.BUILD_MODE;
const pluginName = 'hot/assets-versioning';

const DOCS_VERSION = getEnvDocsVersion();

module.exports = (options, context) => {
  return {
    name: pluginName,

    ready() {
      context.themeConfig.sidebar = getSidebars(buildMode);
    },

    chainWebpack(config) {
      const files = getVersions(buildMode)
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
