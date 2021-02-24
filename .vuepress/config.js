const highlight = require('./highlight');
const fs = require('fs');
const path = require('path');
const examples = require('./examples');
const searchPattern = new RegExp('^/api', 'i');

const gettingStartedItems = [
  'introduction',
  'features',
  'compatibility',
  'licensing',
  'license-key',
];
const basicUsageItems = [
  'quick-start',
  'data-binding',
  'data-sources',
  'load-and-save',
  'setting-options',
  'grid-sizing',
  'using-callbacks',
  'keyboard-navigation',
  'internationalization',
];
const developerGuideItems = [
  'modules',
  'custom-build',
  'custom-plugin',
  'cell-types',
  'cell-editor',
  'cell-function',
  'suspend-rendering',
  'testing',
  'performance-tips',
  'release-notes',
  'migration-guide',
  'contributing',
];
const wrapperForReactItems = [
  'react-installation',
  'react-simple-examples',
  'react-hot-column',
  'react-setting-up-a-locale',
  'react-custom-context-menu-example',
  'react-custom-editor-example',
  'react-custom-renderer-example',
  'react-language-change-example',
  'react-redux-example',
  'react-hot-reference',
];
const wrapperForAngularItems = [
  'angular-installation',
  'angular-simple-example',
  'angular-custom-id',
  'angular-setting-up-a-locale',
  'angular-custom-context-menu-example',
  'angular-custom-editor-example',
  'angular-custom-renderer-example',
  'angular-language-change-example',
  'angular-hot-reference',
];
const wrapperForVueItems = [
  'vue-installation',
  'vue-simple-example',
  'vue-hot-column',
  'vue-setting-up-a-locale',
  'vue-custom-id-class-style',
  'vue-custom-context-menu-example',
  'vue-custom-editor-example',
  'vue-custom-renderer-example',
  'vue-language-change-example',
  'vue-vuex-example',
  'vue-hot-reference',
];
const rowsAndColumnsItems = [
  'scrolling',
  'fixing',
  'resizing',
  'moving',
  'header-tooltips',
  'pre-populating',
  'stretching',
  'freezing',
  'fixing-bottom',
  'hiding-rows',
  'hiding-columns',
  'trimming-rows',
  'bind-rows-headers',
  'collapsing-columns',
  'nested-headers',
  'nested-rows',
  'dropdown-menu',
];
const dataOperationsItems = [
  'sorting',
  'multicolumn-sorting',
  'searching',
  'filtering',
  'summary-calculations',
];
const cellFeaturesItems = [
  'validation',
  'auto-fill',
  'merged-cells',
  'alignment',
  'read-only',
  'disabled-editing',
];
const cellTypesItems = [
  'custom-renderers',
  'numeric',
  'date',
  'time',
  'checkbox',
  'select',
  'dropdown',
  'autocomplete',
  'password',
  'handsontable',
];
const utilitiesItems = [
  'context-menu',
  'custom-buttons',
  'spreadsheet-icons',
  'comments',
  'copy-paste',
  'export-file',
];
const appearanceItems = [
  'conditional-formatting',
  'customizing-borders',
  'selecting-ranges',
  'highlighting-selection',
  'mobiles-and-tablets',
];
const formulasItems = [
  'formula-support',
];

module.exports = {
  description: 'Handsontable',
  base: '/docs/',
  head: [
    ['script', { src: 'https://cdn.jsdelivr.net/npm/handsontable@8.3.1/dist/handsontable.full.min.js' }],
    ['link', { rel: 'stylesheet', href: 'https://cdn.jsdelivr.net/npm/handsontable@8.3.1/dist/handsontable.full.min.css' }],
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
      includeLevel: [2],
      containerHeaderHtml: '<div class="toc-container-header">On this page</div>'
    },
  },
  plugins: [
    ['@vuepress/active-header-links', {
      sidebarLinkSelector: '.table-of-contents > a',
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
    nav: [ //todo link to latest, not next
      { text: 'Guide', link: '/next/' },
      { text: 'API Reference', link: '/next/api/' },
    ],
    displayAllHeaders: true, // collapse other pages
    activeHeaderLinks: true,
    sidebarDepth: 0,
    sidebar: {
      '/latest/': [``],
      '/next/api/': [
        "core",
        "pluginHooks",
        "metaSchema",
        {
          title: "Plugins",
          collapsable: false,
          children: fs.readdirSync(path.join(__dirname, '../next/api/plugins'))
            .map(f => `plugins/${f}`)
        },
      ],
      '/next/': [
        {
          title: 'Getting started',  children: gettingStartedItems
        },
        {title: 'Basic usage',  children: basicUsageItems },
        {title: 'Developer guide',  children: developerGuideItems },
        {title: 'Wrapper for React',  children: wrapperForReactItems },
        {title: 'Wrapper for Angular',  children: wrapperForAngularItems },
        {title: 'Wrapper for Vue',  children: wrapperForVueItems },
        {title: 'Rows and columns',  children: rowsAndColumnsItems },
        {title: 'Data operations',  children: dataOperationsItems },
        {title: 'Cell features',  children: cellFeaturesItems },
        {title: 'Cell types',  children: cellTypesItems },
        {title: 'Utilities',  children: utilitiesItems },
        {title: 'Appearance',  children: appearanceItems },
        {title: 'Formulas',  children: formulasItems },
      ]
    }
  }
};
