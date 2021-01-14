// eslint-disable-next-line global-require
const hotPreviewRemarkPlugin = require('./src/hot-preview-remark');

const isDev = true || process.env.NODE_ENV === 'development'; // temporary test 'true', because `yarn build` always has k`node_env = production`

// eslint-disable-next-line no-console
console.log('isDev', isDev, process.env.NODE_ENV);
module.exports = {
  title: 'Handsontable',
  tagline: 'Documentation',
  url: 'https://handsontable.com/docs',
  baseUrl: '/docs/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'Handsontable',
  projectName: 'Handsontable',
  themeConfig: {
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false
    },
    gtag: {
      trackingID: 'GTM-55L5D3',
    },
    navbar: {
      title: 'Handsontable',
      items: [
        {
          to: '/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
          className: 'hot-navbar-item-docs'
        },
        {
          type: 'docsVersionDropdown',
          position: 'left',
          dropdownActiveClassDisabled: true,
        },
        {
          to: '/',
          activeBasePath: 'docs',
          label: 'API',
          position: 'right',
        },
        {
          to: '/',
          activeBasePath: 'docs',
          label: 'Guides',
          position: 'right',
        },
        {
          to: '/',
          activeBasePath: 'docs',
          label: 'Blog',
          position: 'right',
        },
        {
          label: 'Support',
          position: 'right',
          items: [
            {
              label: 'Discussion',
              href: 'https://handsontable.com',
            },
            {
              label: 'Report an issue',
              href: 'https://handsontable.com',
            },
            {
              label: 'Contact support',
              href: 'https://handsontable.com',
            }
          ],
        },
        {
          href: 'https://github.com/handsontable/handsontable',
          position: 'right',
          className: 'hot-navbar-item-github',
          'aria-label': 'GitHub repository',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} Handsontable.`,
    },
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
          editUrl: 'https://github.com/handsontable/handsontable/edit/master/website/docs-md',
          includeCurrentVersion: isDev,
          remarkPlugins: [hotPreviewRemarkPlugin],
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
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
