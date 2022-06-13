const gettingStartedItems = [
  { path: 'guides/getting-started/introduction' },
  { path: 'guides/getting-started/demo' },
  { path: 'guides/getting-started/installation' },
  { path: 'guides/getting-started/react-simple-example', onlyFor: ['react'] },
  { path: 'guides/getting-started/binding-to-data' },
  { path: 'guides/getting-started/saving-data' },
  { path: 'guides/getting-started/setting-options' },
  { path: 'guides/getting-started/grid-size' },
  { path: 'guides/getting-started/events-and-hooks' },
  { path: 'guides/getting-started/license-key' },
];

const integrateWithAngularItems = [
  { path: 'guides/integrate-with-angular/angular-installation' },
  { path: 'guides/integrate-with-angular/angular-simple-example' },
  { path: 'guides/integrate-with-angular/angular-modules' },
  { path: 'guides/integrate-with-angular/angular-custom-id' },
  { path: 'guides/integrate-with-angular/angular-setting-up-a-language' },
  { path: 'guides/integrate-with-angular/angular-custom-context-menu-example' },
  { path: 'guides/integrate-with-angular/angular-custom-editor-example' },
  { path: 'guides/integrate-with-angular/angular-custom-renderer-example' },
  { path: 'guides/integrate-with-angular/angular-language-change-example' },
  { path: 'guides/integrate-with-angular/angular-hot-reference' },
];

const integrateWithVueItems = [
  { path: 'guides/integrate-with-vue/vue-installation' },
  { path: 'guides/integrate-with-vue/vue-simple-example' },
  { path: 'guides/integrate-with-vue/vue-modules' },
  { path: 'guides/integrate-with-vue/vue-hot-column' },
  { path: 'guides/integrate-with-vue/vue-setting-up-a-language' },
  { path: 'guides/integrate-with-vue/vue-custom-id-class-style' },
  { path: 'guides/integrate-with-vue/vue-custom-context-menu-example' },
  { path: 'guides/integrate-with-vue/vue-custom-editor-example' },
  { path: 'guides/integrate-with-vue/vue-custom-renderer-example' },
  { path: 'guides/integrate-with-vue/vue-language-change-example' },
  { path: 'guides/integrate-with-vue/vue-vuex-example' },
  { path: 'guides/integrate-with-vue/vue-hot-reference' },
];

const integrateWithVue3Items = [
  { path: 'guides/integrate-with-vue3/vue3-installation' },
  { path: 'guides/integrate-with-vue3/vue3-simple-example' },
  { path: 'guides/integrate-with-vue3/vue3-modules' },
  { path: 'guides/integrate-with-vue3/vue3-hot-column' },
  { path: 'guides/integrate-with-vue3/vue3-setting-up-a-language' },
  { path: 'guides/integrate-with-vue3/vue3-custom-id-class-style' },
  { path: 'guides/integrate-with-vue3/vue3-custom-context-menu-example' },
  { path: 'guides/integrate-with-vue3/vue3-custom-editor-example' },
  { path: 'guides/integrate-with-vue3/vue3-custom-renderer-example' },
  { path: 'guides/integrate-with-vue3/vue3-language-change-example' },
  { path: 'guides/integrate-with-vue3/vue3-vuex-example' },
  { path: 'guides/integrate-with-vue3/vue3-hot-reference' },
];

const columnsItems = [
  { path: 'guides/columns/column-header' },
  { path: 'guides/columns/column-groups' },
  { path: 'guides/columns/column-hiding' },
  { path: 'guides/columns/column-moving' },
  { path: 'guides/columns/column-freezing' },
  { path: 'guides/columns/column-width' },
  { path: 'guides/columns/column-summary' },
  { path: 'guides/columns/column-virtualization' },
  { path: 'guides/columns/column-sorting' },
  { path: 'guides/columns/column-menu' },
  { path: 'guides/columns/column-filter' },
];

const rowsItems = [
  { path: 'guides/rows/row-header' },
  { path: 'guides/rows/row-parent-child' },
  { path: 'guides/rows/row-hiding' },
  { path: 'guides/rows/row-moving' },
  { path: 'guides/rows/row-freezing' },
  { path: 'guides/rows/row-height' },
  { path: 'guides/rows/row-virtualization' },
  { path: 'guides/rows/row-sorting' },
  { path: 'guides/rows/row-trimming' },
  { path: 'guides/rows/row-prepopulating' },
];

const cellFeaturesItems = [
  { path: 'guides/cell-features/clipboard' },
  { path: 'guides/cell-features/selection' },
  { path: 'guides/cell-features/merge-cells' },
  { path: 'guides/cell-features/conditional-formatting' },
  { path: 'guides/cell-features/text-alignment' },
  { path: 'guides/cell-features/disabled-cells' },
  { path: 'guides/cell-features/comments' },
  { path: 'guides/cell-features/autofill-values' },
  { path: 'guides/cell-features/formatting-cells' },
];

const cellFunctionsItems = [
  { path: 'guides/cell-functions/cell-function' },
  { path: 'guides/cell-functions/cell-renderer' },
  { path: 'guides/cell-functions/cell-editor' },
  { path: 'guides/cell-functions/cell-validator' },
];

const cellTypesItems = [
  { path: 'guides/cell-types/cell-type' },
  { path: 'guides/cell-types/numeric-cell-type' },
  { path: 'guides/cell-types/date-cell-type' },
  { path: 'guides/cell-types/time-cell-type' },
  { path: 'guides/cell-types/checkbox-cell-type' },
  { path: 'guides/cell-types/select-cell-type' },
  { path: 'guides/cell-types/dropdown-cell-type' },
  { path: 'guides/cell-types/autocomplete-cell-type' },
  { path: 'guides/cell-types/password-cell-type' },
  { path: 'guides/cell-types/handsontable-cell-type' },
];

const formulasItems = [
  { path: 'guides/formulas/formula-calculation' },
];

const accessoriesAndMenusItems = [
  { path: 'guides/accessories-and-menus/context-menu' },
  { path: 'guides/accessories-and-menus/undo-redo' },
  { path: 'guides/accessories-and-menus/keyboard-shortcuts' },
  { path: 'guides/accessories-and-menus/searching-values' },
  { path: 'guides/accessories-and-menus/icon-pack' },
  { path: 'guides/accessories-and-menus/export-to-csv' },
  // TODO { path: 'guides/accessories-and-menus/export-to-excel' },
];

const internationalizationItems = [
  { path: 'guides/internationalization/language' },
  { path: 'guides/internationalization/locale' },
  { path: 'guides/internationalization/layout-direction' },
  { path: 'guides/internationalization/ime-support' },
];

const buildingAndTestingItems = [
  { path: 'guides/building-and-testing/building' },
  { path: 'guides/building-and-testing/testing' },
  { path: 'guides/building-and-testing/packages' },
  { path: 'guides/building-and-testing/modules' },
  { path: 'guides/building-and-testing/plugins' },
  { path: 'guides/building-and-testing/file-structure' },
];

const advancedTopicsItems = [
  { path: 'guides/advanced-topics/batch-operations' },
  // TODO { path: 'guides/advanced-topics/touch-events' },
  { path: 'guides/advanced-topics/performance' },
  // TODO { path: 'guides/advanced-topics/key-concepts' },
];

const securityItems = [
  { path: 'guides/security/security' },
];

const technicalSpecificationItems = [
  // TODO { path: 'guides/technical-specification/about-handsontable' },
  { path: 'guides/technical-specification/supported-browsers' },
  { path: 'guides/technical-specification/software-license' },
  { path: 'guides/technical-specification/third-party-licenses' },
  { path: 'guides/technical-specification/documentation-license' },
];

const upgradeAndMigrationItems = [
  { path: 'guides/upgrade-and-migration/release-notes' },
  { path: 'guides/upgrade-and-migration/versioning-policy' },
  // TODO { path: 'guides/upgrade-and-migration/roadmap' },
  { path: 'guides/upgrade-and-migration/migrating-from-7.4-to-8.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-8.4-to-9.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-9.0-to-10.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-10.0-to-11.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-11.1-to-12.0' },
];

const sidebar = [
  { title: 'Getting Started', children: gettingStartedItems },
  { title: 'Integrate with Angular', children: integrateWithAngularItems, onlyFor: ['javascript'] },
  { title: 'Integrate with Vue 2', children: integrateWithVueItems, onlyFor: ['javascript'] },
  { title: 'Integrate with Vue 3', children: integrateWithVue3Items, onlyFor: ['javascript'], },
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
];

module.exports = {
  sidebar,
};
