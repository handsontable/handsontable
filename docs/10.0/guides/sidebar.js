const gettingStartedItems = [
  'guides/getting-started/introduction',
  'guides/getting-started/hello-world',
  'guides/getting-started/installation',
  'guides/getting-started/binding-to-data',
  'guides/getting-started/saving-data',
  'guides/getting-started/setting-options',
  'guides/getting-started/grid-size',
  'guides/getting-started/events-and-hooks',
  'guides/getting-started/license-key',
];

const integrateWithReactItems = [
  'guides/integrate-with-react/react-installation',
  'guides/integrate-with-react/react-simple-example',
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
  'guides/columns/column-sorting',
  'guides/columns/column-menu',
  'guides/columns/column-filter',
];

const rowsItems = [
  'guides/rows/row-header',
  'guides/rows/row-parent-child',
  'guides/rows/row-hiding',
  'guides/rows/row-moving',
  'guides/rows/row-freezing',
  'guides/rows/row-height',
  'guides/rows/row-virtualization',
  'guides/rows/row-sorting',
  'guides/rows/row-trimming',
  'guides/rows/row-prepopulating',
];

const cellFeaturesItems = [
  'guides/cell-features/clipboard',
  'guides/cell-features/selection',
  'guides/cell-features/merge-cells',
  'guides/cell-features/conditional-formatting',
  'guides/cell-features/text-alignment',
  'guides/cell-features/disabled-cells',
  'guides/cell-features/comments',
  'guides/cell-features/autofill-values',
  'guides/cell-features/formatting-cells',
];

const cellFunctionsItems = [
  'guides/cell-functions/cell-function',
  'guides/cell-functions/cell-renderer',
  'guides/cell-functions/cell-editor',
  'guides/cell-functions/cell-validator',
];

const cellTypesItems = [
  'guides/cell-types/cell-type',
  'guides/cell-types/numeric-cell-type',
  'guides/cell-types/date-cell-type',
  'guides/cell-types/time-cell-type',
  'guides/cell-types/checkbox-cell-type',
  'guides/cell-types/select-cell-type',
  'guides/cell-types/dropdown-cell-type',
  'guides/cell-types/autocomplete-cell-type',
  'guides/cell-types/password-cell-type',
  'guides/cell-types/handsontable-cell-type',
];

const formulasItems = [
  'guides/formulas/formula-calculation',
];

const accessoriesAndMenusItems = [
  'guides/accessories-and-menus/context-menu',
  'guides/accessories-and-menus/undo-redo',
  'guides/accessories-and-menus/keyboard-navigation',
  'guides/accessories-and-menus/searching-values',
  'guides/accessories-and-menus/icon-pack',
  'guides/accessories-and-menus/export-to-csv',
  // TODO 'guides/accessories-and-menus/export-to-excel',
];

const internationalizationItems = [
  'guides/internationalization/internationalization-i18n',
  // TODO 'guides/internationalization/rtl',
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
  // TODO 'guides/advanced-topics/accessibility',
  'guides/advanced-topics/batch-operations',
  // TODO 'guides/advanced-topics/touch-events',
  'guides/advanced-topics/performance',
  // TODO 'guides/advanced-topics/key-concepts',
];

const securityItems = [
  'guides/security/security',
];

const technicalSpecificationItems = [
  // TODO 'guides/technical-specification/about-handsontable',
  'guides/technical-specification/supported-browsers',
  'guides/technical-specification/software-license',
  'guides/technical-specification/third-party-licenses',
  'guides/technical-specification/documentation-license',
];

const upgradeAndMigrationItems = [
  'guides/upgrade-and-migration/release-notes',
  'guides/upgrade-and-migration/versioning-policy',
  // TODO 'guides/upgrade-and-migration/roadmap',
  'guides/upgrade-and-migration/migrating-from-7.4-to-8.0',
  'guides/upgrade-and-migration/migrating-from-8.4-to-9.0',
  'guides/upgrade-and-migration/migrating-from-9.0-to-10.0',
];

module.exports = {
  sidebar: [
    { title: 'Getting Started', children: gettingStartedItems },
    { title: 'Integrate with React', children: integrateWithReactItems },
    { title: 'Integrate with Angular', children: integrateWithAngularItems },
    { title: 'Integrate with Vue 2', children: integrateWithVueItems },
    { title: 'Columns', children: columnsItems },
    { title: 'Rows', children: rowsItems },
    { title: 'Cell Features', children: cellFeaturesItems },
    { title: 'Cell Functions', children: cellFunctionsItems },
    { title: 'Cell Types', children: cellTypesItems },
    { title: 'Formulas', children: formulasItems },
    { title: 'Accessories and Menus', children: accessoriesAndMenusItems },
    { title: 'Internationalization', children: internationalizationItems },
    { title: 'Building and Testing', children: buildingAndTestingItems },
    { title: 'Advanced Topics', children: advancedTopicsItems },
    { title: 'Security', children: securityItems },
    { title: 'Technical Specification', children: technicalSpecificationItems },
    { title: 'Upgrade and Migration', children: upgradeAndMigrationItems }
  ],
};
