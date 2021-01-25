module.exports = {
  docs: {
    Temporary: [
      'temp/features',
      'temp/introduction',
    ],
    Handsontable: [
      { type: 'category', label: 'Getting started', items: ['tutorial-introduction', 'tutorial-features', 'tutorial-compatibility', 'tutorial-licensing', 'tutorial-license-key'] },
      { type: 'category', label: 'Basic usage', items: ['tutorial-quick-start', 'tutorial-data-binding', 'tutorial-data-sources', 'tutorial-load-and-save', 'tutorial-setting-options', 'tutorial-grid-sizing', 'tutorial-using-callbacks', 'tutorial-keyboard-navigation', 'tutorial-internationalization'] },
      { type: 'category', label: 'Developer guide', items: ['tutorial-custom-build', 'tutorial-custom-plugin', 'tutorial-cell-types', 'tutorial-cell-editor', 'tutorial-cell-function', 'tutorial-testing', 'tutorial-performance-tips', 'tutorial-release-notes', 'tutorial-migration-guide'] },
    ],
    Wrappers: [
      { type: 'category', label: 'Wrapper for React', items: ['frameworks-wrapper-for-react-installation', 'frameworks-wrapper-for-react-simple-examples', 'frameworks-wrapper-for-react-hot-column', 'frameworks-wrapper-for-react-custom-context-menu-example', 'frameworks-wrapper-for-react-custom-editor-example', 'frameworks-wrapper-for-react-custom-renderer-example', 'frameworks-wrapper-for-react-language-change-example', 'frameworks-wrapper-for-react-redux-example', 'frameworks-wrapper-for-react-hot-reference'] },
      { type: 'category', label: 'Wrapper for Angular', items: ['frameworks-wrapper-for-angular-installation', 'frameworks-wrapper-for-angular-simple-example', 'frameworks-wrapper-for-angular-custom-id', 'frameworks-wrapper-for-angular-custom-context-menu-example', 'frameworks-wrapper-for-angular-custom-editor-example', 'frameworks-wrapper-for-angular-custom-renderer-example', 'frameworks-wrapper-for-angular-language-change-example', 'frameworks-wrapper-for-angular-hot-reference'] },
      { type: 'category', label: 'Wrapper for Vue', items: ['frameworks-wrapper-for-vue-installation', 'frameworks-wrapper-for-vue-simple-example', 'frameworks-wrapper-for-vue-hot-column', 'frameworks-wrapper-for-vue-custom-id-class-style', 'frameworks-wrapper-for-vue-custom-context-menu-example', 'frameworks-wrapper-for-vue-custom-editor-example', 'frameworks-wrapper-for-vue-custom-renderer-example', 'frameworks-wrapper-for-vue-language-change-example', 'frameworks-wrapper-for-vue-vuex-example', 'frameworks-wrapper-for-vue-hot-reference'] },
    ],
    Demos: [
      { type: 'category', label: 'Rows and columns', items: ['demo-scrolling', 'demo-fixing', 'demo-resizing', 'demo-moving', 'demo-header-tooltips', 'demo-pre-populating', 'demo-stretching', 'demo-freezing', 'demo-fixing-bottom', 'demo-hiding-rows', 'demo-hiding-columns', 'demo-trimming-rows', 'demo-bind-rows-headers', 'demo-collapsing-columns', 'demo-nested-headers', 'demo-nested-rows', 'demo-dropdown-menu'] },
      { type: 'category', label: 'Data operations', items: ['demo-sorting', 'demo-multicolumn-sorting', 'demo-searching', 'demo-filtering', 'demo-summary-calculations'] },
      { type: 'category', label: 'Cell features', items: ['demo-data-validation', 'demo-auto-fill', 'demo-merged-cells', 'demo-alignment', 'demo-read-only', 'demo-disabled-editing'] },
      { type: 'category', label: 'Cell types', items: ['demo-custom-renderers', 'demo-numeric', 'demo-date', 'demo-time', 'demo-checkbox', 'demo-select', 'demo-dropdown', 'demo-autocomplete', 'demo-password', 'demo-handsontable'] },
      { type: 'category', label: 'Utilities', items: ['demo-context-menu', 'demo-custom-buttons', 'demo-spreadsheet-icons', 'demo-comments_', 'demo-copy-paste', 'demo-export-file'] },
      { type: 'category', label: 'Appearance', items: ['demo-conditional-formatting', 'demo-customizing-borders', 'demo-selecting-ranges', 'demo-highlighting-selection', 'demo-mobiles-and-tablets'] },
      { type: 'category', label: 'Formulas', items: ['demo-formula-support'] },
    ],
  },
  apiReference: require('./src/utils/jsdoc-convert/sidebar')
};
