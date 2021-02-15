const gettingStartedItems = [
  'tutorial-introduction',
  'tutorial-features',
  'tutorial-compatibility',
  'tutorial-licensing',
  'tutorial-license-key',
];
const basicUsageItems = [
  'tutorial-quick-start',
  'tutorial-data-binding',
  'tutorial-data-sources',
  'tutorial-load-and-save',
  'tutorial-setting-options',
  'tutorial-grid-sizing',
  'tutorial-using-callbacks',
  'tutorial-keyboard-navigation',
  'tutorial-internationalization',
];
const developerGuideItems = [
  'tutorial-custom-build',
  'tutorial-custom-plugin',
  'tutorial-cell-types',
  'tutorial-cell-editor',
  'tutorial-cell-function',
  'tutorial-testing',
  'tutorial-performance-tips',
  'tutorial-release-notes',
  'tutorial-migration-guide',
];
const wrapperForReactItems = [
  'frameworks-wrapper-for-react-installation',
  'frameworks-wrapper-for-react-simple-examples',
  'frameworks-wrapper-for-react-hot-column',
  'frameworks-wrapper-for-react-custom-context-menu-example',
  'frameworks-wrapper-for-react-custom-editor-example',
  'frameworks-wrapper-for-react-custom-renderer-example',
  'frameworks-wrapper-for-react-language-change-example',
  'frameworks-wrapper-for-react-redux-example',
  'frameworks-wrapper-for-react-hot-reference',
];
const wrapperForAngularItems = [
  'frameworks-wrapper-for-angular-installation',
  'frameworks-wrapper-for-angular-simple-example',
  'frameworks-wrapper-for-angular-custom-id',
  'frameworks-wrapper-for-angular-custom-context-menu-example',
  'frameworks-wrapper-for-angular-custom-editor-example',
  'frameworks-wrapper-for-angular-custom-renderer-example',
  'frameworks-wrapper-for-angular-language-change-example',
  'frameworks-wrapper-for-angular-hot-reference',
];
const wrapperForVueItems = [
  'frameworks-wrapper-for-vue-installation',
  'frameworks-wrapper-for-vue-simple-example',
  'frameworks-wrapper-for-vue-hot-column',
  'frameworks-wrapper-for-vue-custom-id-class-style',
  'frameworks-wrapper-for-vue-custom-context-menu-example',
  'frameworks-wrapper-for-vue-custom-editor-example',
  'frameworks-wrapper-for-vue-custom-renderer-example',
  'frameworks-wrapper-for-vue-language-change-example',
  'frameworks-wrapper-for-vue-vuex-example',
  'frameworks-wrapper-for-vue-hot-reference',
];
const rowsAndColumnsItems = [
  'demo-scrolling',
  'demo-fixing',
  'demo-resizing',
  'demo-moving',
  'demo-header-tooltips',
  'demo-pre-populating',
  'demo-stretching',
  'demo-freezing',
  'demo-fixing-bottom',
  'demo-hiding-rows',
  'demo-hiding-columns',
  'demo-trimming-rows',
  'demo-bind-rows-headers',
  'demo-collapsing-columns',
  'demo-nested-headers',
  'demo-nested-rows',
  'demo-dropdown-menu',
];
const dataOperationsItems = [
  'demo-sorting',
  'demo-multicolumn-sorting',
  'demo-searching',
  'demo-filtering',
  'demo-summary-calculations',
];
const cellFeaturesItems = [
  'demo-data-validation',
  'demo-auto-fill',
  'demo-merged-cells',
  'demo-alignment',
  'demo-read-only',
  'demo-disabled-editing',
];
const cellTypesItems = [
  'demo-custom-renderers',
  'demo-numeric',
  'demo-date',
  'demo-time',
  'demo-checkbox',
  'demo-select',
  'demo-dropdown',
  'demo-autocomplete',
  'demo-password',
  'demo-handsontable',
];
const utilitiesItems = [
  'demo-context-menu',
  'demo-custom-buttons',
  'demo-spreadsheet-icons',
  'demo-comments_',
  'demo-copy-paste',
  'demo-export-file',
];
const appearanceItems = [
  'demo-conditional-formatting',
  'demo-customizing-borders',
  'demo-selecting-ranges',
  'demo-highlighting-selection',
  'demo-mobiles-and-tablets',
];
const formulasItems = [
  'demo-formula-support',
];

module.exports = {
  docs: [
    {
      label: 'Getting started', type: 'category', collapsed: false, items: gettingStartedItems,
    },
    { label: 'Basic usage', type: 'category', items: basicUsageItems },
    { label: 'Developer guide', type: 'category', items: developerGuideItems },
    { label: 'Wrapper for React', type: 'category', items: wrapperForReactItems },
    { label: 'Wrapper for Angular', type: 'category', items: wrapperForAngularItems },
    { label: 'Wrapper for Vue', type: 'category', items: wrapperForVueItems },
    { label: 'Rows and columns', type: 'category', items: rowsAndColumnsItems },
    { label: 'Data operations', type: 'category', items: dataOperationsItems },
    { label: 'Cell features', type: 'category', items: cellFeaturesItems },
    { label: 'Cell types', type: 'category', items: cellTypesItems },
    { label: 'Utilities', type: 'category', items: utilitiesItems },
    { label: 'Appearance', type: 'category', items: appearanceItems },
    { label: 'Formulas', type: 'category', items: formulasItems },
  ],
  // eslint-disable-next-line global-require
  apiReference: require('./src/jsdoc-convert/sidebar'),
};
