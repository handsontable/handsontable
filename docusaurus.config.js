const isDev = process.env.NODE_ENV === 'development';

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
