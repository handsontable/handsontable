// A barrel passes on every name of a module, so the names a rule changes reach the files that import from it.
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Check Settings, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
// TODO(handsontable-codemod 18.0.0/type-plugin-detailedsettings): Check DetailedSettings, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
// TODO(handsontable-codemod 18.0.0/type-sortordertype): Check SortOrderType, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-columnsorting-config): Replace "handsontable/plugins/columnSorting" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export * from 'handsontable/plugins/columnSorting';
// TODO(handsontable-codemod 18.0.0/type-nestedheaders-settings): Check Settings, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
// TODO(handsontable-codemod 18.0.0/type-nestedheaders-detailedsettings): Replace "handsontable/plugins/nestedHeaders" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
export * as nested from 'handsontable/plugins/nestedHeaders';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Check Settings, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
// TODO(handsontable-codemod 18.0.0/type-filters-conditionname): Check ConditionName, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-filters-config): Check FiltersConfig, CellLikeData, which this export * may pass on. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
// TODO(handsontable-codemod 18.0.0/type-filters-operationtype): Replace "handsontable/plugins/filters" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export type * from 'handsontable/plugins/filters';
// TODO(handsontable-codemod 18.0.0/type-registry-maps): Check CellTypes, Editors, Renderers, Validators, which this export * may pass on.
export * from 'handsontable/editors';
// TODO(handsontable-codemod 18.0.0/theme-registry-imports-main): Replace "handsontable" here by hand. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#import-the-theme-functions-from-the-themes-entry-point
export * from 'handsontable';

// Another module, and a file of the project: nothing to say.
export * from 'other-grid/plugins/columnSorting';
export * from './grid-types';
