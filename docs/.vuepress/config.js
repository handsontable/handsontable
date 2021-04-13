const highlight = require('./highlight');
const helpers = require('./helpers');
const examples = require('./examples');

const environmentHead = process.env.BUILD_MODE === 'production' ?
  [
    // Google Tag Manager, an extra element within the `ssr.html` file.
    ['script', {}, `
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        '//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
      })(window,document,'script','dataLayer','GTM-55L5D3');
    `],
    // Google Console //todo replace with valid token
    // ['meta', { name: 'google-site-verification', content: 'MZpSOa8SNvFLRRGwUQpYVZ78kIHQoPVdVbafHhJ_d4Q' }]
  ]
  : [];

module.exports = {
  patterns: ['**/*.md', '!README.md', '!README-EDITING.md', '!README-DEPLOYMENT.md'], // to enable vue pages add: '**/*.vue'.
  description: 'Handsontable',
  base: '/docs/',
  head: [
    ['script', { src: '/scripts/handsontable-manager.js' }],
    ['link', { rel: 'icon', href: 'https://handsontable.com/static/images/template/ModCommon/favicon-32x32.png' }],
    ['meta', { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    ...environmentHead
  ],
  markdown: {
    toc: {
      includeLevel: [2],
      containerHeaderHtml: '<div class="toc-container-header">Table of contents</div>'
    },
  },
  plugins: [
    'tabs',
    ['sitemap', {
      hostname: 'https://handsontable.com',
    }],
    ['@vuepress/active-header-links', {
      sidebarLinkSelector: '.table-of-contents a',
      headerAnchorSelector: '.header-anchor'
    }],
    ['container', examples],
    {
      chainMarkdown(config) {
        // inject custom markdown highlight with our snippet runner
        config
          .options
          .highlight(highlight)
          .end();
      },
    },
  ],
  extendPageData($page) {
    $page.versions = helpers.getVersions();
    $page.latestVersion = helpers.getLatestVersion();
    $page.currentVersion = helpers.parseVersion($page.path);
    $page.lastUpdatedFormat = new Date($page.lastUpdated)
        .toDateString()
        .replace(/^\w+? /, '')
        .replace(/(\d) (\d)/, '$1, $2');

    if ($page.currentVersion === $page.latestVersion && $page.frontmatter.permalink) {
      $page.frontmatter.permalink = $page.frontmatter.permalink.replace(/^\/[^/]*\//, '/');
      $page.frontmatter.canonicalUrl = undefined;
    }
    if ($page.currentVersion !== $page.latestVersion && $page.frontmatter.canonicalUrl) {
      $page.frontmatter.canonicalUrl='https://handsontable.com/docs'+$page.frontmatter.canonicalUrl;
    }
  },
  themeConfig: {
    logo: '/logo.svg',
    nextLinks: true,
    prevLinks: true,
    repo: 'handsontable/handsontable',
    docsRepo: 'handsontable/handsontable',
    docsDir: 'docs',
    docsBranch: 'develop',
    editLinks: true,
    editLinkText: 'Suggest edits',
    lastUpdated: true,
    smoothScroll: false,
    nav: [
      // Guide & API Reference has defined in: theme/components/NavLinks.vue
      { text: 'GitHub', link: 'https://github.com/handsontable/handsontable' },
      { text: 'Blog', link: 'https://handsontable.com/blog' },
      { text: 'Support',
        items: [
          { text: 'Forum', link: 'https://forum.handsontable.com' },
          { text: 'Report an issue', link: 'https://github.com/handsontable/handsontable/issues/new' },
          { text: 'Contact support', link: 'https://handsontable.com/contact?category=technical_support' },
        ]
      },
    ],
    displayAllHeaders: true, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 0,
    sidebar: helpers.getSidebars(),
    search: true,
    searchPlaceholder: 'Search...',
    searchMaxSuggestions: 10
  }
};
