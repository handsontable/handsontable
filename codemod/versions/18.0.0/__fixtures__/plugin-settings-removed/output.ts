// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['fillHandle']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
import type { Settings as AutofillSettings } from 'handsontable/plugins/autofill';
// TODO(handsontable-codemod 18.0.0/type-boolean-settings): Settings: Use `boolean`. `GridSettings` has no typed key for the touchScroll option in 18.0. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
import type { Settings } from 'handsontable/plugins/touchScroll';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['contextMenu']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
// TODO(handsontable-codemod 18.0.0/type-contextmenu-detailedsettings): DetailedSettings: Remove the annotation and type the callback parameters yourself. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-detailedsettings
import type { DetailedSettings, MenuItemConfig, Settings as MenuSettings } from 'handsontable/plugins/contextMenu';
// TODO(handsontable-codemod 18.0.0/type-nestedheaders-settings): Settings: Use `NestedHeader[][]` (import type { NestedHeader } from... See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
import type { Settings as NestedSettings } from 'handsontable/plugins/nestedHeaders';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['stretchH']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
import type { Settings as StretchSettings } from 'handsontable/plugins/stretchColumns';
// TODO(handsontable-codemod 18.0.0/type-sortordertype): SortOrderType: Use `Exclude<ColumnSortingConfig['sortOrder'], 'none'>`. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-other-removed-plugin-types
import type { SortOrderType } from 'handsontable/plugins/columnSorting';

// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['filters']` (import type { GridSettings } from 'handsontable'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
export type { Settings as FiltersSettings } from 'handsontable/plugins/filters';

export const fill: AutofillSettings = true;

export const touch: Settings = true;

export const menu: DetailedSettings & MenuSettings = {};

export const item: MenuItemConfig = { name: 'Copy' };

export const nested: NestedSettings = [];

export const stretch: StretchSettings = true;

export const order: SortOrderType = 'asc';

// TODO(handsontable-codemod 18.0.0/type-notification-settings): Settings: Use `boolean | NotificationConfig` (from 'handsontable/plugins/notification'). See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-settings
import type { Settings as NotificationSettings } from 'handsontable/plugins/notification';

export const notice: NotificationSettings = true;
