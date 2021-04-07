const fs = require('fs');
const path = require('path');

const gettingStartedItems = [
  'guides/getting-started/welcome',
  'guides/getting-started/basic-usage',
  'guides/getting-started/binding-to-data',
  'guides/getting-started/setting-options',
  'guides/getting-started/grid-size',
  'guides/getting-started/using-callbacks',
  'guides/getting-started/license-key',
];

const integrateWithReactItems = [
  'guides/integrate-with-react/react-installation',
  'guides/integrate-with-react/react-simple-examples',
  'guides/integrate-with-react/react-hot-column',
  'guides/integrate-with-react/react-setting-up-a-locale',
  'guides/integrate-with-react/react-custom-context-menu-example',
  'guides/integrate-with-react/react-custom-editor-example',
  'guides/integrate-with-react/react-custom-renderer-example',
  'guides/integrate-with-react/react-language-change-example',
  'guides/integrate-with-react/react-redux-example',
  'guides/integrate-with-react/react-hot-reference',
];

const integrateWithAngularItems = [
  'guides/integrate-with-angular/angular-installation',
  'guides/integrate-with-angular/angular-simple-example',
  'guides/integrate-with-angular/angular-custom-id',
  'guides/integrate-with-angular/angular-setting-up-a-locale',
  'guides/integrate-with-angular/angular-custom-context-menu-example',
  'guides/integrate-with-angular/angular-custom-editor-example',
  'guides/integrate-with-angular/angular-custom-renderer-example',
  'guides/integrate-with-angular/angular-language-change-example',
  'guides/integrate-with-angular/angular-hot-reference',
];

const integrateWithVueItems = [
  'guides/integrate-with-vue/vue-installation',
  'guides/integrate-with-vue/vue-simple-example',
  'guides/integrate-with-vue/vue-hot-column',
  'guides/integrate-with-vue/vue-setting-up-a-locale',
  'guides/integrate-with-vue/vue-custom-id-class-style',
  'guides/integrate-with-vue/vue-custom-context-menu-example',
  'guides/integrate-with-vue/vue-custom-editor-example',
  'guides/integrate-with-vue/vue-custom-renderer-example',
  'guides/integrate-with-vue/vue-language-change-example',
  'guides/integrate-with-vue/vue-vuex-example',
  'guides/integrate-with-vue/vue-hot-reference',
];

const columnsItems = [
  'guides/columns/column-header',
  'guides/columns/column-groups',
  'guides/columns/column-hiding',
  'guides/columns/column-moving',
  'guides/columns/column-freezing',
  'guides/columns/column-width',
  'guides/columns/column-summary',
  'guides/columns/column-virtualization',
  'guides/columns/column-menu',
  'guides/columns/column-filter',
];

const rowsItems = [
  'guides/rows/row-header',
  'guides/rows/row-master-detail',
  'guides/rows/row-hiding',
  'guides/rows/row-moving',
  'guides/rows/row-freezing',
  'guides/rows/row-height',
  'guides/rows/row-virtualization',
  'guides/rows/row-sorting',
  'guides/rows/row-trimming',
  'guides/rows/row-prepopulating',
];

const cellsItems = [
  'guides/cells/clipboard',
  'guides/cells/selection',
  'guides/cells/merge-cells',
  'guides/cells/conditional-formatting',
  'guides/cells/data-validation',
  'guides/cells/text-alignment',
  'guides/cells/read-only-state',
  'guides/cells/comments',
  'guides/cells/auto-fill',
  'guides/cells/formatting-cells',
];

const builtInCellTypesItems = [
  'guides/built-in-cell-types/what-is-cell-type',
  'guides/built-in-cell-types/numeric-cell-type',
  'guides/built-in-cell-types/date-cell-type',
  'guides/built-in-cell-types/time-cell-type',
  'guides/built-in-cell-types/checkbox-cell-type',
  'guides/built-in-cell-types/select-cell-type',
  'guides/built-in-cell-types/dropdown-cell-type',
  'guides/built-in-cell-types/autocomplete-cell-type',
  'guides/built-in-cell-types/password-cell-type',
  'guides/built-in-cell-types/handsontable-cell-type',
];

const customCellTypesItems = [
  'guides/custom-cell-types/custom-cell-type',
  'guides/custom-cell-types/custom-editor',
  'guides/custom-cell-types/custom-renderer',
  'guides/custom-cell-types/custom-validator',
];

const formulasItems = [
  'guides/formulas/formula-calculation',
];

const accessoriesAndMenusItems = [
  'guides/accessories-and-menus/context-menu',
  'guides/accessories-and-menus/keyboard-navigation',
  'guides/accessories-and-menus/searching-values',
  'guides/accessories-and-menus/icon-pack',
  'guides/accessories-and-menus/export-to-csv',
];

const internationalizationItems = [
  'guides/internationalization/internationalization-i18n',
  'guides/internationalization/rtl',
  'guides/internationalization/ime-support',
];

const buildingAndTestingItems = [
  'guides/building-and-testing/building',
  'guides/building-and-testing/testing',
  'guides/building-and-testing/packages',
  'guides/building-and-testing/modules',
  'guides/building-and-testing/plugins',
  'guides/building-and-testing/file-structure',
];

const advancedTopicsItems = [
  'guides/advanced-topics/accessibility',
  'guides/advanced-topics/batching-operations',
  'guides/advanced-topics/touch-events',
  'guides/advanced-topics/performance',
  'guides/advanced-topics/key-concepts',
];

const securityItems = [
  'guides/security/security',
];

const technicalSpecificationItems = [
  'guides/technical-specification/about-handsontable',
  'guides/technical-specification/supported-browsers',
  'guides/technical-specification/product-license',
  'guides/technical-specification/documentation-license',
  'guides/technical-specification/third-party-licenses',
];

const upgradeAndMigrationItems = [
  'guides/upgrade-and-migration/release-notes',
  'guides/upgrade-and-migration/versioning-policy',
  'guides/upgrade-and-migration/roadmap',
  'guides/upgrade-and-migration/migrating-from-7.4-to-8.0',
];

const apiHighLevelPages = [
  'core',
  'pluginHooks',
  'metaSchema'
];

const nonPublicPages = [
  'indexMapper',
  'baseEditor',
  'coords',
  'focusableElement',
];

const API = [
  ...apiHighLevelPages,
  {
    title: 'Plugins',
    collapsable: false,
    children: fs.readdirSync(path.join(__dirname, 'api/'))
      .filter(f => ![...nonPublicPages, ...apiHighLevelPages].includes(f.split('.').shift()))
  },
];

module.exports = {
  guide: [
    { title: 'Getting Started', children: gettingStartedItems },
    { title: 'Integrate with React', children: integrateWithReactItems },
    { title: 'Integrate with Angular', children: integrateWithAngularItems },
    { title: 'Integrate with Vue', children: integrateWithVueItems },
    { title: 'Columns', children: columnsItems },
    { title: 'Rows', children: rowsItems },
    { title: 'Cells', children: cellsItems },
    { title: 'Built-in Cell Types', children: builtInCellTypesItems },
    { title: 'Custom Cell Types', children: customCellTypesItems },
    { title: 'Formulas', children: formulasItems },
    { title: 'Accessories and Menus', children: accessoriesAndMenusItems },
    { title: 'Internationalization', children: internationalizationItems },
    { title: 'Building and Testing', children: buildingAndTestingItems },
    { title: 'Advanced Topics', children: advancedTopicsItems },
    { title: 'Security', children: securityItems },
    { title: 'Technical Specification', children: technicalSpecificationItems },
    { title: 'Upgrade and Migration', children: upgradeAndMigrationItems }
  ],
  api: API
};
