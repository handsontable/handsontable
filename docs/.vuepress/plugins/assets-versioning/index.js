const CopyPlugin = require('copy-webpack-plugin');
const path = require('path');
const {
  getEnvDocsVersion,
  getSidebars,
  getFrameworks,
  getDocsNonFrameworkedVersions,
  getDocsFrameworkedVersions,
  FRAMEWORK_SUFFIX,
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
      const configs = [];
      const needAssets = version => DOCS_VERSION === version || !DOCS_VERSION;
      const pushConfig = (version, framework) => {
        let to = '';

        if (context.base === '/docs/') {
          to += `${version}/`;

          if (framework !== void 0) {
            to += `${framework}${FRAMEWORK_SUFFIX}/`;
          }
        }

        configs.push({
          context: path.resolve(context.sourceDir, version, 'public'),
          from: '**/*',
          to,
          force: true,
        });
      };

      getDocsNonFrameworkedVersions(buildMode).filter(needAssets).forEach((version) => {
        pushConfig(version);
      });

      getDocsFrameworkedVersions(buildMode).filter(needAssets).forEach((version) => {
        getFrameworks().forEach((framework) => {
          pushConfig(version, framework);
        });
      });

      config
        .plugin(`${pluginName}:assets-copy`)
        .use(CopyPlugin, [configs]);
    },
  };
};
