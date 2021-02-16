// eslint-disable-next-line global-require
const hotPreviewRemarkPlugin = require('./src/hot-preview-remark');

const isDev = true || process.env.NODE_ENV === 'development'; // temporary test 'true', because `yarn build` always has k`node_env = production`
const getLegacyVersionUrl = (version) => (isDev ? 'https://dev.handsontable.com/docs/' : 'https://handsontable.com/docs/') + version;
// eslint-disable-next-line no-console
console.log('isDev', isDev, process.env.NODE_ENV);
module.exports = {
  title: 'Handsontable',
  tagline: 'Documentation',
  url: 'https://handsontable.com/docs',
  baseUrl: '/docs/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon-32x32.png',
  organizationName: 'Handsontable',
  projectName: 'Handsontable',
  themeConfig: {
    announcementBar: isDev && {
      content: `Development, built at ${new Date().toLocaleString()}`,
      backgroundColor: '#fafbfc',
      textColor: '#091E42',
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    gtag: {
      trackingID: 'GTM-55L5D3',
    },
    navbar: {
      title: 'Handsontable Docs',
      items: [ // todo type: 'doc', @see https://v2.docusaurus.io/docs/api/themes/configuration#navbar-doc-link
        {
          type: 'docsVersionDropdown',
          position: 'left',
          dropdownActiveClassDisabled: true,
          dropdownItemsAfter: [
            { label: '8.2', to: getLegacyVersionUrl('8.2.0'), target: '_self' },
            { label: '8.1', to: getLegacyVersionUrl('8.1.0'), target: '_self' },
            { label: '8.0', to: getLegacyVersionUrl('8.0.0'), target: '_self' },
            { label: '6.2', to: getLegacyVersionUrl('6.2.2'), target: '_self' },
            { label: '7.4', to: getLegacyVersionUrl('7.4.2'), target: '_self' },
            { label: '7.3', to: getLegacyVersionUrl('7.3.0'), target: '_self' },
            { label: '7.2', to: getLegacyVersionUrl('7.2.2'), target: '_self' },
            { label: '7.1', to: getLegacyVersionUrl('7.1.1'), target: '_self' },
            { label: '7.0', to: getLegacyVersionUrl('7.0.3'), target: '_self' },
            { label: '6.1', to: getLegacyVersionUrl('6.1.1'), target: '_self' },
            { label: '6.0', to: getLegacyVersionUrl('6.0.1'), target: '_self' },
            { label: '5.0', to: getLegacyVersionUrl('5.0.2'), target: '_self' },
            { label: '4.0', to: getLegacyVersionUrl('4.0.0'), target: '_self' },
          ],
        },
        {
          label: 'API',
          to: 'api',
          activeBaseRegex: 'docs/([0-9.]*|next/)?api.*',
          position: 'right',
        },
        {
          label: 'Guides',
          to: '/docs/tutorial-quick-start',
          position: 'right',
        },
        {
          label: 'Blog',
          href: 'https://handsontable.com/blog/',
          position: 'right',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/handsontable/handsontable',
          position: 'right',
        },
        {
          label: 'Support',
          position: 'right',
          items: [
            {
              label: 'Discussion',
              // todo 404: href: 'https://github.com/handsontable/handsontable/discussions',
              href: 'https://github.com/handsontable/handsontable?discussions',
            },
            {
              label: 'Report an issue',
              href: 'https://github.com/handsontable/handsontable/issues/new',
            },
            {
              label: 'Contact support',
              href: 'https://handsontable.com/contact?category=technical_support',
            },
          ],
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Handsontable.`,
    },
    // algolia: {
    //   apiKey: '6b1f6a9141059860765e9ab6b9cabd0b',
    //   indexName: 'handsontable',
    //   searchParameters: {
    //     facetFilters: 'tags:current',
    //   },
    // },
  },
  presets: [
    [
      '@docusaurus/preset-classic', // todo preset-hansontable same as classic but without blog and pages ( smaller dependency tree )
      {
        debug: isDev,
        docs: {
          path: 'next',
          routeBasePath: '/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/handsontable/handsontable/edit/master/docs',
          includeCurrentVersion: isDev,
          remarkPlugins: [hotPreviewRemarkPlugin],
          showLastUpdateAuthor: false,
          showLastUpdateTime: true,
          versions: {
            '9.0': {
              label: 'Latest (9.0)',
            },
          },
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        pages: false,
        blog: false,
      },
    ],
  ],
};
