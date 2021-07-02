const path = require('path');
const { logger } = require('@vuepress/shared-utils');

module.exports = (options, context) => {
  const pluginName = 'hot/generate-nginx-redirects';

  const outputFile = options.outputFile || path.resolve(context.sourceDir, 'redirects.conf');

  return {
    name: pluginName,

    extendPageData($page) {
      if (!$page.currentVersion || !$page.latestVersion) {
        logger.error('The "currentVersion" and/or "latestVersion" is not set.')
      }

      if ($page.currentVersion === $page.latestVersion && $page.frontmatter.permalink) {
        // TODO add redirect generation here
      }
    }
  };
}
