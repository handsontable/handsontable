import Handsontable from 'handsontable';

// TODO(handsontable-codemod 18.0.0/ns-dataprovider-settings): Use `DataProviderConfig | undefined` (import type { DataProviderConfig } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let provider: Handsontable.plugins.DataProvider.Settings;
// TODO(handsontable-codemod 18.0.0/ns-nestedheaders-settings): Use `NestedHeader[][]` (import type { NestedHeader } from 'handsontable/plugins/nestedHeaders')... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export let nested: Handsontable.plugins.NestedHeaders.Settings;
// TODO(handsontable-codemod 18.0.0/ns-sortordertype): Use `Exclude<ColumnSortingConfig['sortOrder'], 'none'>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let order: Handsontable.plugins.ColumnSorting.SortOrderType;
// TODO(handsontable-codemod 18.0.0/ns-sortordertype): Use `Exclude<ColumnSortingConfig['sortOrder'], 'none'>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let multiOrder: Handsontable.plugins.MultiColumnSorting.SortOrderType;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let condition: Handsontable.plugins.Filters.ConditionName;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let formulas: Handsontable.plugins.Formulas.HyperFormulaSettings;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let callback: Handsontable.plugins.Search.SearchCallback;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let query: Handsontable.plugins.Search.SearchQueryMethod;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let menu: Handsontable.plugins.ContextMenu.MenuConfig;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let selection: Handsontable.plugins.ContextMenu.Selection;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let submenu: Handsontable.plugins.ContextMenu.SubmenuConfig;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let submenuItem: Handsontable.plugins.ContextMenu.SubmenuItemConfig;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let comments: Handsontable.plugins.Comments.CommentConfig;
// TODO(handsontable-codemod 18.0.0/ns-plugin-types-removed): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
export let borderRange: Handsontable.plugins.CustomBorders.BorderRange;
// TODO(handsontable-codemod 18.0.0/ns-recordtranslation-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let changes: Handsontable.RecordTranslation.ChangesEventData;
// TODO(handsontable-codemod 18.0.0/ns-recordtranslation-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let observer: Handsontable.RecordTranslation.ChangesObserver;
// TODO(handsontable-codemod 18.0.0/ns-recordtranslation-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let mapTypes: Handsontable.RecordTranslation.MapTypes;
// TODO(handsontable-codemod 18.0.0/ns-helper-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let comparator: Handsontable.helper.Comparator;
// TODO(handsontable-codemod 18.0.0/ns-helper-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let debounced: Handsontable.helper.DebouncedFunction;
// TODO(handsontable-codemod 18.0.0/ns-intl-celltype): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let intlDate: Handsontable.cellTypes.intlDate.cellType;
// TODO(handsontable-codemod 18.0.0/ns-intl-celltype): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let intlTime: Handsontable.cellTypes.intlTime.cellType;
// TODO(handsontable-codemod 18.0.0/ns-languages-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let dictionary: Handsontable.languages.dictionaryKeys;
// TODO(handsontable-codemod 18.0.0/ns-languages-types): Remove this reference or describe the shape inline, because 18.0 removed it from the... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-removed-handsontable-namespace-types
export let other: Handsontable.languages.languageDictionary;
export const loaded = Handsontable.languages.getLanguageDictionary('en-US');
