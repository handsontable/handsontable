const highlight = require('./highlight');
const helpers = require('./helpers');
const examples = require('./examples');

module.exports = {
  description: 'Handsontable',
  base: '/docs/',
  head: [
    ['script', { src: 'https://cdn.jsdelivr.net/npm/handsontable@8.3.1/dist/handsontable.full.min.js' }],
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/handsontable@8.3.1/dist/handsontable.full.min.css' }],
    ['script', { src: '/scripts/handsontable-instances-register.js' }],
    // // Google Tag Manager, an extra element within the `ssr.html` file.
    // ['script', {}, `
    //   (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    //   new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    //   j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    //   'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    //   })(window,document,'script','dataLayer','GTM-N59TZXR');
    // `],
    // // Google Console
    // ['meta', { name: 'google-site-verification', content: 'MZpSOa8SNvFLRRGwUQpYVZ78kIHQoPVdVbafHhJ_d4Q' }]
  ],
  markdown: {
    toc: {
      includeLevel: [2,3],
      containerHeaderHtml: '<div class="toc-container-header">Table of contents</div>'
    },
  },
  plugins: [
    ['@vuepress/active-header-links', {
      sidebarLinkSelector: '.table-of-contents a',
      headerAnchorSelector: '.header-anchor'
    }],
    ['container', examples],
    {
      chainMarkdown (config) {
        // inject custom markdown highlight with our snippet runner
        config
          .options
          .highlight(highlight)
          .end()
      },
    }
  ],
  extendPageData ($page) {
    $page.versions = helpers.getVersions();
    $page.latestVersion = helpers.getLatestVersion();
    $page.currentVersion = $page.path.split('/')[1] || $page.latestVersion; //todo will it work ok for the latest api page?
  },
  themeConfig: {
    logo: '/logo.png',
    nextLinks: true,
    prevLinks: true,
    repo: 'handsontable/handsontable',
    docsRepo: 'handsontable/handsontable',
    docsDir: 'docs',
    docsBranch: 'develop',
    editLinks: true,
    editLinkText: 'Help us improve this page',
    lastUpdated: true,
    smoothScroll: false,
    searchPlaceholder: 'Search...',
    nav: [
      { text: 'Demo', link: 'https://handsontable.com/examples' },
      { text: 'Support', items: [
          { text: 'Forum', link: 'https://forum.handsontable.com' },
          { text: 'Report an issue', link: 'https://github.com/handsontable/handsontable/issues/new' },
          { text: 'Contact support', link: 'https://handsontable.com/contact?category=technical_support' },
        ]
      },
    ],
    displayAllHeaders: true, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 0,
    sidebar: helpers.getSidebars()
  }
};
