const fs = require('fs');
const path = require('path');

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
const apiHighLevelPages = [
  'introduction',
  'core',
  'pluginHooks',
  'metaSchema'
]
const API = [
  ...apiHighLevelPages,
  {
    title: 'Plugins',
    collapsable: false,
    children: fs.readdirSync(path.join(__dirname, 'api/'))
        .filter(f=>!apiHighLevelPages.includes(f))
  },
];

module.exports = {
  guide: [
    { title: 'Getting started', children: gettingStartedItems },
    { title: 'Basic usage', children: basicUsageItems },
    { title: 'Developer guide', children: developerGuideItems },
    { title: 'Wrappers', children:[
      { title: 'Wrapper for React', children: wrapperForReactItems },
      { title: 'Wrapper for Angular', children: wrapperForAngularItems },
      { title: 'Wrapper for Vue', children: wrapperForVueItems },
    ]},
    { title: 'Demos', children:[
      { title: 'Rows and columns', children: rowsAndColumnsItems },
      { title: 'Data operations', children: dataOperationsItems },
      { title: 'Cell features', children: cellFeaturesItems },
      { title: 'Cell types', children: cellTypesItems },
      { title: 'Utilities', children: utilitiesItems },
      { title: 'Appearance', children: appearanceItems },
      { title: 'Formulas', children: formulasItems },
    ]}
  ],
  api: API,
};
