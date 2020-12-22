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
  themeConfig: {
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
          // // COMMENT because it throws broking links error.
          // // Or if set absolute path, it open links in new tab.
          // // Instead of this, mock versions generated.
          // dropdownItemsAfter: [
          //   {to:"/docs/8.2.0/", label: "8.2.x"},
          //   {to:"/docs/8.1.0/", label: "8.1.x"},
          //   {to:"/docs/8.0.0/", label: "8.0.x"},
          //   {to:"/docs/7.4.2/", label: "7.4.x"},
          //   {to:"/docs/7.3.0/", label: "7.3.x"},
          //   {to:"/docs/7.2.2/", label: "7.2.x"},
          //   {to:"/docs/7.1.1/", label: "7.1.x"},
          //   {to:"/docs/7.0.3/", label: "7.0.x"},
          //   {to:"/docs/6.2.2/", label: "6.2.x"},
          //   {to:"/docs/6.1.1/", label: "6.1.x"},
          //   {to:"/docs/6.0.1/", label: "6.0.x"},
          //   {to:"/docs/5.0.2/", label: "5.0.x"},
          //   {to:"/docs/4.0.0/", label: "4.0.x"},
          // ],
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
      '@docusaurus/preset-classic',
      {
        debug: isDev,
        docs: {
          routeBasePath:'/',
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/handsontable/handsontable/edit/master/website/docs-md',
          includeCurrentVersion: isDev
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
