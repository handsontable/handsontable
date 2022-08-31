/**
 * The plugin is copy/paste of the official @vuepress/plugin-active-header-links plugin.
 * For the plugin added support for anchor top offset (anchorTopOffset). The option is useful in cases
 * when the CSS property "scroll-padding-top" is used.
 */
const { path } = require('@vuepress/shared-utils');

module.exports = options => ({
  clientRootMixin: path.resolve(__dirname, 'clientRootMixin.js'),
  define: {
    AHL_SIDEBAR_LINK_SELECTOR: options.sidebarLinkSelector || '.sidebar-link',
    AHL_HEADER_ANCHOR_SELECTOR: options.headerAnchorSelector || '.header-anchor',
    AHL_ANCHOR_TOP_OFFSET: options.anchorTopOffset || 0,
  }
});
