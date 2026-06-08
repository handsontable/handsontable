const gettingStartedItems = [
  { path: 'guides/getting-started/introduction/introduction' },
  { path: 'guides/getting-started/demo/demo' },
  { path: 'guides/getting-started/installation/installation' },
  { path: 'guides/getting-started/configuration-options/configuration-options' },
  { path: 'guides/getting-started/grid-size/grid-size' },
  { path: 'guides/getting-started/react-methods/react-methods', onlyFor: ['react'] },
  { path: 'guides/getting-started/angular-hot-instance/angular-hot-instance', onlyFor: ['angular'] },
  { path: 'guides/getting-started/vue3-hot-reference/vue3-hot-reference', onlyFor: ['vue'] },
  { path: 'guides/getting-started/vue3-nuxt/vue3-nuxt', onlyFor: ['vue'] },
  { path: 'guides/getting-started/license-key/license-key' },
  { path: 'guides/getting-started/react-redux/react-redux', onlyFor: ['react'] },
  { path: 'guides/getting-started/vue3-custom-id-class-style/vue3-custom-id-class-style', onlyFor: ['vue'] },
  { path: 'guides/getting-started/vue3-vuex/vue3-vuex', onlyFor: ['vue'] },
];

const stylingItems = [
  { path: 'guides/styling/themes/themes' },
  { path: 'guides/styling/design-system/design-system' },
  { path: 'guides/styling/theme-customization/theme-customization' },
  { path: 'guides/styling/legacy-style/legacy-style' },
];

const serverSideItems = [
  { path: 'guides/getting-started/server-side-data/server-side-data' },
  { path: 'guides/getting-started/server-side-data/server-side-data-migration' },
  { path: 'guides/getting-started/server-side-data/server-side-data-configuration' },
  { path: 'guides/getting-started/server-side-data/server-side-data-crud' },
  { path: 'guides/getting-started/server-side-data/server-side-data-fetching' },
];

const dataManagementItems = [
  { path: 'guides/getting-started/binding-to-data/binding-to-data' },
  { path: 'guides/getting-started/saving-data/saving-data' },
  { path: 'guides/getting-started/events-and-hooks/events-and-hooks' },
  { path: 'guides/accessories-and-menus/export-to-excel/export-to-excel' },
  { path: 'guides/accessories-and-menus/export-to-csv/export-to-csv' },
  { path: 'guides/cell-features/clipboard/clipboard' },
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
  { path: 'guides/integrate-with-vue3/vue3-formulas-example/vue3-formulas-example' },
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
  { path: 'guides/rows/rows-pagination/rows-pagination' },
  { path: 'guides/rows/row-trimming/row-trimming' },
  { path: 'guides/rows/row-prepopulating/row-prepopulating' },
];

const cellFeaturesItems = [
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
  { path: 'guides/cell-functions/custom-cells/custom-cells' },
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
  { path: 'guides/cell-types/multiselect-cell-type/multiselect-cell-type' },
  { path: 'guides/cell-types/password-cell-type/password-cell-type' },
  { path: 'guides/cell-types/handsontable-cell-type/handsontable-cell-type' },
];

const formulasItems = [
  { path: 'guides/formulas/formula-calculation/formula-calculation' },
];

const navigationAndAccessibilityItems = [
  { path: 'guides/navigation/keyboard-shortcuts/keyboard-shortcuts' },
  { path: 'guides/navigation/custom-shortcuts/custom-shortcuts' },
  { path: 'guides/navigation/focus-scopes/focus-scopes' },
  { path: 'guides/navigation/searching-values/searching-values' },
  { path: 'guides/accessibility/accessibility/accessibility' },
  { path: 'guides/accessibility/accessibility-conformance-report/accessibility-conformance-report' },
];

const accessoriesAndMenusItems = [
  { path: 'guides/accessories-and-menus/context-menu/context-menu' },
  { path: 'guides/accessories-and-menus/drag-to-scroll/drag-to-scroll' },
  { path: 'guides/accessories-and-menus/undo-redo/undo-redo' },
  { path: 'guides/accessories-and-menus/icon-pack/icon-pack' },
  { path: 'guides/accessories-and-menus/empty-data-state/empty-data-state' },
  { path: 'guides/dialog/dialog/dialog' },
  { path: 'guides/dialog/loading/loading' },
  { path: 'guides/dialog/notification/notification' },
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
  { path: 'guides/tools-and-building/typescript-types/typescript-types' },
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

const changelogItems = [
  { path: 'guides/upgrade-and-migration/changelog-17/changelog-17' },
  { path: 'guides/upgrade-and-migration/changelog-16/changelog-16' },
  { path: 'guides/upgrade-and-migration/changelog-15/changelog-15' },
  { path: 'guides/upgrade-and-migration/changelog-14/changelog-14' },
  { path: 'guides/upgrade-and-migration/changelog-13/changelog-13' },
  { path: 'guides/upgrade-and-migration/changelog-12/changelog-12' },
  { path: 'guides/upgrade-and-migration/changelog-11/changelog-11' },
  { path: 'guides/upgrade-and-migration/changelog-10/changelog-10' },
  { path: 'guides/upgrade-and-migration/changelog-9/changelog-9' },
  { path: 'guides/upgrade-and-migration/changelog-8/changelog-8' },
  { path: 'guides/upgrade-and-migration/changelog-7/changelog-7' },
];

const upgradeAndMigrationItems = [
  ...changelogItems,
  { path: 'guides/upgrade-and-migration/versioning-policy/versioning-policy' },
  { path: 'guides/upgrade-and-migration/deprecation-policy/deprecation-policy' },
  { path: 'guides/upgrade-and-migration/long-term-support/long-term-support' },
  { path: 'guides/upgrade-and-migration/migrating-from-17.1-to-18.0/migrating-from-17.1-to-18.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-16.2-to-17.0/migrating-from-16.2-to-17.0' },
  { path: 'guides/upgrade-and-migration/migrating-from-16.0-to-16.1/migrating-from-16.0-to-16.1' },
  { path: 'guides/upgrade-and-migration/migrating-from-15.3-to-16.0/migrating-from-15.3-to-16.0' },
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
    { title: 'Server-side data', children: serverSideItems },
    { title: 'Data management', children: dataManagementItems },
    { title: 'Accessories and menus', children: accessoriesAndMenusItems },
    { title: 'Internationalization', children: internationalizationItems },
    { title: 'Accessibility and navigation', children: navigationAndAccessibilityItems },
    { title: 'Integrate with Vue', children: integrateWithVue3Items },
    { title: 'Tools and building', children: buildingAndToolingItems },
    { title: 'Optimization', children: optimizationItems },
    { title: 'Security', children: securityItems },
    { title: 'Technical specification', children: technicalSpecificationItems },
    { title: 'Upgrade and migration', children: upgradeAndMigrationItems }
  ],
};
