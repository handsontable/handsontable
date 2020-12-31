const isDev = true || process.env.NODE_ENV === 'development'; // temporary test 'true', because `yarn build` always has k`node_env = production`

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
  scripts: ['https://handsontable.com/docs/8.2.0/components/handsontable/dist/handsontable.full.min.js'], // todo https://github.com/handsontable/docs-md/issues/9
  // stylesheets: ['https://handsontable.com/docs/8.2.0/components/handsontable/dist/handsontable.full.min.css'],
  themeConfig: {
    gtag: {
      trackingID: 'GTM-55L5D3',
    },
    navbar: {
      title: 'Handsontable',
      logo: {
        alt: 'My Site Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          to: '/',
          activeBasePath: 'docs',
          label: 'Docs',
          position: 'left',
        },
        {
          href: 'https://github.com/handsontable/handsontable',
          label: 'GitHub',
          position: 'right',
        },
        {
          type: 'docsVersionDropdown',
          position: 'right',
          dropdownActiveClassDisabled: true,
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
          remarkPlugins:[require('./packages/hot-preview-remark')], // todo make Adda package
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
        pages: false,
        blog: false
      },
    ],
  ],
};
