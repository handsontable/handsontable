// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings is no longer exported from "handsontable/plugins/autofill". Use `GridSettings['fillHandle']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
import type { Settings as AutofillSettings } from 'handsontable/plugins/autofill';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings is no longer exported from "handsontable/plugins/touchScroll". The touchScroll plugin has no typed option in 18.0, so there is no replacement type. Use `GridSettings`, which accepts any key, or read the settings from the plugin instance.
import type { Settings } from 'handsontable/plugins/touchScroll';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings is no longer exported from "handsontable/plugins/contextMenu". Use `GridSettings['contextMenu']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
// TODO(handsontable-codemod 18.0.0/type-contextmenu-detailedsettings): DetailedSettings is no longer exported from "handsontable/plugins/contextMenu". Remove the annotation and type the callback parameters yourself. To type one menu item, use `MenuItemConfig` from 'handsontable/plugins/contextMenu'.
import type { DetailedSettings, MenuItemConfig, Settings as MenuSettings } from 'handsontable/plugins/contextMenu';
// TODO(handsontable-codemod 18.0.0/type-nestedheaders-settings): Settings is no longer exported from "handsontable/plugins/nestedHeaders". Use `NestedHeader[][]` (import type { NestedHeader } from 'handsontable/plugins/nestedHeaders'), or `GridSettings['nestedHeaders']`.
import type { Settings as NestedSettings } from 'handsontable/plugins/nestedHeaders';
// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings is no longer exported from "handsontable/plugins/stretchColumns". Use `GridSettings['stretchH']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
import type { Settings as StretchSettings } from 'handsontable/plugins/stretchColumns';
// TODO(handsontable-codemod 18.0.0/type-sortordertype): SortOrderType is no longer exported from "handsontable/plugins/columnSorting". Use the inline union `'asc' | 'desc'`. ColumnSortingConfig also accepts 'none'.
import type { SortOrderType } from 'handsontable/plugins/columnSorting';

// TODO(handsontable-codemod 18.0.0/type-plugin-settings): Settings is no longer exported from "handsontable/plugins/filters". Use `GridSettings['filters']` (import type { GridSettings } from 'handsontable'). The option is typed loosely in 18.0, often `boolean | object`.
export type { Settings as FiltersSettings } from 'handsontable/plugins/filters';

export const fill: AutofillSettings = true;

export const touch: Settings = true;

export const menu: DetailedSettings & MenuSettings = {};

export const item: MenuItemConfig = { name: 'Copy' };

export const nested: NestedSettings = [];

export const stretch: StretchSettings = true;

export const order: SortOrderType = 'asc';
