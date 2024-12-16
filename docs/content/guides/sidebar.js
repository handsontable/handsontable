const gettingStartedItems = [
  { path: 'guides/getting-started/introduction/introduction' },
  { path: 'guides/getting-started/demo/demo' },
  { path: 'guides/getting-started/installation/installation' },
  { path: 'guides/getting-started/binding-to-data/binding-to-data' },
  { path: 'guides/getting-started/saving-data/saving-data' },
  { path: 'guides/getting-started/configuration-options/configuration-options' },
  { path: 'guides/getting-started/grid-size/grid-size' },
  { path: 'guides/getting-started/react-methods/react-methods', onlyFor: ['react'] },
  { path: 'guides/getting-started/events-and-hooks/events-and-hooks' },
  { path: 'guides/getting-started/license-key/license-key' },
  { path: 'guides/getting-started/react-redux/react-redux', onlyFor: ['react'] },
];

const stylingItems = [
  { path: 'guides/styling/themes/themes' }
];

const integrateWithAngularItems = [
  { path: 'guides/integrate-with-angular/angular-installation/angular-installation' },
  { path: 'guides/integrate-with-angular/angular-simple-example/angular-simple-example' },
  { path: 'guides/integrate-with-angular/angular-modules/angular-modules' },
  { path: 'guides/integrate-with-angular/angular-custom-id/angular-custom-id' },
  { path: 'guides/integrate-with-angular/angular-setting-up-a-translation/angular-setting-up-a-translation' },
  { path: 'guides/integrate-with-angular/angular-custom-context-menu-example/angular-custom-context-menu-example' },
  { path: 'guides/integrate-with-angular/angular-custom-editor-example/angular-custom-editor-example' },
  { path: 'guides/integrate-with-angular/angular-custom-renderer-example/angular-custom-renderer-example' },
  { path: 'guides/integrate-with-angular/angular-language-change-example/angular-language-change-example' },
  { path: 'guides/integrate-with-angular/angular-hot-reference/angular-hot-reference' },
];

const integrateWithVueItems = [
  { path: 'guides/integrate-with-vue/vue-installation/vue-installation' },
  { path: 'guides/integrate-with-vue/vue-simple-example/vue-simple-example' },
  { path: 'guides/integrate-with-vue/vue-modules/vue-modules' },
  { path: 'guides/integrate-with-vue/vue-hot-column/vue-hot-column' },
  { path: 'guides/integrate-with-vue/vue-setting-up-a-language/vue-setting-up-a-language' },
  { path: 'guides/integrate-with-vue/vue-custom-id-class-style/vue-custom-id-class-style' },
  { path: 'guides/integrate-with-vue/vue-custom-context-menu-example/vue-custom-context-menu-example' },
  { path: 'guides/integrate-with-vue/vue-custom-editor-example/vue-custom-editor-example' },
  { path: 'guides/integrate-with-vue/vue-custom-renderer-example/vue-custom-renderer-example' },
  { path: 'guides/integrate-with-vue/vue-language-change-example/vue-language-change-example' },
  { path: 'guides/integrate-with-vue/vue-vuex-example/vue-vuex-example' },
  { path: 'guides/integrate-with-vue/vue-hot-reference/vue-hot-reference' },
];

const integrateWithVue3Items = [
  { path: 'guides/integrate-with-vue3/vue3-installation/vue3-installation' },
  { path: 'guides/integrate-with-vue3/vue3-simple-example/vue3-simple-example' },
  { path: 'guides/integrate-with-vue3/vue3-modules/vue3-modules' },
  { path: 'guides/integrate-with-vue3/vue3-hot-column/vue3-hot-column' },
  { path: 'guides/integrate-with-vue3/vue3-setting-up-a-language/vue3-setting-up-a-language' },
  { path: 'guides/integrate-with-vue3/vue3-custom-id-class-style/vue3-custom-id-class-style' },
  { path: 'guides/integrate-with-vue3/vue3-custom-context-menu-example/vue3-custom-context-menu-example' },
  { path: 'guides/integrate-with-vue3/vue3-custom-editor-example/vue3-custom-editor-example' },
  { path: 'guides/integrate-with-vue3/vue3-custom-renderer-example/vue3-custom-renderer-example' },
  { path: 'guides/integrate-with-vue3/vue3-language-change-example/vue3-language-change-example' },
  { path: 'guides/integrate-with-vue3/vue3-vuex-example/vue3-vuex-example' },
  { path: 'guides/integrate-with-vue3/vue3-hot-reference/vue3-hot-reference' },
];

const columnsItems = [
  { path: 'guides/columns/react-hot-column/react-hot-column', onlyFor: ['react'] },
  { path: 'guides/columns/column-header/column-header' },
  { path: 'guides/columns/column-groups/column-groups' },
  { path: 'guides/columns/column-hiding/column-hiding' },
  { path: 'guides/columns/column-moving/column-moving' },
  { path: 'guides/columns/column-freezing/column-freezing' },
  { path: 'guides/columns/column-width/column-width' },
  { path: 'guides/columns/column-summary/column-summary' },
  { path: 'guides/columns/column-virtualization/column-virtualization' },
  { path: 'guides/columns/column-menu/column-menu' },
  { path: 'guides/columns/column-filter/column-filter' },
];

const rowsItems = [
  { path: 'guides/rows/row-header/row-header' },
  { path: 'guides/rows/row-parent-child/row-parent-child' },
  { path: 'guides/rows/row-hiding/row-hiding' },
  { path: 'guides/rows/row-moving/row-moving' },
  { path: 'guides/rows/row-freezing/row-freezing' },
  { path: 'guides/rows/row-height/row-height' },
  { path: 'guides/rows/row-virtualization/row-virtualization' },
  { path: 'guides/rows/rows-sorting/rows-sorting' },
  { path: 'guides/rows/row-trimming/row-trimming' },
  { path: 'guides/rows/row-prepopulating/row-prepopulating' },
];

const cellFeaturesItems = [
  { path: 'guides/cell-features/clipboard/clipboard' },
  { path: 'guides/cell-features/selection/selection' },
  { path: 'guides/cell-features/merge-cells/merge-cells' },
  { path: 'guides/cell-features/conditional-formatting/conditional-formatting' },
  { path: 'guides/cell-features/text-alignment/text-alignment' },
  { path: 'guides/cell-features/disabled-cells/disabled-cells' },
  { path: 'guides/cell-features/comments/comments' },
  { path: 'guides/cell-features/autofill-values/autofill-values' },
  { path: 'guides/cell-features/formatting-cells/formatting-cells' },
];

const cellFunctionsItems = [
  { path: 'guides/cell-functions/cell-function/cell-function' },
  { path: 'guides/cell-functions/cell-renderer/cell-renderer' },
  { path: 'guides/cell-functions/cell-editor/cell-editor' },
  { path: 'guides/cell-functions/cell-validator/cell-validator' },
];

const cellTypesItems = [
  { path: 'guides/cell-types/cell-type/cell-type' },
  { path: 'guides/cell-types/numeric-cell-type/numeric-cell-type' },
  { path: 'guides/cell-types/date-cell-type/date-cell-type' },
  { path: 'guides/cell-types/time-cell-type/time-cell-type' },
  { path: 'guides/cell-types/checkbox-cell-type/checkbox-cell-type' },
  { path: 'guides/cell-types/select-cell-type/select-cell-type' },
  { path: 'guides/cell-types/dropdown-cell-type/dropdown-cell-type' },
  { path: 'guides/cell-types/autocomplete-cell-type/autocomplete-cell-type' },
  { path: 'guides/cell-types/password-cell-type/password-cell-type' },
  { path: 'guides/cell-types/handsontable-cell-type/handsontable-cell-type' },
];

const formulasItems = [
  { path: 'guides/formulas/formula-calculation/formula-calculation' },
];

const navigationItems = [
  { path: 'guides/navigation/keyboard-shortcuts/keyboard-shortcuts' },
  { path: 'guides/navigation/custom-shortcuts/custom-shortcuts' },
  { path: 'guides/navigation/searching-values/searching-values' },
];

const accessibilityItems = [
  { path: 'guides/accessibility/accessibility/accessibility' },
];

const accessoriesAndMenusItems = [
  { path: 'guides/accessories-and-menus/context-menu/context-menu' },
  { path: 'guides/accessories-and-menus/undo-redo/undo-redo' },
  { path: 'guides/accessories-and-menus/icon-pack/icon-pack' },
  { path: 'guides/accessories-and-menus/export-to-csv/export-to-csv' },
  // TODO { path: 'guides/accessories-and-menus/export-to-excel/export-to-excel' },
];

const internationalizationItems = [
  { path: 'guides/internationalization/language/language' },
  { path: 'guides/internationalization/locale/locale' },
  { path: 'guides/internationalization/layout-direction/layout-direction' },
  { path: 'guides/internationalization/ime-support/ime-support' },
];

const buildingAndToolingItems = [
  { path: 'guides/tools-and-building/packages/packages', onlyFor: ['javascript'] },
  { path: 'guides/tools-and-building/modules/modules' },
  { path: 'guides/tools-and-building/custom-plugins/custom-plugins' },
  { path: 'guides/tools-and-building/custom-builds/custom-builds' },
  { path: 'guides/tools-and-building/testing/testing' },
];

const optimizationItems = [
  { path: 'guides/optimization/batch-operations/batch-operations' },
  // TODO { path: 'guides/optimization/touch-events/touch-events' },
  { path: 'guides/optimization/performance/performance' },
  // TODO { path: 'guides/optimization/key-concepts/key-concepts' },
  { path: 'guides/optimization/bundle-size/bundle-size' },
];

const securityItems = [
  { path: 'guides/security/security/security' },
];

const technicalSpecificationItems = [
  // TODO { path: 'guides/technical-specification/about-handsontable/about-handsontable' },
  { path: 'guides/technical-specification/supported-browsers/supported-browsers' },
  { path: 'guides/technical-specification/software-license/software-license' },
  { path: 'guides/technical-specification/third-party-licenses/third-party-licenses' },
  { path: 'guides/technical-specification/documentation-license/documentation-license' },
];

const upgradeAndMigrationItems = [
  { path: 'guides/upgrade-and-migration/changelog/changelog' },
  { path: 'guides/upgrade-and-migration/versioning-policy/versioning-policy' },
  { path: 'guides/upgrade-and-migration/migrating-from-14.6-to-15.0/migrating-from-14.6-to-15.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-13.1-to-14.0/migrating-from-13.1-to-14.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-12.4-to-13.0/migrating-from-12.4-to-13.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-11.1-to-12.0/migrating-from-11.1-to-12.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-10.0-to-11.0/migrating-from-10.0-to-11.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-9.0-to-10.0/migrating-from-9.0-to-10.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-8.4-to-9.0/migrating-from-8.4-to-9.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-7.4-to-8.0/migrating-from-7.4-to-8.0' },
];

module.exports = {
  sidebar: [
    { title: 'Getting started', children: gettingStartedItems },
    { title: 'Styling', children: stylingItems },
    { title: 'Columns', children: columnsItems },
    { title: 'Rows', children: rowsItems },
    { title: 'Cell features', children: cellFeaturesItems },
    { title: 'Cell functions', children: cellFunctionsItems },
    { title: 'Cell types', children: cellTypesItems },
    { title: 'Formulas', children: formulasItems },
    { title: 'Navigation', children: navigationItems },
    { title: 'Accessibility', children: accessibilityItems },
    { title: 'Accessories and menus', children: accessoriesAndMenusItems },
    { title: 'Internationalization', children: internationalizationItems },
    { title: 'Integrate with Angular', children: integrateWithAngularItems },
    { title: 'Integrate with Vue 2', children: integrateWithVueItems },
    { title: 'Integrate with Vue 3', children: integrateWithVue3Items },
    { title: 'Tools and building', children: buildingAndToolingItems },
    { title: 'Optimization', children: optimizationItems },
    { title: 'Security', children: securityItems },
    { title: 'Technical specification', children: technicalSpecificationItems },
    { title: 'Upgrade and migration', children: upgradeAndMigrationItems }
  ],
};
