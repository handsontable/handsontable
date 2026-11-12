// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['fillHandle']` (import type { GridSettings } from 'handsontable').
import type { Settings as AutofillSettings } from 'handsontable/plugins/autofill';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: The touchScroll plugin has no typed option in 18.0, so there is no replacement type.
import type { Settings } from 'handsontable/plugins/touchScroll';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['contextMenu']` (import type { GridSettings } from 'handsontable').
// TODO(handsontable-codemod 18.0.0/type-contextmenu-detailedsettings): DetailedSettings: Remove the annotation and type the callback parameters yourself. See https://handsontable.com/docs/javascript-data-grid/migration-from-17.1-to-18.0#replace-the-removed-detailedsettings-type-exports
import type { DetailedSettings, MenuItemConfig, Settings as MenuSettings } from 'handsontable/plugins/contextMenu';
// TODO(handsontable-codemod 18.0.0/type-nestedheaders-settings): Settings: Use `NestedHeader[][]` (import type { NestedHeader } from...
import type { Settings as NestedSettings } from 'handsontable/plugins/nestedHeaders';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['stretchH']` (import type { GridSettings } from 'handsontable').
import type { Settings as StretchSettings } from 'handsontable/plugins/stretchColumns';
// TODO(handsontable-codemod 18.0.0/type-sortordertype): SortOrderType: Use the inline union `'asc' | 'desc'`.
import type { SortOrderType } from 'handsontable/plugins/columnSorting';

// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings: Use `GridSettings['filters']` (import type { GridSettings } from 'handsontable').
export type { Settings as FiltersSettings } from 'handsontable/plugins/filters';

export const fill: AutofillSettings = true;

export const touch: Settings = true;

export const menu: DetailedSettings & MenuSettings = {};

export const item: MenuItemConfig = { name: 'Copy' };

export const nested: NestedSettings = [];

export const stretch: StretchSettings = true;

export const order: SortOrderType = 'asc';
